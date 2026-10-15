import type { CognitiveDomain, SessionRecord } from '../core/types'

/** Storage abstraction so localStorage can later be swapped for IndexedDB or a backend. */
export interface SessionRepository {
  list(): SessionRecord[]
  add(record: SessionRecord): void
}

export class StorageCorruptedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageCorruptedError'
  }
}

/** Bump when SessionRecord changes shape, and add a migration. */
export const STORAGE_KEY = 'cognitive-training:sessions:v1'

const DOMAINS: readonly CognitiveDomain[] = ['calculation', 'memory', 'attention', 'logic', 'speed']

function isSessionRecord(value: unknown): value is SessionRecord {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.domain === 'string' &&
    (DOMAINS as readonly string[]).includes(r.domain) &&
    typeof r.startedAt === 'string' &&
    typeof r.startLevel === 'number' &&
    typeof r.endLevel === 'number' &&
    typeof r.items === 'number' &&
    typeof r.correct === 'number' &&
    typeof r.avgResponseMs === 'number'
  )
}

export class LocalStorageSessionRepository implements SessionRepository {
  private readonly storage: Storage

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage
  }

  list(): SessionRecord[] {
    const raw = this.storage.getItem(STORAGE_KEY)
    if (raw === null) return []
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new StorageCorruptedError(`Invalid JSON under "${STORAGE_KEY}"`)
    }
    if (!Array.isArray(parsed)) {
      throw new StorageCorruptedError(`Expected an array under "${STORAGE_KEY}"`)
    }
    const invalidIndex = parsed.findIndex((item) => !isSessionRecord(item))
    if (invalidIndex !== -1) {
      throw new StorageCorruptedError(`Invalid session record at index ${invalidIndex}`)
    }
    return parsed as SessionRecord[]
  }

  add(record: SessionRecord): void {
    if (!isSessionRecord(record)) throw new Error('Refusing to store an invalid session record')
    const records = this.list()
    records.push(record)
    this.storage.setItem(STORAGE_KEY, JSON.stringify(records))
  }
}
