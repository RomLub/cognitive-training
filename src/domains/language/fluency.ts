import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import { normalizeWord } from '../../core/text'
import type { Rng } from '../../core/types'
import { FLUENCY_LETTERS, SEMANTIC_CATEGORIES } from './categories'

/**
 * Verbal fluency: name as many words as possible in a category ("des animaux") or starting with a letter,
 * before time runs out. A round passes when the target count is reached.
 */
export type FluencyKind = 'semantic' | 'phonemic'

export const FLUENCY_KINDS: readonly FluencyKind[] = ['semantic', 'phonemic']

export function isFluencyKind(value: string): value is FluencyKind {
  return value === 'semantic' || value === 'phonemic'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 2
export const FOCUS_SHARE = 0.5
export const ROUND_MS = 60_000

/** 60 s per round up to level 10, then 1.5 s less per level (45 s at level 20). */
export function roundMs(level: number): number {
  return level <= 10 ? ROUND_MS : ROUND_MS - (level - 10) * 1_500
}
export const MIN_PHONEMIC_LENGTH = 3

/** Words to reach in 60 s: semantic 8 → 26; phonemic (harder) about 70 % of that. */
export function fluencyTarget(level: number, kind: FluencyKind): number {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown fluency level: ${level}`)
  }
  // From level 10 the target stays (26 words is already elite): the round gets shorter instead.
  const semantic = 8 + 2 * (Math.min(level, 10) - 1)
  return kind === 'semantic' ? semantic : Math.round(semantic * 0.7)
}

export interface FluencyRound {
  kind: FluencyKind
  /** Shown after "Cite…": e.g. "des animaux", "des mots commençant par P". */
  prompt: string
  /** Normalized accepted words (semantic only). */
  accepted: ReadonlySet<string> | null
  letter: string | null
  target: number
  durationMs: number
  level: number
}

export function generateRound(level: number, rng: Rng = Math.random, focus: FluencyKind | null = null): FluencyRound {
  const kind: FluencyKind = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, FLUENCY_KINDS)
  const target = fluencyTarget(level, kind)
  if (kind === 'semantic') {
    const category = pick(rng, SEMANTIC_CATEGORIES)
    return {
      kind,
      prompt: category.prompt,
      accepted: new Set(category.words.map(normalizeWord)),
      letter: null,
      target,
      durationMs: roundMs(level),
      level,
    }
  }
  const letter = pick(rng, FLUENCY_LETTERS)
  return { kind, prompt: `des mots commençant par ${letter}`, accepted: null, letter, target, durationMs: roundMs(level), level }
}

export type WordVerdict = 'ok' | 'duplicate' | 'unknown' | 'wrong-letter' | 'too-short'

/** Judges one word against the round and the words already counted (normalized keys). */
export function judgeWord(round: FluencyRound, word: string, counted: ReadonlySet<string>): WordVerdict {
  const key = normalizeWord(word)
  if (key.length === 0) return 'unknown'
  if (counted.has(key)) return 'duplicate'
  if (round.kind === 'semantic') return round.accepted?.has(key) === true ? 'ok' : 'unknown'
  if (key.length < MIN_PHONEMIC_LENGTH) return 'too-short'
  return key.startsWith(round.letter!.toLowerCase()) ? 'ok' : 'wrong-letter'
}
