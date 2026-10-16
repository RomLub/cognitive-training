import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/** Visual search: is the target character somewhere in the grid? Distractors look more alike as levels rise. */
export type SearchKind = 'present' | 'absent'

export const SEARCH_KINDS: readonly SearchKind[] = ['present', 'absent']

export function isSearchKind(value: string): value is SearchKind {
  return value === 'present' || value === 'absent'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 20
export const FOCUS_SHARE = 0.5

/** [target, distractor] families, from easy to tell apart to near-identical. */
const FAMILIES: readonly (readonly (readonly [string, string])[])[] = [
  [['X', 'O'], ['A', 'V'], ['K', 'S'], ['T', 'O']],
  [['E', 'F'], ['P', 'R'], ['C', 'G'], ['M', 'N'], ['V', 'Y']],
  [['O', 'Q'], ['8', 'B'], ['5', 'S'], ['0', 'O'], ['E', 'F']],
]

interface SearchSpec {
  /** Grid side; the grid holds side × side items. */
  side: number
  family: number
  timeLimitMs: number
}

const LEVELS: readonly SearchSpec[] = [
  { side: 3, family: 0, timeLimitMs: 5000 },
  { side: 4, family: 0, timeLimitMs: 5000 },
  { side: 4, family: 1, timeLimitMs: 5000 },
  { side: 5, family: 1, timeLimitMs: 5000 },
  { side: 5, family: 1, timeLimitMs: 4000 },
  { side: 6, family: 1, timeLimitMs: 4500 },
  { side: 6, family: 2, timeLimitMs: 5000 },
  { side: 7, family: 2, timeLimitMs: 5000 },
  { side: 7, family: 2, timeLimitMs: 4000 },
  { side: 8, family: 2, timeLimitMs: 4500 },
  { side: 8, family: 2, timeLimitMs: 4000 },
  { side: 8, family: 2, timeLimitMs: 3600 },
  { side: 9, family: 2, timeLimitMs: 4000 },
  { side: 9, family: 2, timeLimitMs: 3600 },
  { side: 9, family: 2, timeLimitMs: 3200 },
  { side: 10, family: 2, timeLimitMs: 3600 },
  { side: 10, family: 2, timeLimitMs: 3200 },
  { side: 10, family: 2, timeLimitMs: 2900 },
  { side: 10, family: 2, timeLimitMs: 2700 },
  { side: 10, family: 2, timeLimitMs: 2500 },
]

export function searchSpec(level: number): SearchSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown visual-search level: ${level}`)
  return spec
}

export interface SearchTrial {
  target: string
  /** Row-major grid of characters. */
  grid: string[]
  side: number
  kind: SearchKind
  level: number
  timeLimitMs: number
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: SearchKind | null = null): SearchTrial {
  const spec = searchSpec(level)
  const kind: SearchKind = focus !== null && rng() < FOCUS_SHARE ? focus : rng() < 0.5 ? 'present' : 'absent'
  const [target, distractor] = pick(rng, FAMILIES[spec.family]!)
  const grid = Array.from({ length: spec.side * spec.side }, () => distractor)
  if (kind === 'present') grid[randInt(rng, 0, grid.length - 1)] = target
  return { target, grid, side: spec.side, kind, level, timeLimitMs: spec.timeLimitMs }
}
