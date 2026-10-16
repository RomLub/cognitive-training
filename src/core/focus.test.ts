import { describe, expect, it } from 'vitest'
import { analyzeCategories, RECENT_WINDOW } from './focus'
import type { SessionRecord } from './types'

type Op = '+' | '×'
const isOp = (v: string): v is Op => v === '+' || v === '×'

function session(day: number, breakdown: SessionRecord['breakdown']): SessionRecord {
  return {
    id: `s${day}`, domain: 'calculation', exercise: 'arithmetic',
    startedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    startLevel: 5, endLevel: 5, items: 20, correct: 15, avgResponseMs: 3000, breakdown,
  }
}

describe('analyzeCategories', () => {
  it('returns the weakest category', () => {
    const sessions = [session(1, { '+': { items: 10, correct: 10, totalResponseMs: 1 }, '×': { items: 10, correct: 4, totalResponseMs: 1 } })]
    expect(analyzeCategories(sessions, isOp, 'Opérations').weakest?.category).toBe('×')
  })

  it('returns no weak point without history', () => {
    expect(analyzeCategories([], isOp, 'Opérations').weakest).toBeNull()
  })

  it('only looks at the recent window', () => {
    const old = session(1, { '×': { items: 50, correct: 0, totalResponseMs: 1 } })
    const recent = Array.from({ length: RECENT_WINDOW }, (_, i) =>
      session(i + 2, { '×': { items: 10, correct: 10, totalResponseMs: 1 }, '+': { items: 10, correct: 9, totalResponseMs: 1 } }),
    )
    expect(analyzeCategories([old, ...recent], isOp, 'Opérations').weakest?.category).toBe('+')
  })

  it('fails loudly on an unknown category', () => {
    const sessions = [session(1, { '%': { items: 10, correct: 1, totalResponseMs: 1 } })]
    expect(() => analyzeCategories(sessions, isOp, 'Opérations')).toThrow(/Unknown Opérations category/)
  })
})
