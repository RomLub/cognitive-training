/** Cognitive domains; each groups one or more exercises. */
export type CognitiveDomain =
  | 'calculation'
  | 'memory'
  | 'episodic'
  | 'attention'
  | 'executive'
  | 'logic'
  | 'speed'
  | 'language'
  | 'visuospatial'
  | 'reflection'

export const COGNITIVE_DOMAINS: readonly CognitiveDomain[] = [
  'calculation',
  'memory',
  'episodic',
  'attention',
  'executive',
  'logic',
  'speed',
  'language',
  'visuospatial',
  'reflection',
]

export function isCognitiveDomain(value: string): value is CognitiveDomain {
  return (COGNITIVE_DOMAINS as readonly string[]).includes(value)
}

export type Rng = () => number

/** Outcome of a single answered item, domain-agnostic. */
export interface ItemResult {
  level: number
  /** Sub-skill within the exercise (e.g. the operator for arithmetic), used to spot weak points. */
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
  /** Exercise id (see ui/exercises.ts). Level, history and weak points are tracked per exercise. */
  exercise: string
  startedAt: string // ISO 8601
  startLevel: number
  endLevel: number
  items: number
  correct: number
  avgResponseMs: number
  /** Totals per category. Absent on sessions recorded before categories existed. */
  breakdown?: Record<string, CategoryTotals>
}
