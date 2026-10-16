import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'
import { sample } from '../episodic/wordList'

/**
 * Matrices (Raven-like): a 3×3 grid of figures follows rules on three attributes (shape, count, fill);
 * pick the figure that completes the bottom-right cell.
 */
export type Attribute = 'shape' | 'count' | 'fill'
/** How an attribute varies: same everywhere, by column, by row, or each value once per row and column. */
export type MatrixRule = 'constant' | 'column' | 'row' | 'latin'
/** Category = the hardest rule in the matrix. */
export type MatrixKind = 'column' | 'row' | 'latin'

export const ATTRIBUTES: readonly Attribute[] = ['shape', 'count', 'fill']
export const MATRIX_KINDS: readonly MatrixKind[] = ['column', 'row', 'latin']

export function isMatrixKind(value: string): value is MatrixKind {
  return value === 'column' || value === 'row' || value === 'latin'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 8
export const FOCUS_SHARE = 0.5

/** Each attribute takes a value 0-2: shape (circle, square, triangle), count (1-3 items), fill (empty, striped, full). */
export interface Figure {
  shape: number
  count: number
  fill: number
}

interface MatrixSpec {
  /** Attributes that vary (the others are constant). */
  varying: number
  rules: readonly Exclude<MatrixRule, 'constant'>[]
  options: number
}

const LEVELS: readonly MatrixSpec[] = [
  { varying: 1, rules: ['column', 'row'], options: 4 },
  { varying: 1, rules: ['column', 'row', 'latin'], options: 4 },
  { varying: 2, rules: ['column', 'row'], options: 6 },
  { varying: 2, rules: ['column', 'row', 'latin'], options: 6 },
  { varying: 2, rules: ['latin'], options: 6 },
  { varying: 3, rules: ['column', 'row', 'latin'], options: 6 },
  { varying: 3, rules: ['column', 'row', 'latin'], options: 6 },
  { varying: 3, rules: ['row', 'latin'], options: 8 },
  { varying: 3, rules: ['latin'], options: 8 },
  { varying: 3, rules: ['latin'], options: 8 },
]

export function matrixSpec(level: number): MatrixSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown matrix level: ${level}`)
  return spec
}

const PERMUTATIONS: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
]

/** Value of an attribute at (row, col) under a rule; `perm` maps 0-2 to the attribute's values. */
function valueAt(rule: MatrixRule, perm: readonly number[], row: number, col: number, latinStep: number): number {
  switch (rule) {
    case 'constant': return perm[0]!
    case 'column': return perm[col]!
    case 'row': return perm[row]!
    case 'latin': return perm[(row * latinStep + col) % 3]!
  }
}

export interface MatrixTrial {
  /** 9 cells row by row; cell 8 is the one to find (still filled in here). */
  cells: Figure[]
  options: Figure[]
  answerIndex: number
  rules: Record<Attribute, MatrixRule>
  kind: MatrixKind
  level: number
}

export function sameFigure(a: Figure, b: Figure): boolean {
  return a.shape === b.shape && a.count === b.count && a.fill === b.fill
}

const DIFFICULTY: Record<MatrixKind, number> = { column: 0, row: 1, latin: 2 }

export function generateTrial(level: number, rng: Rng = Math.random, focus: MatrixKind | null = null): MatrixTrial {
  const spec = matrixSpec(level)
  for (let attempt = 0; attempt < 100; attempt++) {
    const varying = new Set(sample(rng, ATTRIBUTES, spec.varying))
    const rules = Object.fromEntries(
      ATTRIBUTES.map((a) => [a, varying.has(a) ? pick(rng, spec.rules) : 'constant']),
    ) as Record<Attribute, MatrixRule>
    const used = Object.values(rules).filter((r): r is MatrixKind => r !== 'constant')
    const kind = used.reduce<MatrixKind>((hardest, r) => (DIFFICULTY[r] > DIFFICULTY[hardest] ? r : hardest), 'column')
    if (focus !== null && spec.rules.includes(focus) && rng() < FOCUS_SHARE && !used.includes(focus)) continue

    const perms: Record<Attribute, readonly number[]> = {
      shape: pick(rng, PERMUTATIONS),
      count: pick(rng, PERMUTATIONS),
      fill: pick(rng, PERMUTATIONS),
    }
    const latinStep = rng() < 0.5 ? 1 : 2
    const cells: Figure[] = []
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        cells.push({
          shape: valueAt(rules.shape, perms.shape, row, col, latinStep),
          count: valueAt(rules.count, perms.count, row, col, latinStep),
          fill: valueAt(rules.fill, perms.fill, row, col, latinStep),
        })
      }
    }
    const answer = cells[8]!

    // Distractors differ from the answer in one attribute first (hardest to reject), then two.
    const candidates: Figure[] = []
    for (const a of ATTRIBUTES) for (const v of [0, 1, 2]) if (v !== answer[a]) candidates.push({ ...answer, [a]: v })
    for (const a of ATTRIBUTES) {
      for (const b of ATTRIBUTES) {
        if (a >= b) continue
        candidates.push({ ...answer, [a]: (answer[a] + 1) % 3, [b]: (answer[b] + 2) % 3 })
      }
    }
    const distractors = sample(rng, candidates.filter((c) => !sameFigure(c, answer)), spec.options - 1)
    const options = sample(rng, [answer, ...distractors], spec.options)
    return { cells, options, answerIndex: options.findIndex((o) => sameFigure(o, answer)), rules, kind, level }
  }
  throw new Error(`Could not build a matrix at level ${level}`)
}
