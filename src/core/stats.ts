import type { CategoryTotals, CognitiveDomain, ItemResult, SessionRecord } from './types'

export function summarizeItems(
  results: readonly ItemResult[],
): Pick<SessionRecord, 'items' | 'correct' | 'avgResponseMs'> & { breakdown: Record<string, CategoryTotals> } {
  const items = results.length
  const correct = results.filter((r) => r.correct).length
  const avgResponseMs = items === 0 ? 0 : Math.round(results.reduce((s, r) => s + r.responseMs, 0) / items)
  const breakdown: Record<string, CategoryTotals> = {}
  for (const r of results) {
    const totals = (breakdown[r.category] ??= { items: 0, correct: 0, totalResponseMs: 0 })
    totals.items += 1
    totals.correct += r.correct ? 1 : 0
    totals.totalResponseMs += r.responseMs
  }
  return { items, correct, avgResponseMs, breakdown }
}

export interface CategoryStats {
  category: string
  items: number
  accuracy: number
  avgResponseMs: number
}

/** Merges per-category totals of the given sessions. Sessions without a breakdown are skipped. */
export function categoryStats(records: readonly Pick<SessionRecord, 'breakdown'>[]): CategoryStats[] {
  const merged: Record<string, CategoryTotals> = {}
  for (const record of records) {
    for (const [category, t] of Object.entries(record.breakdown ?? {})) {
      const acc = (merged[category] ??= { items: 0, correct: 0, totalResponseMs: 0 })
      acc.items += t.items
      acc.correct += t.correct
      acc.totalResponseMs += t.totalResponseMs
    }
  }
  return Object.entries(merged).map(([category, t]) => ({
    category,
    items: t.items,
    accuracy: t.items === 0 ? 0 : t.correct / t.items,
    avgResponseMs: t.items === 0 ? 0 : Math.round(t.totalResponseMs / t.items),
  }))
}

/** Minimum answered items before a category can be flagged as a weak point. */
export const MIN_ITEMS_FOR_WEAKNESS = 8

/**
 * Weakest category = lowest accuracy among categories with enough data; ties broken by slower average time.
 * Returns null when nothing qualifies or every qualifying category is flawless.
 * Times are only compared on ties because operations are not equally fast by nature (× is slower than +).
 */
export function weakestCategory(stats: readonly CategoryStats[]): CategoryStats | null {
  const eligible = stats
    .filter((s) => s.items >= MIN_ITEMS_FOR_WEAKNESS)
    .toSorted((x, y) => x.accuracy - y.accuracy || y.avgResponseMs - x.avgResponseMs)
  const weakest = eligible[0]
  return weakest === undefined || weakest.accuracy === 1 ? null : weakest
}

/** The last `count` sessions of a domain, oldest first. */
export function recentSessions(domain: CognitiveDomain, records: readonly SessionRecord[], count: number): SessionRecord[] {
  return records
    .filter((r) => r.domain === domain)
    .toSorted((x, y) => x.startedAt.localeCompare(y.startedAt))
    .slice(-count)
}

export function accuracy(record: Pick<SessionRecord, 'items' | 'correct'>): number {
  return record.items === 0 ? 0 : record.correct / record.items
}

export interface DomainProgress {
  domain: CognitiveDomain
  sessions: number
  currentLevel: number | null
  bestLevel: number | null
  /** Mean accuracy of the last 5 sessions minus that of the 5 before; null without enough history. */
  accuracyTrend: number | null
}

export function domainProgress(domain: CognitiveDomain, records: readonly SessionRecord[]): DomainProgress {
  const sorted = records
    .filter((r) => r.domain === domain)
    .sort((x, y) => x.startedAt.localeCompare(y.startedAt))
  const recent = sorted.slice(-5)
  const previous = sorted.slice(-10, -5)
  const meanAcc = (rs: readonly SessionRecord[]) => rs.reduce((s, r) => s + accuracy(r), 0) / rs.length
  return {
    domain,
    sessions: sorted.length,
    currentLevel: sorted.at(-1)?.endLevel ?? null,
    bestLevel: sorted.length === 0 ? null : Math.max(...sorted.map((r) => r.endLevel)),
    accuracyTrend: previous.length === 0 ? null : meanAcc(recent) - meanAcc(previous),
  }
}
