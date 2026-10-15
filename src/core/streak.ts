import type { SessionRecord } from './types'

/** Local calendar day, e.g. "2026-10-15". */
export function localDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export interface StreakInfo {
  /** Consecutive training days ending today, or yesterday if not trained yet today. */
  days: number
  trainedToday: boolean
  sessionsToday: number
}

export function trainingStreak(records: readonly Pick<SessionRecord, 'startedAt'>[], now: Date): StreakInfo {
  const days = new Set(records.map((r) => localDayKey(new Date(r.startedAt))))
  const todayKey = localDayKey(now)
  const sessionsToday = records.filter((r) => localDayKey(new Date(r.startedAt)) === todayKey).length
  const trainedToday = days.has(todayKey)

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!trainedToday) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(localDayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return { days: streak, trainedToday, sessionsToday }
}
