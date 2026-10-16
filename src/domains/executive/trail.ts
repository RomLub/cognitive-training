import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Trail Making: click scattered circles in order. "numbers" = 1-2-3… (part A);
 * "alternating" = 1-A-2-B-3-C… (part B, mental flexibility). A trail passes with no error, within the time.
 */
export type TrailKind = 'numbers' | 'alternating'

export const TRAIL_KINDS: readonly TrailKind[] = ['numbers', 'alternating']

export function isTrailKind(value: string): value is TrailKind {
  return value === 'numbers' || value === 'alternating'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 4
export const FOCUS_SHARE = 0.5
/** Circle positions are kept this far apart (in % of the board). */
export const MIN_DISTANCE = 13

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown trail level: ${level}`)
  }
}

/** Circles: 6 at level 1 up to 24 at level 10. */
export function nodeCount(level: number): number {
  checkLevel(level)
  return 6 + 2 * (level - 1)
}

/** Time allowed for the whole trail: ~1.7 s per circle at level 1, ~1 s at level 10. */
export function trailTimeLimitMs(level: number): number {
  return nodeCount(level) * (1800 - 80 * level)
}

/** Labels in the order they must be clicked. */
export function trailLabels(kind: TrailKind, count: number): string[] {
  if (kind === 'numbers') return Array.from({ length: count }, (_, i) => String(i + 1))
  return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? String(i / 2 + 1) : String.fromCharCode(65 + (i - 1) / 2)))
}

export interface TrailNode {
  label: string
  /** Center, in % of the board. */
  x: number
  y: number
}

export interface TrailTrial {
  /** In click order. */
  nodes: TrailNode[]
  kind: TrailKind
  level: number
  timeLimitMs: number
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: TrailKind | null = null): TrailTrial {
  const kind: TrailKind = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, TRAIL_KINDS)
  const labels = trailLabels(kind, nodeCount(level))
  const positions: { x: number; y: number }[] = []
  for (let attempt = 0; positions.length < labels.length; attempt++) {
    if (attempt > 20_000) throw new Error(`Could not place ${labels.length} circles`)
    const p = { x: 6 + rng() * 88, y: 6 + rng() * 88 }
    if (positions.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= MIN_DISTANCE)) positions.push(p)
  }
  return {
    nodes: labels.map((label, i) => ({ label, ...positions[i]! })),
    kind,
    level,
    timeLimitMs: trailTimeLimitMs(level),
  }
}
