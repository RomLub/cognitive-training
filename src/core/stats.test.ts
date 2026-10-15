import { describe, expect, it } from 'vitest'
import {
  accuracy,
  categoryStats,
  domainProgress,
  MIN_ITEMS_FOR_WEAKNESS,
  recentSessions,
  summarizeItems,
  weakestCategory,
  type CategoryStats,
} from './stats'
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
    expect(summarizeItems([])).toEqual({ items: 0, correct: 0, avgResponseMs: 0, breakdown: {} })
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

describe('per-category stats', () => {
  it('groups item results by category', () => {
    const { breakdown } = summarizeItems([
      { level: 1, category: '+', correct: true, responseMs: 1000 },
      { level: 1, category: '+', correct: false, responseMs: 2000 },
      { level: 1, category: '÷', correct: true, responseMs: 4000 },
    ])
    expect(breakdown).toEqual({
      '+': { items: 2, correct: 1, totalResponseMs: 3000 },
      '÷': { items: 1, correct: 1, totalResponseMs: 4000 },
    })
  })

  it('merges breakdowns across sessions and skips legacy sessions without one', () => {
    const stats = categoryStats([
      { breakdown: { '×': { items: 4, correct: 2, totalResponseMs: 8000 } } },
      { breakdown: { '×': { items: 6, correct: 6, totalResponseMs: 12000 } } },
      {},
    ])
    expect(stats).toEqual([{ category: '×', items: 10, accuracy: 0.8, avgResponseMs: 2000 }])
  })

  it('keeps only the most recent sessions of a domain, oldest first', () => {
    const records = [session(3, 5, 1), session(1, 5, 1), session(2, 5, 1), { ...session(4, 5, 1), domain: 'memory' as const }]
    expect(recentSessions('calculation', records, 2).map((r) => r.id)).toEqual(['s2', 's3'])
  })
})

describe('weakestCategory', () => {
  const stat = (category: string, accuracy: number, avgResponseMs = 2000, items = MIN_ITEMS_FOR_WEAKNESS): CategoryStats => ({
    category,
    items,
    accuracy,
    avgResponseMs,
  })

  it('picks the lowest accuracy', () => {
    expect(weakestCategory([stat('+', 0.95), stat('÷', 0.6), stat('×', 0.8)])?.category).toBe('÷')
  })

  it('breaks accuracy ties with the slower category', () => {
    expect(weakestCategory([stat('+', 0.8, 1500), stat('-', 0.8, 3000)])?.category).toBe('-')
  })

  it('ignores categories with too few answers', () => {
    expect(weakestCategory([stat('÷', 0, 2000, MIN_ITEMS_FOR_WEAKNESS - 1), stat('+', 0.9)])?.category).toBe('+')
  })

  it('returns null when there is no data or everything is flawless', () => {
    expect(weakestCategory([])).toBeNull()
    expect(weakestCategory([stat('+', 1), stat('×', 1)])).toBeNull()
  })
})
