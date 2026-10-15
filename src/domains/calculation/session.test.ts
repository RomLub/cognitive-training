import { describe, expect, it } from 'vitest'
import { buildSessionRecord, parseAnswer } from './session'

describe('parseAnswer', () => {
  it('accepts integers with surrounding or grouping spaces', () => {
    expect(parseAnswer('42')).toBe(42)
    expect(parseAnswer(' 1 024 ')).toBe(1024)
    expect(parseAnswer('-7')).toBe(-7)
  })

  it('rejects non-integers', () => {
    expect(parseAnswer('')).toBeNull()
    expect(parseAnswer('4.2')).toBeNull()
    expect(parseAnswer('abc')).toBeNull()
    expect(parseAnswer('1e3')).toBeNull()
  })
})

describe('buildSessionRecord', () => {
  it('summarizes results', () => {
    const record = buildSessionRecord({
      id: 'x',
      startedAt: new Date('2026-10-15T10:00:00Z'),
      startLevel: 2,
      endLevel: 3,
      results: [
        { level: 2, correct: true, responseMs: 1000 },
        { level: 2, correct: false, responseMs: 3000 },
      ],
    })
    expect(record).toEqual({
      id: 'x',
      domain: 'calculation',
      startedAt: '2026-10-15T10:00:00.000Z',
      startLevel: 2,
      endLevel: 3,
      items: 2,
      correct: 1,
      avgResponseMs: 2000,
    })
  })
})
