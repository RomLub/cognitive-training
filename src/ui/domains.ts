import type { ComponentType } from 'react'
import type { LevelBounds } from '../core/adaptive'
import { analyzeCategories, type CategoryAnalysis } from '../core/focus'
import type { CognitiveDomain, SessionRecord } from '../core/types'
import { STROOP_KIND_LABELS } from '../domains/attention/labels'
import * as stroop from '../domains/attention/stroop'
import { analyzeOperators } from '../domains/calculation/focus'
import { OPERATOR_LABELS, OPERATOR_ORDER } from '../domains/calculation/labels'
import { LEVEL_BOUNDS as CALC_BOUNDS } from '../domains/calculation/levels'
import { SESSION_LENGTH as CALC_LENGTH } from '../domains/calculation/session'
import { SERIES_RULE_LABELS } from '../domains/logic/labels'
import * as series from '../domains/logic/series'
import { analyzeSpanModes } from '../domains/memory/focus'
import { SPAN_MODE_LABELS } from '../domains/memory/labels'
import * as span from '../domains/memory/span'
import * as compare from '../domains/speed/compare'
import { PAIR_KIND_LABELS } from '../domains/speed/labels'
import { AttentionSession } from './AttentionSession'
import { CalculationSession } from './CalculationSession'
import { LogicSession } from './LogicSession'
import { MemorySession } from './MemorySession'
import type { ExerciseProps } from './SessionFrame'
import { SpeedSession } from './SpeedSession'

/** Every cognitive domain now has a playable exercise. */
export type TrainableDomain = CognitiveDomain

export interface DomainUi {
  domain: TrainableDomain
  title: string
  description: string
  /** Column header and "per X" wording for categories. */
  categoryNoun: string
  labels: Readonly<Record<string, string>>
  order: readonly string[]
  bounds: LevelBounds
  /** Items in a standalone session. */
  defaultLength: number
  /** Items in a program step (shorter). */
  shortLength: number
  analyze: (records: readonly SessionRecord[]) => CategoryAnalysis<string>
  /**
   * Session component. Typed with a string focus: the focus passed in always comes from this
   * domain's own `analyze`, so it is one of the component's categories.
   */
  Session: ComponentType<ExerciseProps<string>>
}

export const DOMAIN_UI: Record<TrainableDomain, DomainUi> = {
  calculation: {
    domain: 'calculation',
    title: 'Calcul mental',
    description: 'Opérations + − × ÷, difficulté adaptative.',
    categoryNoun: 'opération',
    labels: OPERATOR_LABELS,
    order: OPERATOR_ORDER,
    bounds: CALC_BOUNDS,
    defaultLength: CALC_LENGTH,
    shortLength: 10,
    analyze: analyzeOperators,
    Session: CalculationSession as ComponentType<ExerciseProps<string>>,
  },
  memory: {
    domain: 'memory',
    title: 'Mémoire de travail',
    description: 'Séquences de chiffres à restituer, à l’endroit ou à l’envers.',
    categoryNoun: 'mode',
    labels: SPAN_MODE_LABELS,
    order: span.SPAN_MODES,
    bounds: span.LEVEL_BOUNDS,
    defaultLength: span.SESSION_LENGTH,
    shortLength: 6,
    analyze: analyzeSpanModes,
    Session: MemorySession as ComponentType<ExerciseProps<string>>,
  },
  attention: {
    domain: 'attention',
    title: 'Attention',
    description: 'Stroop : nommer la couleur de l’encre, pas le mot.',
    categoryNoun: 'type d’essai',
    labels: STROOP_KIND_LABELS,
    order: stroop.STROOP_KINDS,
    bounds: stroop.LEVEL_BOUNDS,
    defaultLength: stroop.SESSION_LENGTH,
    shortLength: 12,
    analyze: (records) => analyzeCategories('attention', records, stroop.isStroopKind),
    Session: AttentionSession as ComponentType<ExerciseProps<string>>,
  },
  logic: {
    domain: 'logic',
    title: 'Logique',
    description: 'Suites de nombres : trouver le terme suivant.',
    categoryNoun: 'type de suite',
    labels: SERIES_RULE_LABELS,
    order: series.SERIES_RULES,
    bounds: series.LEVEL_BOUNDS,
    defaultLength: series.SESSION_LENGTH,
    shortLength: 6,
    analyze: (records) => analyzeCategories('logic', records, series.isSeriesRule),
    Session: LogicSession as ComponentType<ExerciseProps<string>>,
  },
  speed: {
    domain: 'speed',
    title: 'Vitesse de traitement',
    description: 'Deux séries identiques ou non ? Le plus vite possible.',
    categoryNoun: 'type de paire',
    labels: PAIR_KIND_LABELS,
    order: compare.PAIR_KINDS,
    bounds: compare.LEVEL_BOUNDS,
    defaultLength: compare.SESSION_LENGTH,
    shortLength: 12,
    analyze: (records) => analyzeCategories('speed', records, compare.isPairKind),
    Session: SpeedSession as ComponentType<ExerciseProps<string>>,
  },
}

export const TRAINABLE_DOMAINS: readonly TrainableDomain[] = ['calculation', 'memory', 'attention', 'logic', 'speed']
