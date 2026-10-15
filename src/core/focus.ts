import { categoryStats, recentSessions, weakestCategory, type CategoryStats } from './stats'
import type { CognitiveDomain, SessionRecord } from './types'

/** Per-category stats only look at recent sessions so the weak point reflects the current state. */
export const RECENT_WINDOW = 10

export interface CategoryAnalysis<C extends string> {
  stats: CategoryStats[]
  weakest: (CategoryStats & { category: C }) | null
}

/** Per-category stats of a domain's recent sessions, and its weakest category (the next sessions' focus). */
export function analyzeCategories<C extends string>(
  domain: CognitiveDomain,
  records: readonly SessionRecord[],
  isCategory: (value: string) => value is C,
): CategoryAnalysis<C> {
  const stats = categoryStats(recentSessions(domain, records, RECENT_WINDOW))
  const weakest = weakestCategory(stats)
  if (weakest === null) return { stats, weakest: null }
  if (!isCategory(weakest.category)) throw new Error(`Unknown ${domain} category: ${weakest.category}`)
  return { stats, weakest: { ...weakest, category: weakest.category } }
}
