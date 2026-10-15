import { beforeEach, describe, expect, it } from 'vitest'
import type { SessionRecord } from '../core/types'
import { LocalStorageSessionRepository, STORAGE_KEY, StorageCorruptedError } from './sessionRepository'

const record: SessionRecord = {
  id: 'a',
  domain: 'calculation',
  startedAt: '2026-10-15T10:00:00.000Z',
  startLevel: 1,
  endLevel: 2,
  items: 20,
  correct: 18,
  avgResponseMs: 2500,
}

describe('LocalStorageSessionRepository', () => {
  beforeEach(() => localStorage.clear())

  it('returns an empty list when nothing is stored', () => {
    expect(new LocalStorageSessionRepository().list()).toEqual([])
  })

  it('persists and reloads records', () => {
    new LocalStorageSessionRepository().add(record)
    new LocalStorageSessionRepository().add({ ...record, id: 'b' })
    expect(new LocalStorageSessionRepository().list().map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('fails loudly on corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(() => new LocalStorageSessionRepository().list()).toThrow(StorageCorruptedError)
  })

  it('fails loudly on invalid records', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, { id: 'bad' }]))
    expect(() => new LocalStorageSessionRepository().list()).toThrow(/index 1/)
  })

  it('refuses to store invalid records', () => {
    const bad = { ...record, domain: 'unknown' } as unknown as SessionRecord
    expect(() => new LocalStorageSessionRepository().add(bad)).toThrow()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
