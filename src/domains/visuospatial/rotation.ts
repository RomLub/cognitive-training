import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Mental rotation: is the right shape the left one rotated, or its mirror image rotated?
 * Shapes are asymmetric polyominoes (no mirror symmetry), so the two cases never coincide.
 */
export type RotationKind = 'same' | 'mirror'
export type Cell = readonly [number, number]

export const ROTATION_KINDS: readonly RotationKind[] = ['same', 'mirror']

export function isRotationKind(value: string): value is RotationKind {
  return value === 'same' || value === 'mirror'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 20
export const FOCUS_SHARE = 0.5

interface RotationSpec {
  cells: number
  /** Rotation angles in degrees (0 excluded: the shape is always turned). */
  angles: readonly number[]
  timeLimitMs: number
}

const RIGHT = [90, 180, 270]
const EIGHTHS = [45, 90, 135, 180, 225, 270, 315]
const ANY = Array.from({ length: 23 }, (_, i) => (i + 1) * 15)

const LEVELS: readonly RotationSpec[] = [
  { cells: 4, angles: RIGHT, timeLimitMs: 8000 },
  { cells: 5, angles: RIGHT, timeLimitMs: 7000 },
  { cells: 5, angles: EIGHTHS, timeLimitMs: 7000 },
  { cells: 6, angles: EIGHTHS, timeLimitMs: 6500 },
  { cells: 6, angles: ANY, timeLimitMs: 6000 },
  { cells: 7, angles: ANY, timeLimitMs: 6000 },
  { cells: 7, angles: ANY, timeLimitMs: 5000 },
  { cells: 8, angles: ANY, timeLimitMs: 5000 },
  { cells: 8, angles: ANY, timeLimitMs: 4000 },
  { cells: 9, angles: ANY, timeLimitMs: 3500 },
]

export function rotationSpec(level: number): RotationSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown rotation level: ${level}`)
  return spec
}

/** Translates cells so the minimum x and y are 0, sorted, as a comparable key. */
export function canonical(cells: readonly Cell[]): string {
  const minX = Math.min(...cells.map(([x]) => x))
  const minY = Math.min(...cells.map(([, y]) => y))
  return cells
    .map(([x, y]) => [x - minX, y - minY] as const)
    .toSorted((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([x, y]) => `${x},${y}`)
    .join(';')
}

const rotate90 = (cells: readonly Cell[]): Cell[] => cells.map(([x, y]) => [-y, x] as const)
export const mirror = (cells: readonly Cell[]): Cell[] => cells.map(([x, y]) => [-x, y] as const)

/** True when the mirror image cannot be obtained by rotating the shape. */
export function isChiral(cells: readonly Cell[]): boolean {
  const mirrored = canonical(mirror(cells))
  let r: readonly Cell[] = cells
  for (let i = 0; i < 4; i++) {
    if (canonical(r) === mirrored) return false
    r = rotate90(r)
  }
  return true
}

/** Random connected shape grown cell by cell, retried until asymmetric. */
export function randomPolyomino(size: number, rng: Rng): Cell[] {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const cells: Cell[] = [[0, 0]]
    const has = (x: number, y: number) => cells.some(([cx, cy]) => cx === x && cy === y)
    while (cells.length < size) {
      const [x, y] = pick(rng, cells)
      const [dx, dy] = pick(rng, [[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
      if (!has(x + dx, y + dy)) cells.push([x + dx, y + dy])
    }
    if (isChiral(cells)) return cells
  }
  throw new Error(`Could not grow an asymmetric shape of ${size} cells`)
}

export interface RotationTrial {
  cells: Cell[]
  /** Cells of the right-hand figure before rotation (mirrored or not). */
  rightCells: Cell[]
  angle: number
  kind: RotationKind
  level: number
  timeLimitMs: number
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: RotationKind | null = null): RotationTrial {
  const spec = rotationSpec(level)
  const kind: RotationKind = focus !== null && rng() < FOCUS_SHARE ? focus : rng() < 0.5 ? 'same' : 'mirror'
  const cells = randomPolyomino(spec.cells, rng)
  return {
    cells,
    rightCells: kind === 'same' ? cells : mirror(cells),
    angle: pick(rng, spec.angles),
    kind,
    level,
    timeLimitMs: spec.timeLimitMs,
  }
}
