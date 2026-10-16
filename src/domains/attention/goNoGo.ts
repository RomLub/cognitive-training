import type { LevelBounds } from '../../core/adaptive'
import { randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Go/No-Go (sustained attention, SART-like): digits appear at a steady pace; press for every digit
 * except the no-go digit. The rarer and faster the no-go, the harder it is to hold back.
 */
export type GoKind = 'go' | 'nogo'

export const GO_KINDS: readonly GoKind[] = ['go', 'nogo']

export function isGoKind(value: string): value is GoKind {
  return value === 'go' || value === 'nogo'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 40
export const FOCUS_SHARE = 0.5
export const NOGO_DIGIT = 3

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown go/no-go level: ${level}`)
  }
}

/** Time to respond: 1.5 s at level 1 down to 0.6 s at level 10. */
export function intervalMs(level: number): number {
  checkLevel(level)
  return 1500 - (level - 1) * 100
}

/** No-go share: 30 % at level 1 down to ~12 % at level 10 (rare no-gos are harder to catch). */
export function nogoShare(level: number): number {
  checkLevel(level)
  return 0.3 - (level - 1) * 0.02
}

export interface GoTrial {
  digit: number
  kind: GoKind
  level: number
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: GoKind | null = null): GoTrial {
  const kind: GoKind = focus !== null && rng() < FOCUS_SHARE ? focus : rng() < nogoShare(level) ? 'nogo' : 'go'
  let digit = NOGO_DIGIT
  while (kind === 'go' && digit === NOGO_DIGIT) digit = randInt(rng, 1, 9)
  return { digit, kind, level }
}
