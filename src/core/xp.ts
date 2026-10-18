import { localDayKey } from './streak'
import type { SessionRecord } from './types'

/**
 * Experience points, derived from the session history (nothing extra stored, so they sync with it):
 * 2 XP per correct answer (15 for a reflection problem), plus 3 XP per level gained during the session.
 */
export const XP_PER_CORRECT = 2
export const XP_PER_LEVEL_GAINED = 3
/** XP to earn each day; roughly two short sessions. */
export const DAILY_GOAL_XP = 40

/** A solved "Réflexion" problem takes minutes, not seconds: it is worth as much as a short session. */
export const XP_PER_REFLECTION_CORRECT = 15

export function sessionXp(record: Pick<SessionRecord, 'domain' | 'correct' | 'startLevel' | 'endLevel'>): number {
  const perCorrect = record.domain === 'reflection' ? XP_PER_REFLECTION_CORRECT : XP_PER_CORRECT
  return record.correct * perCorrect + Math.max(0, record.endLevel - record.startLevel) * XP_PER_LEVEL_GAINED
}

export interface XpSummary {
  today: number
  total: number
  /** today / goal, capped at 1. */
  goalProgress: number
  goalReached: boolean
}

export function xpSummary(records: readonly SessionRecord[], now: Date, goal = DAILY_GOAL_XP): XpSummary {
  const todayKey = localDayKey(now)
  let today = 0
  let total = 0
  for (const r of records) {
    const xp = sessionXp(r)
    total += xp
    if (localDayKey(new Date(r.startedAt)) === todayKey) today += xp
  }
  return { today, total, goalProgress: Math.min(1, today / goal), goalReached: today >= goal }
}
