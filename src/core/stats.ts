import type { CognitiveDomain, ItemResult, SessionRecord } from './types'

export function summarizeItems(results: readonly ItemResult[]): { items: number; correct: number; avgResponseMs: number } {
  const items = results.length
  const correct = results.filter((r) => r.correct).length
  const avgResponseMs = items === 0 ? 0 : Math.round(results.reduce((s, r) => s + r.responseMs, 0) / items)
  return { items, correct, avgResponseMs }
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
