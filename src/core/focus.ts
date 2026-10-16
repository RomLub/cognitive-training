import { categoryStats, weakestCategory, type CategoryStats } from './stats'
import type { SessionRecord } from './types'

/** Per-category stats only look at recent sessions so the weak point reflects the current state. */
export const RECENT_WINDOW = 10

export interface CategoryAnalysis<C extends string> {
  stats: CategoryStats[]
  weakest: (CategoryStats & { category: C }) | null
}

/**
 * Per-category stats of an exercise's recent sessions, and its weakest category (the next sessions' focus).
 * @param sessions sessions of one exercise, any order
 * @param label exercise name for error messages
 */
export function analyzeCategories<C extends string>(
  sessions: readonly SessionRecord[],
  isCategory: (value: string) => value is C,
  label: string,
): CategoryAnalysis<C> {
  const recent = sessions.toSorted((x, y) => x.startedAt.localeCompare(y.startedAt)).slice(-RECENT_WINDOW)
  const stats = categoryStats(recent)
  const weakest = weakestCategory(stats)
  if (weakest === null) return { stats, weakest: null }
  if (!isCategory(weakest.category)) throw new Error(`Unknown ${label} category: ${weakest.category}`)
  return { stats, weakest: { ...weakest, category: weakest.category } }
}
