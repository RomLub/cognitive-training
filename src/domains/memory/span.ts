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

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }

/** Trials per session; each trial lasts longer than a calculation item. */
export const SESSION_LENGTH = 12

/** Blank between two digits. */
export const GAP_MS = 250

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown memory level: ${level}`)
  }
}

/**
 * Sequence length: forward 3 → 12 digits up to level 10, then +1 every two levels (17 at level 20) since
 * human span tops out; backward is one shorter since reversing is harder.
 */
export function spanLength(level: number, mode: SpanMode): number {
  checkLevel(level)
  const forward = level <= 10 ? level + 2 : 12 + Math.ceil((level - 10) / 2)
  return mode === 'forward' ? forward : forward - 1
}

/** How long each digit stays on screen: 0.8 s up to level 10, then down to 0.4 s at level 20. */
export function digitMs(level: number): number {
  checkLevel(level)
  return level <= 10 ? 800 : 800 - (level - 10) * 40
}

export interface SpanTrial {
  digits: number[]
  mode: SpanMode
  level: number
  /** Expected answer as typed by the user. */
  answer: string
  digitMs: number
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
  return { digits, mode, level, answer: ordered.join(''), digitMs: digitMs(level) }
}

/** Keeps digits only, so "3 8 1" and "381" are both accepted. Returns null when nothing usable was typed. */
export function normalizeSpanAnswer(input: string): string | null {
  const compact = input.replace(/\s/g, '')
  return /^\d+$/.test(compact) ? compact : null
}
