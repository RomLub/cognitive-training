import { isCognitiveDomain, type CognitiveDomain, type SessionRecord } from '../core/types'

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

/** Bump when SessionRecord changes shape incompatibly, and add a migration. */
export const STORAGE_KEY = 'cognitive-training:sessions:v1'

/**
 * Sessions saved before exercises existed have no `exercise` field: each domain had a single exercise.
 * They are migrated on read to that exercise, so history, levels and weak points carry over.
 */
export const LEGACY_EXERCISE_BY_DOMAIN: Readonly<Partial<Record<CognitiveDomain, string>>> = {
  calculation: 'arithmetic',
  memory: 'digit-span',
  attention: 'stroop',
  logic: 'number-series',
  speed: 'pair-compare',
}

type StoredRecord = Omit<SessionRecord, 'exercise'> & { exercise?: string }

function isStoredRecord(value: unknown): value is StoredRecord {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.domain === 'string' &&
    isCognitiveDomain(r.domain) &&
    (r.exercise === undefined || (typeof r.exercise === 'string' && r.exercise.length > 0)) &&
    typeof r.startedAt === 'string' &&
    typeof r.startLevel === 'number' &&
    typeof r.endLevel === 'number' &&
    typeof r.items === 'number' &&
    typeof r.correct === 'number' &&
    typeof r.avgResponseMs === 'number' &&
    (r.breakdown === undefined || isBreakdown(r.breakdown))
  )
}

function isBreakdown(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value).every((t: unknown) => {
    if (typeof t !== 'object' || t === null) return false
    const c = t as Record<string, unknown>
    return typeof c.items === 'number' && typeof c.correct === 'number' && typeof c.totalResponseMs === 'number'
  })
}

/** Fills in the exercise of legacy records; null when it cannot be inferred. */
function migrate(record: StoredRecord): SessionRecord | null {
  if (record.exercise !== undefined) return { ...record, exercise: record.exercise }
  const legacy = LEGACY_EXERCISE_BY_DOMAIN[record.domain]
  return legacy === undefined ? null : { ...record, exercise: legacy }
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
    return parsed.map((item: unknown, index) => {
      const migrated = isStoredRecord(item) ? migrate(item) : null
      if (migrated === null) throw new StorageCorruptedError(`Invalid session record at index ${index}`)
      return migrated
    })
  }

  add(record: SessionRecord): void {
    const exercise: unknown = (record as { exercise?: unknown }).exercise
    if (!isStoredRecord(record) || typeof exercise !== 'string') throw new Error('Refusing to store an invalid session record')
    const records = this.list()
    records.push(record)
    this.storage.setItem(STORAGE_KEY, JSON.stringify(records))
  }
}
