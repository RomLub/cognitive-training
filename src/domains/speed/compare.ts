import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/** Processing speed: decide as fast as possible whether two strings are identical. */
export type PairKind = 'same' | 'different'

export const PAIR_KINDS: readonly PairKind[] = ['same', 'different']

export function isPairKind(value: string): value is PairKind {
  return value === 'same' || value === 'different'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 24
export const FOCUS_SHARE = 0.5

const DIGITS = '0123456789'
// Letters without I/O, which are too close to 1/0 in the mixed set.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown speed level: ${level}`)
  }
}

/** Look-alike characters used at the top levels (O/0/Q/D, 1/I/7, 5/S, 8/B, 2/Z). */
const LOOKALIKES = 'O0QD1I75S8B2Z'

/** String length: 3 at level 1 up to 12 at level 10, then 14 at most (it must fit a phone screen). */
export function pairLength(level: number): number {
  checkLevel(level)
  return level <= 10 ? level + 2 : Math.min(14, 12 + Math.floor((level - 11) / 4))
}

/** Charset: digits (1-3), letters (4-6), mixed (7-14), look-alike characters (15-20). */
export function charsetFor(level: number): string {
  checkLevel(level)
  if (level <= 3) return DIGITS
  if (level <= 6) return LETTERS
  if (level <= 14) return DIGITS + LETTERS
  return LOOKALIKES
}

/** Deadline grows with length but each character gets less time as the level rises. */
export function timeLimitMs(level: number): number {
  const perChar = level <= 10 ? 900 - 50 * (level - 1) : 430 - 15 * (level - 11)
  return 500 + pairLength(level) * perChar
}

export interface PairTrial {
  left: string
  right: string
  kind: PairKind
  level: number
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: PairKind | null = null): PairTrial {
  const length = pairLength(level)
  const charset = charsetFor(level)
  const kind: PairKind = focus !== null && rng() < FOCUS_SHARE ? focus : rng() < 0.5 ? 'same' : 'different'
  const left = Array.from({ length }, () => pick(rng, [...charset])).join('')
  if (kind === 'same') return { left, right: left, kind, level }

  const chars = [...left]
  const i = randInt(rng, 0, length - 1)
  const j = i < length - 1 ? i + 1 : i - 1
  // From level 5, half of the differences are swaps of two neighbours (harder to spot than a substitution).
  if (level >= 5 && rng() < 0.5 && chars[i] !== chars[j]) {
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  } else {
    chars[i] = pick(rng, [...charset].filter((c) => c !== chars[i]))
  }
  return { left, right: chars.join(''), kind, level }
}
