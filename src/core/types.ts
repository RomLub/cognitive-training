/** Cognitive domains the app trains. Only `calculation` is implemented for now. */
export type CognitiveDomain = 'calculation' | 'memory' | 'attention' | 'logic' | 'speed'

export type Rng = () => number

/** Outcome of a single answered item, domain-agnostic. */
export interface ItemResult {
  level: number
  correct: boolean
  responseMs: number
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
}
