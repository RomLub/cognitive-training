import { describe, expect, it } from 'vitest'
import type { SessionRecord } from '../../core/types'
import { RECENT_WINDOW } from '../../core/focus'
import { analyzeOperators } from './focus'

function session(day: number, breakdown: SessionRecord['breakdown']): SessionRecord {
  return {
    id: `s${day}`,
    domain: 'calculation',
    startedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    startLevel: 5,
    endLevel: 5,
    items: 20,
    correct: 15,
    avgResponseMs: 3000,
    breakdown,
  }
}

describe('analyzeOperators', () => {
  it('returns the weakest operator', () => {
    const records = [
      session(1, { '+': { items: 10, correct: 10, totalResponseMs: 1 }, '×': { items: 10, correct: 4, totalResponseMs: 1 } }),
    ]
    expect(analyzeOperators(records).weakest?.category).toBe('×')
  })

  it('returns no weak point without history', () => {
    expect(analyzeOperators([]).weakest).toBeNull()
  })

  it('only looks at the recent window', () => {
    const old = session(1, { '-': { items: 50, correct: 0, totalResponseMs: 1 } })
    const recent = Array.from({ length: RECENT_WINDOW }, (_, i) =>
      session(i + 2, { '-': { items: 10, correct: 10, totalResponseMs: 1 }, '+': { items: 10, correct: 9, totalResponseMs: 1 } }),
    )
    expect(analyzeOperators([old, ...recent]).weakest?.category).toBe('+')
  })

  it('fails loudly on an unknown category', () => {
    const records = [session(1, { '%': { items: 10, correct: 1, totalResponseMs: 1 } })]
    expect(() => analyzeOperators(records)).toThrow(/Unknown calculation category/)
  })
})
