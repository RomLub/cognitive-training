import type { LevelBounds } from './adaptive'
import { domainProgress } from './stats'
import type { CognitiveDomain, SessionRecord } from './types'

export interface ProgramStep {
  domain: CognitiveDomain
  length: number
}

export type ProgramId = 'daily' | 'express' | 'calculation-focus'

export interface ProgramContext {
  /** Domains from weakest to strongest. */
  ranking: readonly CognitiveDomain[]
  /** Short session length per domain, for program steps. */
  shortLength: Readonly<Record<CognitiveDomain, number>>
}

export interface ProgramDef {
  id: ProgramId
  title: string
  description: string
  /** Rough duration, for display. */
  minutes: number
  steps: (ctx: ProgramContext) => ProgramStep[]
}

/**
 * Orders domains from weakest to strongest: untrained first, then by level relative to the domain's range,
 * then by fewer sessions. Levels are normalized because each domain has its own scale.
 */
export function rankDomainsByWeakness(
  domains: readonly CognitiveDomain[],
  records: readonly SessionRecord[],
  bounds: Readonly<Record<CognitiveDomain, LevelBounds>>,
): CognitiveDomain[] {
  const scored = domains.map((domain, order) => {
    const p = domainProgress(domain, records)
    const b = bounds[domain]
    const ratio = p.currentLevel === null ? -1 : (p.currentLevel - b.min) / (b.max - b.min)
    return { domain, ratio, sessions: p.sessions, order }
  })
  return scored
    .sort((x, y) => x.ratio - y.ratio || x.sessions - y.sessions || x.order - y.order)
    .map((s) => s.domain)
}

export const PROGRAMS: readonly ProgramDef[] = [
  {
    id: 'daily',
    title: 'Séance du jour',
    description: 'Tous les domaines, en commençant par le plus faible, qui a droit à une série double.',
    minutes: 12,
    steps: ({ ranking, shortLength }) =>
      ranking.map((domain, i) => ({ domain, length: shortLength[domain] * (i === 0 ? 2 : 1) })),
  },
  {
    id: 'express',
    title: 'Express',
    description: 'Calcul mental puis tes deux domaines les plus faibles.',
    minutes: 5,
    steps: ({ ranking, shortLength }) => [
      { domain: 'calculation', length: shortLength.calculation },
      ...ranking
        .filter((d) => d !== 'calculation')
        .slice(0, 2)
        .map((domain) => ({ domain, length: shortLength[domain] })),
    ],
  },
  {
    id: 'calculation-focus',
    title: 'Focus calcul',
    description: 'Deux séries complètes de calcul, avec la mémoire de travail entre les deux.',
    minutes: 12,
    steps: ({ shortLength }) => [
      { domain: 'calculation', length: shortLength.calculation * 2 },
      { domain: 'memory', length: shortLength.memory },
      { domain: 'calculation', length: shortLength.calculation * 2 },
    ],
  },
]

export function getProgram(id: ProgramId): ProgramDef {
  const program = PROGRAMS.find((p) => p.id === id)
  if (program === undefined) throw new Error(`Unknown program: ${id}`)
  return program
}
