import { categoryStats, recentSessions, weakestCategory, type CategoryStats } from '../../core/stats'
import type { SessionRecord } from '../../core/types'
import { isOperator, type Operator } from './levels'

/** Per-operation stats only look at recent sessions so the weak point reflects the current state. */
export const RECENT_WINDOW = 10

export interface OperatorAnalysis {
  stats: CategoryStats[]
  weakest: (CategoryStats & { category: Operator }) | null
}

export function analyzeOperators(records: readonly SessionRecord[]): OperatorAnalysis {
  const stats = categoryStats(recentSessions('calculation', records, RECENT_WINDOW))
  const weakest = weakestCategory(stats)
  if (weakest === null) return { stats, weakest: null }
  if (!isOperator(weakest.category)) throw new Error(`Unknown calculation category: ${weakest.category}`)
  return { stats, weakest: { ...weakest, category: weakest.category } }
}
