import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import { normalizeWord } from '../../core/text'
import type { Rng } from '../../core/types'
import { sample } from './wordList'
import { CONCRETE_NOUNS, RELATED_PAIRS } from './words'

/** Paired associates: study word pairs, then give the second word of each pair from the first. */
export type AssociationKind = 'related' | 'unrelated'

export const ASSOCIATION_KINDS: readonly AssociationKind[] = ['related', 'unrelated']

export function isAssociationKind(value: string): value is AssociationKind {
  return value === 'related' || value === 'unrelated'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 3
export const FOCUS_SHARE = 0.5
export const PASS_RATIO = 0.7

interface PairsSpec {
  pairs: number
  showMs: number
}

const LEVELS: readonly PairsSpec[] = [
  { pairs: 3, showMs: 3000 },
  { pairs: 4, showMs: 3000 },
  { pairs: 5, showMs: 2800 },
  { pairs: 5, showMs: 2500 },
  { pairs: 6, showMs: 2500 },
  { pairs: 7, showMs: 2300 },
  { pairs: 8, showMs: 2200 },
  { pairs: 8, showMs: 2000 },
  { pairs: 9, showMs: 2000 },
  { pairs: 10, showMs: 1800 },
]

export function pairsSpec(level: number): PairsSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown word-pairs level: ${level}`)
  return spec
}

export interface PairsTrial {
  /** [cue, target] in study order. */
  pairs: [string, string][]
  /** Cues in test order (shuffled). */
  testOrder: number[]
  kind: AssociationKind
  level: number
  showMs: number
  required: number
}

export function generatePairs(level: number, rng: Rng = Math.random, focus: AssociationKind | null = null): PairsTrial {
  const spec = pairsSpec(level)
  const kind = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, ASSOCIATION_KINDS)
  let pairs: [string, string][]
  if (kind === 'related') {
    pairs = sample(rng, RELATED_PAIRS, spec.pairs).map(([a, b]) => [a, b])
  } else {
    const words = sample(rng, CONCRETE_NOUNS, spec.pairs * 2)
    pairs = Array.from({ length: spec.pairs }, (_, i) => [words[2 * i]!, words[2 * i + 1]!])
  }
  const testOrder = sample(rng, pairs.map((_, i) => i), pairs.length)
  return { pairs, testOrder, kind, level, showMs: spec.showMs, required: Math.ceil(spec.pairs * PASS_RATIO) }
}

export function isRightPartner(trial: PairsTrial, pairIndex: number, answer: string): boolean {
  const target = trial.pairs[pairIndex]?.[1]
  if (target === undefined) throw new Error(`No pair ${pairIndex}`)
  return normalizeWord(answer) === normalizeWord(target)
}
