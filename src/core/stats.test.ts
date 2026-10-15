import { describe, expect, it } from 'vitest'
import { accuracy, domainProgress, summarizeItems } from './stats'
import type { SessionRecord } from './types'

function session(day: number, correct: number, endLevel: number): SessionRecord {
  return {
    id: `s${day}`,
    domain: 'calculation',
    startedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    startLevel: 1,
    endLevel,
    items: 10,
    correct,
    avgResponseMs: 2000,
  }
}

describe('stats', () => {
  it('summarizes empty results without dividing by zero', () => {
    expect(summarizeItems([])).toEqual({ items: 0, correct: 0, avgResponseMs: 0 })
    expect(accuracy({ items: 0, correct: 0 })).toBe(0)
  })

  it('reports no progress for an untrained domain', () => {
    expect(domainProgress('calculation', [])).toEqual({
      domain: 'calculation',
      sessions: 0,
      currentLevel: null,
      bestLevel: null,
      accuracyTrend: null,
    })
  })

  it('uses the most recent session for the current level, regardless of input order', () => {
    const p = domainProgress('calculation', [session(3, 5, 2), session(1, 5, 6), session(2, 5, 4)])
    expect(p.currentLevel).toBe(2)
    expect(p.bestLevel).toBe(6)
    expect(p.accuracyTrend).toBeNull()
  })

  it('computes accuracy trend between the last 5 and the previous 5 sessions', () => {
    const older = [1, 2, 3, 4, 5].map((d) => session(d, 6, 3))
    const recent = [6, 7, 8, 9, 10].map((d) => session(d, 8, 4))
    expect(domainProgress('calculation', [...older, ...recent]).accuracyTrend).toBeCloseTo(0.2)
  })

  it('ignores other domains', () => {
    const other: SessionRecord = { ...session(1, 10, 9), domain: 'memory' }
    expect(domainProgress('calculation', [other]).sessions).toBe(0)
  })
})
