import type { LevelBounds } from './adaptive'
import { progressOf, sessionsOf } from './stats'
import type { CognitiveDomain, SessionRecord } from './types'

export interface ProgramStep {
  exercise: string
  length: number
}

export type ProgramId = 'daily' | 'express' | 'calculation-focus' | 'discovery' | 'reflection'

export interface ProgramContext {
  /** Domains from weakest to strongest (quick-paced ones: "Réflexion" has its own program). */
  domainRanking: readonly CognitiveDomain[]
  /** Exercise to play for a domain: an untried one first, then the least recently played. */
  exerciseFor: (domain: CognitiveDomain) => string
  /** Short session length of an exercise, for program steps. */
  shortLength: (exercise: string) => number
  /** Quick-paced exercises never played, in catalog order. */
  untried: readonly string[]
}

export interface ProgramDef {
  id: ProgramId
  title: string
  description: string
  /** Rough duration, for display. */
  minutes: number
  /** May be empty when the program has nothing to offer (e.g. discovery once everything was tried). */
  steps: (ctx: ProgramContext) => ProgramStep[]
}

export interface CatalogExercise {
  id: string
  domain: CognitiveDomain
  bounds: LevelBounds
}

/**
 * Orders domains from weakest to strongest. A domain's score is the mean, over its trained exercises,
 * of the current level relative to the exercise's range; untrained domains come first; ties go to the
 * domain with fewer sessions, then catalog order.
 */
export function rankDomainsByWeakness(
  domains: readonly CognitiveDomain[],
  catalog: readonly CatalogExercise[],
  records: readonly SessionRecord[],
): CognitiveDomain[] {
  const scored = domains.map((domain, order) => {
    const ratios: number[] = []
    let sessions = 0
    for (const ex of catalog.filter((e) => e.domain === domain)) {
      const p = progressOf(sessionsOf(records, ex.id))
      sessions += p.sessions
      if (p.currentLevel !== null) ratios.push((p.currentLevel - ex.bounds.min) / (ex.bounds.max - ex.bounds.min))
    }
    const ratio = ratios.length === 0 ? -1 : ratios.reduce((s, r) => s + r, 0) / ratios.length
    return { domain, ratio, sessions, order }
  })
  return scored
    .sort((x, y) => x.ratio - y.ratio || x.sessions - y.sessions || x.order - y.order)
    .map((s) => s.domain)
}

/** Untried exercise of the domain first (catalog order), otherwise the one played least recently. */
export function exerciseForDomain(domain: CognitiveDomain, catalog: readonly CatalogExercise[], records: readonly SessionRecord[]): string {
  const candidates = catalog.filter((e) => e.domain === domain)
  if (candidates.length === 0) throw new Error(`No exercise for domain ${domain}`)
  const lastPlayed = (id: string) => sessionsOf(records, id).at(-1)?.startedAt ?? ''
  return candidates.toSorted((x, y) => lastPlayed(x.id).localeCompare(lastPlayed(y.id)))[0]!.id
}

export const PROGRAMS: readonly ProgramDef[] = [
  {
    id: 'daily',
    title: 'Séance du jour',
    description: 'Tes 5 domaines les plus faibles, un exercice chacun ; le plus faible a une série double.',
    minutes: 12,
    steps: ({ domainRanking, exerciseFor, shortLength }) =>
      domainRanking.slice(0, 5).map((domain, i) => {
        const exercise = exerciseFor(domain)
        return { exercise, length: shortLength(exercise) * (i === 0 ? 2 : 1) }
      }),
  },
  {
    id: 'express',
    title: 'Express',
    description: 'Un exercice de calcul puis tes deux autres domaines les plus faibles.',
    minutes: 5,
    steps: ({ domainRanking, exerciseFor, shortLength }) =>
      [exerciseFor('calculation'), ...domainRanking.filter((d) => d !== 'calculation').slice(0, 2).map(exerciseFor)].map(
        (exercise) => ({ exercise, length: shortLength(exercise) }),
      ),
  },
  {
    id: 'calculation-focus',
    title: 'Focus calcul',
    description: 'Opérations, calcul en chaîne, pourcentages et estimation.',
    minutes: 12,
    steps: ({ shortLength }) => [
      { exercise: 'arithmetic', length: shortLength('arithmetic') * 2 },
      { exercise: 'chain', length: shortLength('chain') },
      { exercise: 'practical', length: shortLength('practical') },
      { exercise: 'estimation', length: shortLength('estimation') },
    ],
  },
  {
    id: 'discovery',
    title: 'Découverte',
    description: 'Jusqu’à 4 exercices que tu n’as encore jamais faits.',
    minutes: 8,
    steps: ({ untried, shortLength }) => untried.slice(0, 4).map((exercise) => ({ exercise, length: shortLength(exercise) })),
  },
  {
    id: 'reflection',
    title: 'Réflexion profonde',
    description: 'Une énigme logique, une île de menteurs et un problème à étapes, sans chrono.',
    minutes: 20,
    steps: ({ shortLength }) =>
      ['logic-grid', 'knights', 'word-problems'].map((exercise) => ({ exercise, length: shortLength(exercise) })),
  },
]

export function getProgram(id: ProgramId): ProgramDef {
  const program = PROGRAMS.find((p) => p.id === id)
  if (program === undefined) throw new Error(`Unknown program: ${id}`)
  return program
}
