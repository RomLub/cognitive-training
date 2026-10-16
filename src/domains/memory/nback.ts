import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * N-back: stimuli appear one by one; press when the current one matches the one shown n steps earlier.
 * One adaptive item = one block of stimuli; n only changes between blocks.
 */
export type NBackModality = 'letters' | 'positions'

export const NBACK_MODALITIES: readonly NBackModality[] = ['letters', 'positions']

export function isNBackModality(value: string): value is NBackModality {
  return value === 'letters' || value === 'positions'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 5
export const FOCUS_SHARE = 0.5
/** Scored stimuli per block (the first n cannot match). */
export const SCORED_PER_BLOCK = 20
export const TARGET_SHARE = 0.3
/** A block passes at this accuracy; never pressing scores 70 %, so it fails. */
export const PASS_ACCURACY = 0.85

const LETTERS = 'BCDFGHJKLMNPRSTV'
export const GRID_CELLS = 9

interface NBackSpec {
  n: number
  intervalMs: number
}

const LEVELS: readonly NBackSpec[] = [
  { n: 1, intervalMs: 2500 },
  { n: 1, intervalMs: 2000 },
  { n: 2, intervalMs: 2500 },
  { n: 2, intervalMs: 2000 },
  { n: 2, intervalMs: 1700 },
  { n: 3, intervalMs: 2500 },
  { n: 3, intervalMs: 2000 },
  { n: 3, intervalMs: 1700 },
  { n: 4, intervalMs: 2200 },
  { n: 4, intervalMs: 1800 },
]

export function nbackSpec(level: number): NBackSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown n-back level: ${level}`)
  return spec
}

export interface NBackBlock {
  /** Letters, or grid cell indexes (as strings) for positions. */
  stimuli: string[]
  /** isTarget[i]: stimulus i matches stimulus i - n. */
  isTarget: boolean[]
  n: number
  intervalMs: number
  modality: NBackModality
  level: number
}

export function generateBlock(level: number, rng: Rng = Math.random, focus: NBackModality | null = null): NBackBlock {
  const { n, intervalMs } = nbackSpec(level)
  const modality: NBackModality = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, NBACK_MODALITIES)
  const symbols = modality === 'letters' ? [...LETTERS] : Array.from({ length: GRID_CELLS }, (_, i) => String(i))
  const total = n + SCORED_PER_BLOCK
  const targetCount = Math.round(SCORED_PER_BLOCK * TARGET_SHARE)
  // Choose exactly `targetCount` target positions among the scored ones.
  const scored = Array.from({ length: SCORED_PER_BLOCK }, (_, i) => i + n)
  const targets = new Set<number>()
  while (targets.size < targetCount) targets.add(scored[randInt(rng, 0, scored.length - 1)]!)

  const stimuli: string[] = []
  for (let i = 0; i < total; i++) {
    if (targets.has(i)) {
      stimuli.push(stimuli[i - n]!)
    } else {
      // Non-targets must not match n back by accident.
      const forbidden = i >= n ? stimuli[i - n] : undefined
      stimuli.push(pick(rng, symbols.filter((s) => s !== forbidden)))
    }
  }
  const isTarget = stimuli.map((s, i) => i >= n && s === stimuli[i - n])
  return { stimuli, isTarget, n, intervalMs, modality, level }
}

export interface BlockScore {
  hits: number
  misses: number
  falseAlarms: number
  correctRejections: number
  /** Over scored stimuli (index ≥ n). */
  accuracy: number
  passed: boolean
}

/** responses[i]: the user pressed "match" during stimulus i. */
export function scoreBlock(block: NBackBlock, responses: readonly boolean[]): BlockScore {
  let hits = 0
  let misses = 0
  let falseAlarms = 0
  let correctRejections = 0
  for (let i = block.n; i < block.stimuli.length; i++) {
    const pressed = responses[i] === true
    if (block.isTarget[i]) {
      if (pressed) hits++
      else misses++
    } else if (pressed) falseAlarms++
    else correctRejections++
  }
  const accuracy = (hits + correctRejections) / (block.stimuli.length - block.n)
  return { hits, misses, falseAlarms, correctRejections, accuracy, passed: accuracy >= PASS_ACCURACY }
}
