import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Stroop task: a color word is printed in an ink color; by default the user must name the INK, not the word.
 * Incongruent trials (word ≠ ink) require inhibiting the automatic reading response.
 *
 * Levels 1-10: classic Stroop, more incongruent trials and shorter deadlines.
 * Levels 11-15: task switching — a cue says whether to name the ink or read the word.
 * Levels 16-20: same, with 6 colors instead of 4 and deadlines down to ~0.75 s.
 */
export type InkColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'brown'
/** `read-word` trials are cued "MOT": answer the word, not the ink (always incongruent). */
export type StroopKind = 'congruent' | 'incongruent' | 'read-word'
export type StroopRule = 'ink' | 'word'

export const COLORS: readonly InkColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'brown']
const BASE_COLORS: readonly InkColor[] = ['red', 'blue', 'green', 'yellow']
export const STROOP_KINDS: readonly StroopKind[] = ['congruent', 'incongruent', 'read-word']

export function isStroopKind(value: string): value is StroopKind {
  return value === 'congruent' || value === 'incongruent' || value === 'read-word'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 24
export const FOCUS_SHARE = 0.5
/** First level with the "read the word" cue. */
export const SWITCH_FROM_LEVEL = 11
/** First level with 6 colors. */
export const SIX_COLORS_FROM_LEVEL = 16

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown attention level: ${level}`)
  }
}

export function colorsForLevel(level: number): readonly InkColor[] {
  checkLevel(level)
  return level >= SIX_COLORS_FROM_LEVEL ? COLORS : BASE_COLORS
}

/** Share of incongruent trials among "name the ink" trials: 30 % at level 1 up to 75 % from level 10. */
export function incongruentShare(level: number): number {
  checkLevel(level)
  return 0.3 + (Math.min(level, 10) - 1) * 0.05
}

/** Share of "read the word" trials: none before level 11, 25 % → 45 % on 11-15, 50 % from 16. */
export function readWordShare(level: number): number {
  checkLevel(level)
  if (level < SWITCH_FROM_LEVEL) return 0
  return Math.min(0.5, 0.25 + (level - SWITCH_FROM_LEVEL) * 0.05)
}

/** Answer deadline per level band (switching and extra colors make each band harder despite a reset). */
export function timeLimitMs(level: number): number {
  checkLevel(level)
  if (level < SWITCH_FROM_LEVEL) return 3000 - (level - 1) * 230
  if (level < SIX_COLORS_FROM_LEVEL) return 2000 - (level - SWITCH_FROM_LEVEL) * 150
  return 1500 - (level - SIX_COLORS_FROM_LEVEL) * 190
}

export interface StroopTrial {
  word: InkColor
  ink: InkColor
  kind: StroopKind
  rule: StroopRule
  /** Expected answer: the ink, or the word on `read-word` trials. */
  target: InkColor
  level: number
}

function kindAvailable(kind: StroopKind, level: number): boolean {
  return kind !== 'read-word' || level >= SWITCH_FROM_LEVEL
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: StroopKind | null = null): StroopTrial {
  const colors = colorsForLevel(level)
  let kind: StroopKind
  if (focus !== null && kindAvailable(focus, level) && rng() < FOCUS_SHARE) {
    kind = focus
  } else if (rng() < readWordShare(level)) {
    kind = 'read-word'
  } else {
    kind = rng() < incongruentShare(level) ? 'incongruent' : 'congruent'
  }
  const ink = pick(rng, colors)
  const word = kind === 'congruent' ? ink : pick(rng, colors.filter((c) => c !== ink))
  const rule: StroopRule = kind === 'read-word' ? 'word' : 'ink'
  return { word, ink, kind, rule, target: rule === 'word' ? word : ink, level }
}
