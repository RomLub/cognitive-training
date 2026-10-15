import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Stroop task: a color word is printed in an ink color; the user must name the INK, not the word.
 * Incongruent trials (word ≠ ink) require inhibiting the automatic reading response.
 */
export type InkColor = 'red' | 'blue' | 'green' | 'yellow'
export type StroopKind = 'congruent' | 'incongruent'

export const COLORS: readonly InkColor[] = ['red', 'blue', 'green', 'yellow']
export const STROOP_KINDS: readonly StroopKind[] = ['congruent', 'incongruent']

export function isStroopKind(value: string): value is StroopKind {
  return value === 'congruent' || value === 'incongruent'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 24
export const FOCUS_SHARE = 0.5

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown attention level: ${level}`)
  }
}

/** Share of incongruent trials: 30 % at level 1 up to 75 % at level 10. */
export function incongruentShare(level: number): number {
  checkLevel(level)
  return 0.3 + (level - 1) * 0.05
}

/** Answer deadline: 3 s at level 1 down to ~0.9 s at level 10. */
export function timeLimitMs(level: number): number {
  checkLevel(level)
  return 3000 - (level - 1) * 230
}

export interface StroopTrial {
  word: InkColor
  ink: InkColor
  kind: StroopKind
  level: number
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: StroopKind | null = null): StroopTrial {
  const kind: StroopKind =
    focus !== null && rng() < FOCUS_SHARE ? focus : rng() < incongruentShare(level) ? 'incongruent' : 'congruent'
  const ink = pick(rng, COLORS)
  const word = kind === 'congruent' ? ink : pick(rng, COLORS.filter((c) => c !== ink))
  return { word, ink, kind, level }
}
