import type { CognitiveDomain, SessionRecord } from './types'

/** Number of first sessions that make up the baseline, and of recent sessions compared to it. */
export const BASELINE_SESSIONS = 3

export interface Snapshot {
  /** Mean end level. */
  level: number
  /** Accuracy over all items of the sessions (weighted by item count). */
  accuracy: number
  /** Mean response time over all items (weighted by item count). */
  avgResponseMs: number
  sessions: number
}

export type Evolution =
  | { status: 'none' }
  | { status: 'building'; baseline: Snapshot }
  | { status: 'ready'; baseline: Snapshot; current: Snapshot }

export function snapshot(records: readonly SessionRecord[]): Snapshot {
  if (records.length === 0) throw new Error('snapshot of no session')
  const items = records.reduce((s, r) => s + r.items, 0)
  return {
    level: records.reduce((s, r) => s + r.endLevel, 0) / records.length,
    accuracy: items === 0 ? 0 : records.reduce((s, r) => s + r.correct, 0) / items,
    avgResponseMs: items === 0 ? 0 : records.reduce((s, r) => s + r.avgResponseMs * r.items, 0) / items,
    sessions: records.length,
  }
}

/**
 * Compares the user to themself: first sessions of a domain (baseline) vs the latest ones.
 * Recent sessions never overlap the baseline, so with 4-5 sessions the comparison uses only 1-2.
 */
export function domainEvolution(domain: CognitiveDomain, records: readonly SessionRecord[]): Evolution {
  const sorted = records
    .filter((r) => r.domain === domain)
    .toSorted((x, y) => x.startedAt.localeCompare(y.startedAt))
  if (sorted.length === 0) return { status: 'none' }
  const baseline = snapshot(sorted.slice(0, BASELINE_SESSIONS))
  if (sorted.length <= BASELINE_SESSIONS) return { status: 'building', baseline }
  const recentCount = Math.min(BASELINE_SESSIONS, sorted.length - BASELINE_SESSIONS)
  return { status: 'ready', baseline, current: snapshot(sorted.slice(-recentCount)) }
}
