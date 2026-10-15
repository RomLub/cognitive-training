/** Cognitive domains the app trains. Only `calculation` is implemented for now. */
export type CognitiveDomain = 'calculation' | 'memory' | 'attention' | 'logic' | 'speed'

export type Rng = () => number

/** Outcome of a single answered item, domain-agnostic. */
export interface ItemResult {
  level: number
  /** Sub-skill within the domain (e.g. the operator for calculation), used to spot weak points. */
  category: string
  correct: boolean
  responseMs: number
}

export interface CategoryTotals {
  items: number
  correct: number
  totalResponseMs: number
}

/** Persisted summary of one training session. */
export interface SessionRecord {
  id: string
  domain: CognitiveDomain
  startedAt: string // ISO 8601
  startLevel: number
  endLevel: number
  items: number
  correct: number
  avgResponseMs: number
  /** Totals per category. Absent on sessions recorded before categories existed. */
  breakdown?: Record<string, CategoryTotals>
}
