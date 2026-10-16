import { describe, expect, it } from 'vitest'
import type { SessionRecord } from './types'
import { DAILY_GOAL_XP, sessionXp, xpSummary } from './xp'

function session(day: number, correct: number, startLevel = 3, endLevel = 3): SessionRecord {
  return {
    id: `s${day}-${correct}`, domain: 'calculation', exercise: 'arithmetic',
    startedAt: new Date(2026, 9, day, 10).toISOString(),
    startLevel, endLevel, items: 20, correct, avgResponseMs: 2000,
  }
}

describe('xp', () => {
  it('gives 2 XP per correct answer and 3 per level gained, nothing for levels lost', () => {
    expect(sessionXp(session(1, 10))).toBe(20)
    expect(sessionXp(session(1, 10, 3, 6))).toBe(29)
    expect(sessionXp(session(1, 10, 6, 3))).toBe(20)
  })

  it('sums today and all-time XP and tracks the daily goal', () => {
    const now = new Date(2026, 9, 15, 18)
    const s = xpSummary([session(14, 20), session(15, 10), session(15, 5)], now)
    expect(s).toEqual({ today: 30, total: 70, goalProgress: 30 / DAILY_GOAL_XP, goalReached: false })
    const full = xpSummary([session(15, 30)], now)
    expect(full.goalProgress).toBe(1)
    expect(full.goalReached).toBe(true)
  })
})
