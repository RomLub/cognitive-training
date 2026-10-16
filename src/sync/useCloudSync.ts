import { useCallback, useEffect, useRef, useState } from 'react'
import type { Cloud, CloudUser } from './cloud'
import { syncSessions, type LocalSessionStore } from './syncSessions'

export type SyncStatus = 'disabled' | 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error'

export interface CloudSync {
  status: SyncStatus
  user: CloudUser | null
  lastSyncAt: Date | null
  error: string | null
  /** Runs a sync now (no-op when signed out); concurrent calls are coalesced into one more run. */
  syncNow: () => void
}

/**
 * Keeps the local history in sync with the cloud: on sign-in, when the network comes back, and on demand
 * (the app calls syncNow after each session). `onLocalChange` runs when sessions from other devices arrive.
 */
export function useCloudSync(cloud: Cloud | null, local: LocalSessionStore, onLocalChange: () => void): CloudSync {
  const [user, setUser] = useState<CloudUser | null>(null)
  const [status, setStatus] = useState<SyncStatus>(cloud === null ? 'disabled' : 'signed-out')
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const userRef = useRef<CloudUser | null>(null)
  const running = useRef(false)
  const rerun = useRef(false)
  const onLocalChangeRef = useRef(onLocalChange)
  useEffect(() => {
    onLocalChangeRef.current = onLocalChange
  })

  const syncNow = useCallback(() => {
    if (cloud === null || userRef.current === null) return
    if (running.current) {
      rerun.current = true
      return
    }
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    running.current = true
    setStatus('syncing')
    void (async () => {
      try {
        do {
          rerun.current = false
          const result = await syncSessions(local, cloud.remote)
          if (result.downloaded > 0) onLocalChangeRef.current()
        } while (rerun.current)
        setStatus('synced')
        setError(null)
        setLastSyncAt(new Date())
      } catch (err) {
        console.error('Sync failed', err)
        setStatus(navigator.onLine ? 'error' : 'offline')
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        running.current = false
      }
    })()
  }, [cloud, local])

  // Track the signed-in user; signing in triggers a sync.
  useEffect(() => {
    if (cloud === null) return
    let active = true
    // An auth event is fresher than the initial session read, which may resolve after it.
    let eventSeen = false
    const apply = (next: CloudUser | null) => {
      if (!active) return
      const changed = next?.id !== userRef.current?.id
      userRef.current = next
      setUser(next)
      if (next === null) setStatus('signed-out')
      else if (changed) syncNow()
    }
    cloud.auth
      .currentUser()
      .then((initial) => {
        if (!eventSeen) apply(initial)
      })
      .catch((err: unknown) => {
        console.error('Could not read the cloud session', err)
        if (active) setError(err instanceof Error ? err.message : String(err))
      })
    const unsubscribe = cloud.auth.onChange((next) => {
      eventSeen = true
      apply(next)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [cloud, syncNow])

  useEffect(() => {
    window.addEventListener('online', syncNow)
    return () => window.removeEventListener('online', syncNow)
  }, [syncNow])

  return { status, user, lastSyncAt, error, syncNow }
}
