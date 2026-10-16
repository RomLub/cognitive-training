import type { LevelBounds } from '../../core/adaptive'
import type { Rng } from '../../core/types'

/** Flanker: give the direction of the CENTRAL arrow, ignoring the arrows around it. */
export type FlankerKind = 'congruent' | 'incongruent'
export type Direction = 'left' | 'right'

export const FLANKER_KINDS: readonly FlankerKind[] = ['congruent', 'incongruent']

export function isFlankerKind(value: string): value is FlankerKind {
  return value === 'congruent' || value === 'incongruent'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 30
export const FOCUS_SHARE = 0.5

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown flanker level: ${level}`)
  }
}

/** Deadline: 2.5 s at level 1 down to 0.7 s at level 10. */
export function timeLimitMs(level: number): number {
  checkLevel(level)
  return 2500 - (level - 1) * 200
}

export function incongruentShare(level: number): number {
  checkLevel(level)
  return 0.3 + (level - 1) * 0.045
}

/** Flankers on each side: 2 up to level 5, then 3. */
export function flankersPerSide(level: number): number {
  checkLevel(level)
  return level <= 5 ? 2 : 3
}

export interface FlankerTrial {
  /** Display string, e.g. "<<><<". */
  arrows: string
  target: Direction
  kind: FlankerKind
  level: number
}

const ARROW: Record<Direction, string> = { left: '←', right: '→' }

export function generateTrial(level: number, rng: Rng = Math.random, focus: FlankerKind | null = null): FlankerTrial {
  const kind: FlankerKind =
    focus !== null && rng() < FOCUS_SHARE ? focus : rng() < incongruentShare(level) ? 'incongruent' : 'congruent'
  const target: Direction = rng() < 0.5 ? 'left' : 'right'
  const flank: Direction = kind === 'congruent' ? target : target === 'left' ? 'right' : 'left'
  const side = ARROW[flank].repeat(flankersPerSide(level))
  return { arrows: `${side}${ARROW[target]}${side}`, target, kind, level }
}
