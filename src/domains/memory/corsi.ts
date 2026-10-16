import type { LevelBounds } from '../../core/adaptive'
import { randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/** Corsi blocks: spatial span. Blocks light up in sequence; tap them back in the same (or reverse) order. */
export type CorsiMode = 'forward' | 'backward'

export const CORSI_MODES: readonly CorsiMode[] = ['forward', 'backward']

export function isCorsiMode(value: string): value is CorsiMode {
  return value === 'forward' || value === 'backward'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 10
export const FOCUS_SHARE = 0.5
/** Backward recall is introduced at this level. */
export const BACKWARD_FROM_LEVEL = 3
export const FLASH_MS = 700
export const GAP_MS = 250

/** Classic irregular layout of the 9 blocks, as % of the board (x, y of the top-left corner). */
export const BLOCK_POSITIONS: readonly (readonly [number, number])[] = [
  [8, 62], [24, 18], [36, 76], [44, 42], [58, 10], [62, 64], [74, 34], [80, 78], [12, 34],
]

/** Sequence length: forward 2 → 11, backward one shorter. */
export function corsiLength(level: number, mode: CorsiMode): number {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown Corsi level: ${level}`)
  }
  return mode === 'forward' ? level + 1 : level
}

export interface CorsiTrial {
  sequence: number[]
  mode: CorsiMode
  /** Expected taps. */
  answer: number[]
  level: number
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: CorsiMode | null = null): CorsiTrial {
  const backwardAllowed = level >= BACKWARD_FROM_LEVEL
  let mode: CorsiMode =
    focus !== null && rng() < FOCUS_SHARE ? focus : backwardAllowed && rng() < 0.5 ? 'backward' : 'forward'
  if (!backwardAllowed) mode = 'forward'
  const length = corsiLength(level, mode)
  const sequence: number[] = []
  while (sequence.length < length) {
    const block = randInt(rng, 0, BLOCK_POSITIONS.length - 1)
    // A block may come back later, but never twice in a row (it would look like one long flash).
    if (block !== sequence.at(-1)) sequence.push(block)
  }
  return { sequence, mode, answer: mode === 'forward' ? sequence : sequence.toReversed(), level }
}
