import type { CategoryAnalysis } from '../core/focus'
import type { CognitiveDomain, SessionRecord } from '../core/types'
import { analyzeOperators } from '../domains/calculation/focus'
import { OPERATOR_LABELS, OPERATOR_ORDER } from '../domains/calculation/labels'
import { analyzeSpanModes } from '../domains/memory/focus'
import { SPAN_MODE_LABELS } from '../domains/memory/labels'
import { SPAN_MODES } from '../domains/memory/span'

/** Domains with a playable exercise. */
export type TrainableDomain = 'calculation' | 'memory'

export interface DomainUi {
  domain: TrainableDomain
  title: string
  description: string
  /** Column header and "per X" wording for categories. */
  categoryNoun: string
  labels: Readonly<Record<string, string>>
  order: readonly string[]
  analyze: (records: readonly SessionRecord[]) => CategoryAnalysis<string>
}

export const DOMAIN_UI: Record<TrainableDomain, DomainUi> = {
  calculation: {
    domain: 'calculation',
    title: 'Calcul mental',
    description: '20 opérations, difficulté adaptative.',
    categoryNoun: 'opération',
    labels: OPERATOR_LABELS,
    order: OPERATOR_ORDER,
    analyze: analyzeOperators,
  },
  memory: {
    domain: 'memory',
    title: 'Mémoire de travail',
    description: '12 séquences de chiffres à restituer, à l’endroit ou à l’envers.',
    categoryNoun: 'mode',
    labels: SPAN_MODE_LABELS,
    order: SPAN_MODES,
    analyze: analyzeSpanModes,
  },
}

export const TRAINABLE_DOMAINS: readonly TrainableDomain[] = ['calculation', 'memory']

export function isTrainableDomain(domain: CognitiveDomain): domain is TrainableDomain {
  return domain === 'calculation' || domain === 'memory'
}
