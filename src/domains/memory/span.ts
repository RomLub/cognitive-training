import type { LevelBounds } from '../../core/adaptive'
import { randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Digit span: a sequence of digits is shown one at a time, then recalled
 * either in the same order (forward) or reversed (backward, harder: it requires manipulating the sequence).
 */
export type SpanMode = 'forward' | 'backward'

export const SPAN_MODES: readonly SpanMode[] = ['forward', 'backward']

export function isSpanMode(value: string): value is SpanMode {
  return value === 'forward' || value === 'backward'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }

/** Trials per session; each trial lasts longer than a calculation item. */
export const SESSION_LENGTH = 12

/** Display timing per digit. */
export const DIGIT_MS = 800
export const GAP_MS = 250

/** Sequence length: forward 3→12 digits, backward one shorter since reversing is harder. */
export function spanLength(level: number, mode: SpanMode): number {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown memory level: ${level}`)
  }
  return mode === 'forward' ? level + 2 : level + 1
}

export interface SpanTrial {
  digits: number[]
  mode: SpanMode
  level: number
  /** Expected answer as typed by the user. */
  answer: string
}

/** Share of trials forced onto the focus mode; the rest are a fair coin flip. */
export const FOCUS_SHARE = 0.5

export function generateTrial(level: number, rng: Rng = Math.random, focus: SpanMode | null = null): SpanTrial {
  const mode: SpanMode = focus !== null && rng() < FOCUS_SHARE ? focus : rng() < 0.5 ? 'forward' : 'backward'
  const length = spanLength(level, mode)
  const digits: number[] = []
  while (digits.length < length) {
    const d = randInt(rng, 0, 9)
    // No immediate repeats: two identical digits in a row are hard to tell apart on screen.
    if (d !== digits.at(-1)) digits.push(d)
  }
  const ordered = mode === 'forward' ? digits : digits.toReversed()
  return { digits, mode, level, answer: ordered.join('') }
}

/** Keeps digits only, so "3 8 1" and "381" are both accepted. Returns null when nothing usable was typed. */
export function normalizeSpanAnswer(input: string): string | null {
  const compact = input.replace(/\s/g, '')
  return /^\d+$/.test(compact) ? compact : null
}
