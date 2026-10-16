import type { ComponentType } from 'react'
import type { LevelBounds } from '../core/adaptive'
import { analyzeCategories, type CategoryAnalysis } from '../core/focus'
import type { CatalogExercise } from '../core/programs'
import { sessionsOf } from '../core/stats'
import { COGNITIVE_DOMAINS, type CognitiveDomain, type SessionRecord } from '../core/types'
import * as flanker from '../domains/attention/flanker'
import * as goNoGo from '../domains/attention/goNoGo'
import { FLANKER_KIND_LABELS, GO_KIND_LABELS, SEARCH_KIND_LABELS, STROOP_KIND_LABELS } from '../domains/attention/labels'
import * as stroop from '../domains/attention/stroop'
import * as visualSearch from '../domains/attention/visualSearch'
import * as chain from '../domains/calculation/chain'
import * as estimation from '../domains/calculation/estimation'
import {
  CHAIN_KIND_LABELS,
  ESTIMATION_KIND_LABELS,
  OPERATOR_LABELS,
  OPERATOR_ORDER,
  PRACTICAL_KIND_LABELS,
} from '../domains/calculation/labels'
import { isOperator, LEVEL_BOUNDS as ARITHMETIC_BOUNDS } from '../domains/calculation/levels'
import * as practical from '../domains/calculation/practical'
import { SESSION_LENGTH as ARITHMETIC_LENGTH } from '../domains/calculation/session'
import { ASSOCIATION_KIND_LABELS, LIST_KIND_LABELS } from '../domains/episodic/labels'
import * as pairs from '../domains/episodic/pairs'
import * as wordList from '../domains/episodic/wordList'
import { TOWER_KIND_LABELS, TRAIL_KIND_LABELS } from '../domains/executive/labels'
import * as tower from '../domains/executive/tower'
import * as trail from '../domains/executive/trail'
import * as anagram from '../domains/language/anagram'
import * as fluency from '../domains/language/fluency'
import { ANAGRAM_KIND_LABELS, FLUENCY_KIND_LABELS } from '../domains/language/labels'
import { MATRIX_KIND_LABELS, SERIES_RULE_LABELS, SYLLOGISM_KIND_LABELS } from '../domains/logic/labels'
import * as matrices from '../domains/logic/matrices'
import * as series from '../domains/logic/series'
import * as syllogism from '../domains/logic/syllogism'
import * as corsi from '../domains/memory/corsi'
import { CORSI_LABELS, NBACK_LABELS, SPAN_MODE_LABELS } from '../domains/memory/labels'
import * as nback from '../domains/memory/nback'
import * as span from '../domains/memory/span'
import * as compare from '../domains/speed/compare'
import { PAIR_KIND_LABELS, SYMBOL_SET_LABELS } from '../domains/speed/labels'
import * as symbolDigit from '../domains/speed/symbolDigit'
import { ROTATION_KIND_LABELS } from '../domains/visuospatial/labels'
import * as rotation from '../domains/visuospatial/rotation'
import { AnagramSession } from './AnagramSession'
import { AttentionSession } from './AttentionSession'
import { CalculationSession } from './CalculationSession'
import { ChainSession } from './ChainSession'
import { CorsiSession } from './CorsiSession'
import { EstimationSession } from './EstimationSession'
import { FlankerSession } from './FlankerSession'
import { FluencySession } from './FluencySession'
import { GoNoGoSession } from './GoNoGoSession'
import { LogicSession } from './LogicSession'
import { MatrixSession } from './MatrixSession'
import { MemorySession } from './MemorySession'
import { NBackSession } from './NBackSession'
import { PairsSession } from './PairsSession'
import { PracticalSession } from './PracticalSession'
import { RotationSession } from './RotationSession'
import type { ExerciseProps } from './SessionFrame'
import { SpeedSession } from './SpeedSession'
import { SyllogismSession } from './SyllogismSession'
import { SymbolDigitSession } from './SymbolDigitSession'
import { TowerSession } from './TowerSession'
import { TrailSession } from './TrailSession'
import { VisualSearchSession } from './VisualSearchSession'
import { WordListSession } from './WordListSession'

export const DOMAIN_INFO: Readonly<Record<CognitiveDomain, { title: string }>> = {
  calculation: { title: 'Calcul mental' },
  memory: { title: 'Mémoire de travail' },
  episodic: { title: 'Mémoire épisodique' },
  attention: { title: 'Attention' },
  executive: { title: 'Fonctions exécutives' },
  logic: { title: 'Raisonnement' },
  speed: { title: 'Vitesse de traitement' },
  language: { title: 'Langage' },
  visuospatial: { title: 'Visuo-spatial' },
}

export interface ExerciseUi {
  id: string
  domain: CognitiveDomain
  title: string
  description: string
  /** Column header and "per X" wording for categories. */
  categoryNoun: string
  labels: Readonly<Record<string, string>>
  order: readonly string[]
  isCategory: (value: string) => boolean
  bounds: LevelBounds
  /** Items in a standalone session. */
  defaultLength: number
  /** Items in a program step (shorter). */
  shortLength: number
  /**
   * Session component. Typed with a string focus: the focus passed in always comes from this
   * exercise's own categories (see `analyzeExercise`).
   */
  Session: ComponentType<ExerciseProps<string>>
}

function session<F extends string>(component: ComponentType<ExerciseProps<F>>): ComponentType<ExerciseProps<string>> {
  return component as ComponentType<ExerciseProps<string>>
}

export const EXERCISES: readonly ExerciseUi[] = [
  {
    id: 'arithmetic',
    domain: 'calculation',
    title: 'Opérations',
    description: 'Additions, soustractions, multiplications et divisions.',
    categoryNoun: 'opération',
    labels: OPERATOR_LABELS,
    order: OPERATOR_ORDER,
    isCategory: isOperator,
    bounds: ARITHMETIC_BOUNDS,
    defaultLength: ARITHMETIC_LENGTH,
    shortLength: 10,
    Session: session(CalculationSession),
  },
  {
    id: 'chain',
    domain: 'calculation',
    title: 'Calcul en chaîne',
    description: 'Garder un total en tête au fil des opérations.',
    categoryNoun: 'type de chaîne',
    labels: CHAIN_KIND_LABELS,
    order: chain.CHAIN_KINDS,
    isCategory: chain.isChainKind,
    bounds: chain.LEVEL_BOUNDS,
    defaultLength: chain.SESSION_LENGTH,
    shortLength: 5,
    Session: session(ChainSession),
  },
  {
    id: 'practical',
    domain: 'calculation',
    title: 'Pourcentages & fractions',
    description: 'Remises, hausses, fractions, règle de trois.',
    categoryNoun: 'type de calcul',
    labels: PRACTICAL_KIND_LABELS,
    order: practical.PRACTICAL_KINDS,
    isCategory: practical.isPracticalKind,
    bounds: practical.LEVEL_BOUNDS,
    defaultLength: practical.SESSION_LENGTH,
    shortLength: 6,
    Session: session(PracticalSession),
  },
  {
    id: 'estimation',
    domain: 'calculation',
    title: 'Estimation',
    description: 'Trouver l’ordre de grandeur avant la fin du temps.',
    categoryNoun: 'opération',
    labels: ESTIMATION_KIND_LABELS,
    order: estimation.ESTIMATION_KINDS,
    isCategory: estimation.isEstimationKind,
    bounds: estimation.LEVEL_BOUNDS,
    defaultLength: estimation.SESSION_LENGTH,
    shortLength: 8,
    Session: session(EstimationSession),
  },
  {
    id: 'digit-span',
    domain: 'memory',
    title: 'Empan de chiffres',
    description: 'Séquences de chiffres à restituer, à l’endroit ou à l’envers.',
    categoryNoun: 'mode',
    labels: SPAN_MODE_LABELS,
    order: span.SPAN_MODES,
    isCategory: span.isSpanMode,
    bounds: span.LEVEL_BOUNDS,
    defaultLength: span.SESSION_LENGTH,
    shortLength: 6,
    Session: session(MemorySession),
  },
  {
    id: 'n-back',
    domain: 'memory',
    title: 'N-back',
    description: 'Repérer ce qui revient n coups plus tard, lettres ou positions.',
    categoryNoun: 'modalité',
    labels: NBACK_LABELS,
    order: nback.NBACK_MODALITIES,
    isCategory: nback.isNBackModality,
    bounds: nback.LEVEL_BOUNDS,
    defaultLength: nback.SESSION_LENGTH,
    shortLength: 2,
    Session: session(NBackSession),
  },
  {
    id: 'corsi',
    domain: 'memory',
    title: 'Blocs de Corsi',
    description: 'Mémoire spatiale : reproduire une séquence de blocs.',
    categoryNoun: 'mode',
    labels: CORSI_LABELS,
    order: corsi.CORSI_MODES,
    isCategory: corsi.isCorsiMode,
    bounds: corsi.LEVEL_BOUNDS,
    defaultLength: corsi.SESSION_LENGTH,
    shortLength: 5,
    Session: session(CorsiSession),
  },
  {
    id: 'word-list',
    domain: 'episodic',
    title: 'Liste de mots',
    description: 'Retenir une liste, puis la rappeler après une pause.',
    categoryNoun: 'type de mots',
    labels: LIST_KIND_LABELS,
    order: wordList.LIST_KINDS,
    isCategory: wordList.isListKind,
    bounds: wordList.LEVEL_BOUNDS,
    defaultLength: wordList.SESSION_LENGTH,
    shortLength: 1,
    Session: session(WordListSession),
  },
  {
    id: 'word-pairs',
    domain: 'episodic',
    title: 'Paires de mots',
    description: 'Associer des mots deux à deux, puis retrouver le partenaire.',
    categoryNoun: 'type de paires',
    labels: ASSOCIATION_KIND_LABELS,
    order: pairs.ASSOCIATION_KINDS,
    isCategory: pairs.isAssociationKind,
    bounds: pairs.LEVEL_BOUNDS,
    defaultLength: pairs.SESSION_LENGTH,
    shortLength: 1,
    Session: session(PairsSession),
  },
  {
    id: 'stroop',
    domain: 'attention',
    title: 'Stroop',
    description: 'Nommer la couleur de l’encre, pas le mot.',
    categoryNoun: 'type d’essai',
    labels: STROOP_KIND_LABELS,
    order: stroop.STROOP_KINDS,
    isCategory: stroop.isStroopKind,
    bounds: stroop.LEVEL_BOUNDS,
    defaultLength: stroop.SESSION_LENGTH,
    shortLength: 12,
    Session: session(AttentionSession),
  },
  {
    id: 'go-no-go',
    domain: 'attention',
    title: 'Go / No-Go',
    description: 'Attention soutenue : appuyer à chaque chiffre, sauf le 3.',
    categoryNoun: 'type d’essai',
    labels: GO_KIND_LABELS,
    order: goNoGo.GO_KINDS,
    isCategory: goNoGo.isGoKind,
    bounds: goNoGo.LEVEL_BOUNDS,
    defaultLength: goNoGo.SESSION_LENGTH,
    shortLength: 20,
    Session: session(GoNoGoSession),
  },
  {
    id: 'flanker',
    domain: 'attention',
    title: 'Flanker',
    description: 'La flèche du milieu, sans se laisser distraire par ses voisines.',
    categoryNoun: 'type d’essai',
    labels: FLANKER_KIND_LABELS,
    order: flanker.FLANKER_KINDS,
    isCategory: flanker.isFlankerKind,
    bounds: flanker.LEVEL_BOUNDS,
    defaultLength: flanker.SESSION_LENGTH,
    shortLength: 15,
    Session: session(FlankerSession),
  },
  {
    id: 'visual-search',
    domain: 'attention',
    title: 'Recherche visuelle',
    description: 'Repérer une lettre cachée parmi des leurres.',
    categoryNoun: 'type de grille',
    labels: SEARCH_KIND_LABELS,
    order: visualSearch.SEARCH_KINDS,
    isCategory: visualSearch.isSearchKind,
    bounds: visualSearch.LEVEL_BOUNDS,
    defaultLength: visualSearch.SESSION_LENGTH,
    shortLength: 10,
    Session: session(VisualSearchSession),
  },
  {
    id: 'trail-making',
    domain: 'executive',
    title: 'Trail Making',
    description: 'Relier 1-A-2-B… : alterner deux suites sans se tromper.',
    categoryNoun: 'type de parcours',
    labels: TRAIL_KIND_LABELS,
    order: trail.TRAIL_KINDS,
    isCategory: trail.isTrailKind,
    bounds: trail.LEVEL_BOUNDS,
    defaultLength: trail.SESSION_LENGTH,
    shortLength: 2,
    Session: session(TrailSession),
  },
  {
    id: 'tower-of-london',
    domain: 'executive',
    title: 'Tour de Londres',
    description: 'Planifier : reproduire un modèle en un minimum de coups.',
    categoryNoun: 'type de problème',
    labels: TOWER_KIND_LABELS,
    order: tower.TOWER_KINDS,
    isCategory: tower.isTowerKind,
    bounds: tower.LEVEL_BOUNDS,
    defaultLength: tower.SESSION_LENGTH,
    shortLength: 3,
    Session: session(TowerSession),
  },
  {
    id: 'number-series',
    domain: 'logic',
    title: 'Suites de nombres',
    description: 'Trouver le terme suivant.',
    categoryNoun: 'type de suite',
    labels: SERIES_RULE_LABELS,
    order: series.SERIES_RULES,
    isCategory: series.isSeriesRule,
    bounds: series.LEVEL_BOUNDS,
    defaultLength: series.SESSION_LENGTH,
    shortLength: 6,
    Session: session(LogicSession),
  },
  {
    id: 'matrices',
    domain: 'logic',
    title: 'Matrices',
    description: 'Compléter une grille de figures en trouvant ses règles.',
    categoryNoun: 'type de règle',
    labels: MATRIX_KIND_LABELS,
    order: matrices.MATRIX_KINDS,
    isCategory: matrices.isMatrixKind,
    bounds: matrices.LEVEL_BOUNDS,
    defaultLength: matrices.SESSION_LENGTH,
    shortLength: 4,
    Session: session(MatrixSession),
  },
  {
    id: 'syllogisms',
    domain: 'logic',
    title: 'Syllogismes',
    description: 'La conclusion découle-t-elle forcément des prémisses ?',
    categoryNoun: 'type de conclusion',
    labels: SYLLOGISM_KIND_LABELS,
    order: syllogism.SYLLOGISM_KINDS,
    isCategory: syllogism.isSyllogismKind,
    bounds: syllogism.LEVEL_BOUNDS,
    defaultLength: syllogism.SESSION_LENGTH,
    shortLength: 5,
    Session: session(SyllogismSession),
  },
  {
    id: 'pair-compare',
    domain: 'speed',
    title: 'Comparaison de séries',
    description: 'Deux séries identiques ou non ? Le plus vite possible.',
    categoryNoun: 'type de paire',
    labels: PAIR_KIND_LABELS,
    order: compare.PAIR_KINDS,
    isCategory: compare.isPairKind,
    bounds: compare.LEVEL_BOUNDS,
    defaultLength: compare.SESSION_LENGTH,
    shortLength: 12,
    Session: session(SpeedSession),
  },
  {
    id: 'symbol-digit',
    domain: 'speed',
    title: 'Code symbole-chiffre',
    description: 'Traduire des symboles en chiffres grâce à une clé.',
    categoryNoun: 'jeu de symboles',
    labels: SYMBOL_SET_LABELS,
    order: symbolDigit.SYMBOL_SETS,
    isCategory: symbolDigit.isSymbolSet,
    bounds: symbolDigit.LEVEL_BOUNDS,
    defaultLength: symbolDigit.SESSION_LENGTH,
    shortLength: 15,
    Session: session(SymbolDigitSession),
  },
  {
    id: 'fluency',
    domain: 'language',
    title: 'Fluence verbale',
    description: 'Citer un maximum de mots en 60 s, idéalement à voix haute.',
    categoryNoun: 'type de consigne',
    labels: FLUENCY_KIND_LABELS,
    order: fluency.FLUENCY_KINDS,
    isCategory: fluency.isFluencyKind,
    bounds: fluency.LEVEL_BOUNDS,
    defaultLength: fluency.SESSION_LENGTH,
    shortLength: 1,
    Session: session(FluencySession),
  },
  {
    id: 'anagrams',
    domain: 'language',
    title: 'Anagrammes',
    description: 'Retrouver le mot caché derrière des lettres mélangées.',
    categoryNoun: 'type de mots',
    labels: ANAGRAM_KIND_LABELS,
    order: anagram.ANAGRAM_KINDS,
    isCategory: anagram.isAnagramKind,
    bounds: anagram.LEVEL_BOUNDS,
    defaultLength: anagram.SESSION_LENGTH,
    shortLength: 5,
    Session: session(AnagramSession),
  },
  {
    id: 'mental-rotation',
    domain: 'visuospatial',
    title: 'Rotation mentale',
    description: 'Même forme tournée, ou son reflet dans un miroir ?',
    categoryNoun: 'type de paire',
    labels: ROTATION_KIND_LABELS,
    order: rotation.ROTATION_KINDS,
    isCategory: rotation.isRotationKind,
    bounds: rotation.LEVEL_BOUNDS,
    defaultLength: rotation.SESSION_LENGTH,
    shortLength: 10,
    Session: session(RotationSession),
  },
]

export function getExercise(id: string): ExerciseUi {
  const exercise = EXERCISES.find((e) => e.id === id)
  if (exercise === undefined) throw new Error(`Unknown exercise: ${id}`)
  return exercise
}

/** Domains that have at least one exercise, in display order. */
export const ACTIVE_DOMAINS: readonly CognitiveDomain[] = COGNITIVE_DOMAINS.filter((d) => EXERCISES.some((e) => e.domain === d))

export const CATALOG: readonly CatalogExercise[] = EXERCISES.map(({ id, domain, bounds }) => ({ id, domain, bounds }))

/** Weak-point analysis of one exercise over its recent sessions. */
export function analyzeExercise(exercise: ExerciseUi, records: readonly SessionRecord[]): CategoryAnalysis<string> {
  return analyzeCategories(sessionsOf(records, exercise.id), exercise.isCategory as (v: string) => v is string, exercise.title)
}
