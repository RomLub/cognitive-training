import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionRecord } from '../core/types'
import { LocalStorageSessionRepository, STORAGE_KEY } from '../storage/sessionRepository'
import type { RemoteSessionStore } from './cloud'
import { fromRow, toRow } from './supabaseCloud'
import { diffSessions, syncSessions } from './syncSessions'

function session(id: string, day = 1): SessionRecord {
  return {
    id, domain: 'calculation', exercise: 'arithmetic', startedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    startLevel: 1, endLevel: 2, items: 10, correct: 8, avgResponseMs: 2000,
  }
}

class FakeRemote implements RemoteSessionStore {
  records: SessionRecord[] = []
  uploads: SessionRecord[][] = []
  async fetchAll() {
    return [...this.records]
  }
  async upload(records: readonly SessionRecord[]) {
    this.uploads.push([...records])
    for (const r of records) if (!this.records.some((x) => x.id === r.id)) this.records.push(r)
  }
}

describe('diffSessions', () => {
  it('uploads local-only sessions and downloads remote-only ones', () => {
    const d = diffSessions([session('a'), session('b')], [session('b'), session('c')])
    expect(d.toUpload.map((r) => r.id)).toEqual(['a'])
    expect(d.toDownload.map((r) => r.id)).toEqual(['c'])
  })

  it('has nothing to do when both sides match', () => {
    expect(diffSessions([session('a')], [session('a')])).toEqual({ toUpload: [], toDownload: [] })
  })
})

describe('syncSessions', () => {
  beforeEach(() => localStorage.clear())

  it('converges two devices through the remote store', async () => {
    const remote = new FakeRemote()
    const pc = new LocalStorageSessionRepository()
    pc.add(session('pc-1', 1))
    expect(await syncSessions(pc, remote)).toEqual({ uploaded: 1, downloaded: 0 })

    // The phone has its own storage: simulate it with an in-memory Storage.
    const phoneStorage = new Map<string, string>()
    const phone = new LocalStorageSessionRepository({
      getItem: (k: string) => phoneStorage.get(k) ?? null,
      setItem: (k: string, v: string) => void phoneStorage.set(k, v),
    } as unknown as Storage)
    phone.add(session('phone-1', 2))
    expect(await syncSessions(phone, remote)).toEqual({ uploaded: 1, downloaded: 1 })
    expect(await syncSessions(pc, remote)).toEqual({ uploaded: 0, downloaded: 1 })

    expect(pc.list().map((r) => r.id).sort()).toEqual(['pc-1', 'phone-1'])
    expect(phone.list().map((r) => r.id).sort()).toEqual(['pc-1', 'phone-1'])
    // A second sync sends nothing.
    expect(await syncSessions(pc, remote)).toEqual({ uploaded: 0, downloaded: 0 })
  })

  it('does not touch local data when the remote fails', async () => {
    const pc = new LocalStorageSessionRepository()
    pc.add(session('a'))
    const broken: RemoteSessionStore = {
      fetchAll: async () => {
        throw new Error('réseau')
      },
      upload: async () => {},
    }
    await expect(syncSessions(pc, broken)).rejects.toThrow('réseau')
    expect(pc.list()).toHaveLength(1)
  })
})

describe('LocalStorageSessionRepository.addMany', () => {
  beforeEach(() => localStorage.clear())

  it('adds new sessions and skips ids already present', () => {
    const repo = new LocalStorageSessionRepository()
    repo.add(session('a'))
    repo.addMany([session('a'), session('b'), session('b')])
    expect(repo.list().map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('refuses invalid sessions without writing anything', () => {
    const repo = new LocalStorageSessionRepository()
    const bad = { ...session('x'), domain: 'nope' } as unknown as SessionRecord
    expect(() => repo.addMany([session('ok'), bad])).toThrow()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('server rows', () => {
  it('round-trips a session', () => {
    const s = { ...session('a'), breakdown: { '+': { items: 10, correct: 8, totalResponseMs: 20000 } } }
    expect(fromRow(toRow(s))).toEqual(s)
    expect(toRow(s)).toMatchObject({ id: 'a', started_at: s.startedAt })
  })

  it('migrates legacy rows and rejects malformed or mismatched ones', () => {
    const { exercise: _dropped, ...legacy } = session('old')
    expect(fromRow({ id: 'old', started_at: legacy.startedAt, record: legacy }).exercise).toBe('arithmetic')
    expect(() => fromRow({ id: 'x', started_at: '', record: { id: 'x' } })).toThrow(/invalide/)
    expect(() => fromRow({ id: 'other', started_at: '', record: session('a') })).toThrow(/invalide/)
  })
})
