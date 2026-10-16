import type { SessionRecord } from '../core/types'
import type { RemoteSessionStore } from './cloud'

export interface SyncDiff {
  /** On this device only: to send. */
  toUpload: SessionRecord[]
  /** Remote only (made on another device): to add locally. */
  toDownload: SessionRecord[]
}

/** Sessions never change once saved, so syncing is a union by id. */
export function diffSessions(local: readonly SessionRecord[], remote: readonly SessionRecord[]): SyncDiff {
  const localIds = new Set(local.map((r) => r.id))
  const remoteIds = new Set(remote.map((r) => r.id))
  return {
    toUpload: local.filter((r) => !remoteIds.has(r.id)),
    toDownload: remote.filter((r) => !localIds.has(r.id)),
  }
}

export interface LocalSessionStore {
  list(): SessionRecord[]
  addMany(records: readonly SessionRecord[]): void
}

export interface SyncResult {
  uploaded: number
  downloaded: number
}

/** Two-way sync: uploads local-only sessions, then stores sessions made on other devices. */
export async function syncSessions(local: LocalSessionStore, remote: RemoteSessionStore): Promise<SyncResult> {
  const remoteRecords = await remote.fetchAll()
  const { toUpload, toDownload } = diffSessions(local.list(), remoteRecords)
  if (toUpload.length > 0) await remote.upload(toUpload)
  if (toDownload.length > 0) local.addMany(toDownload)
  return { uploaded: toUpload.length, downloaded: toDownload.length }
}
