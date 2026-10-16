import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import { normalizeWord } from '../../core/text'
import type { Rng } from '../../core/types'
import { ABSTRACT_NOUNS, CONCRETE_NOUNS } from './words'

/**
 * Word list with delayed free recall: words are shown one by one, then a pause (with an instruction
 * that keeps working memory busy), then the user recalls as many as possible in any order.
 */
export type ListKind = 'concrete' | 'abstract'

export const LIST_KINDS: readonly ListKind[] = ['concrete', 'abstract']

export function isListKind(value: string): value is ListKind {
  return value === 'concrete' || value === 'abstract'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 3
export const FOCUS_SHARE = 0.5
/** A list counts as recalled at 70 % of its words. */
export const PASS_RATIO = 0.7

interface ListSpec {
  words: number
  showMs: number
  delayMs: number
}

const LEVELS: readonly ListSpec[] = [
  { words: 6, showMs: 1800, delayMs: 0 },
  { words: 7, showMs: 1800, delayMs: 0 },
  { words: 7, showMs: 1600, delayMs: 10_000 },
  { words: 8, showMs: 1600, delayMs: 10_000 },
  { words: 9, showMs: 1500, delayMs: 15_000 },
  { words: 10, showMs: 1500, delayMs: 15_000 },
  { words: 11, showMs: 1400, delayMs: 20_000 },
  { words: 12, showMs: 1400, delayMs: 20_000 },
  { words: 13, showMs: 1300, delayMs: 30_000 },
  { words: 15, showMs: 1200, delayMs: 30_000 },
  { words: 16, showMs: 1150, delayMs: 35_000 },
  { words: 17, showMs: 1100, delayMs: 35_000 },
  { words: 18, showMs: 1050, delayMs: 40_000 },
  { words: 18, showMs: 1000, delayMs: 40_000 },
  { words: 19, showMs: 950, delayMs: 45_000 },
  { words: 20, showMs: 900, delayMs: 45_000 },
  { words: 21, showMs: 900, delayMs: 50_000 },
  { words: 22, showMs: 850, delayMs: 50_000 },
  { words: 23, showMs: 850, delayMs: 55_000 },
  { words: 24, showMs: 800, delayMs: 60_000 },
]

export function listSpec(level: number): ListSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown word-list level: ${level}`)
  return spec
}

export interface WordListTrial {
  words: string[]
  kind: ListKind
  level: number
  showMs: number
  delayMs: number
  /** Words to recall to pass. */
  required: number
}

/** Draws `count` distinct items. */
export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  if (count > items.length) throw new Error(`Cannot sample ${count} of ${items.length}`)
  const pool = [...items]
  const out: T[] = []
  while (out.length < count) {
    const i = Math.floor(rng() * pool.length)
    out.push(pool.splice(i, 1)[0]!)
  }
  return out
}

export function generateList(level: number, rng: Rng = Math.random, focus: ListKind | null = null): WordListTrial {
  const spec = listSpec(level)
  const kind = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, LIST_KINDS)
  const bank = kind === 'concrete' ? CONCRETE_NOUNS : ABSTRACT_NOUNS
  return {
    words: sample(rng, bank, spec.words),
    kind,
    level,
    showMs: spec.showMs,
    delayMs: spec.delayMs,
    required: Math.ceil(spec.words * PASS_RATIO),
  }
}

export interface RecallScore {
  found: string[]
  missed: string[]
  /** Recalled words that were not in the list. */
  intrusions: string[]
  passed: boolean
}

export function scoreRecall(trial: WordListTrial, recalled: readonly string[]): RecallScore {
  const recalledKeys = new Set(recalled.map(normalizeWord))
  const listKeys = new Set(trial.words.map(normalizeWord))
  const found = trial.words.filter((w) => recalledKeys.has(normalizeWord(w)))
  const missed = trial.words.filter((w) => !recalledKeys.has(normalizeWord(w)))
  const intrusions = [...new Set(recalled.filter((w) => !listKeys.has(normalizeWord(w))))]
  return { found, missed, intrusions, passed: found.length >= trial.required }
}
