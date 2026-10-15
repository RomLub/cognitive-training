import { describe, expect, it } from 'vitest'
import { localDayKey, trainingStreak } from './streak'

/** Local-time timestamp, so tests do not depend on the machine's time zone. */
function at(day: number, hour = 10): { startedAt: string } {
  return { startedAt: new Date(2026, 9, day, hour).toISOString() }
}

const NOW = new Date(2026, 9, 15, 18)

describe('trainingStreak', () => {
  it('is zero without history', () => {
    expect(trainingStreak([], NOW)).toEqual({ days: 0, trainedToday: false, sessionsToday: 0 })
  })

  it('counts consecutive days ending today', () => {
    const s = trainingStreak([at(13), at(14), at(15), at(15, 8)], NOW)
    expect(s).toEqual({ days: 3, trainedToday: true, sessionsToday: 2 })
  })

  it('keeps yesterday’s streak alive until today is over', () => {
    expect(trainingStreak([at(13), at(14)], NOW)).toEqual({ days: 2, trainedToday: false, sessionsToday: 0 })
  })

  it('breaks on a missed day', () => {
    expect(trainingStreak([at(11), at(12), at(14), at(15)], NOW).days).toBe(2)
    expect(trainingStreak([at(12)], NOW).days).toBe(0)
  })

  it('formats local day keys', () => {
    expect(localDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
