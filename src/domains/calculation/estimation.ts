import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/** Estimation: pick the closest of 4 values before the deadline — too short to compute exactly. */
export type EstimationKind = 'multiply' | 'divide' | 'sum' | 'percent'

export const ESTIMATION_KINDS: readonly EstimationKind[] = ['multiply', 'divide', 'sum', 'percent']

export function isEstimationKind(value: string): value is EstimationKind {
  return (ESTIMATION_KINDS as readonly string[]).includes(value)
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 15
export const FOCUS_SHARE = 0.5
export const OPTION_COUNT = 4

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown estimation level: ${level}`)
  }
}

/** Deadline: 7 s at level 1 down to 3 s at level 10, then 2.9 s down to 1.55 s at level 20. */
export function timeLimitMs(level: number): number {
  checkLevel(level)
  if (level <= 10) return 7000 - Math.round(((level - 1) * 4000) / 9)
  return 2900 - (level - 11) * 150
}

/** How far the wrong options are from the right one: ×10 / ÷10 at first, ±10 % at the top. */
export function distractorFactors(level: number): readonly number[] {
  checkLevel(level)
  if (level <= 2) return [0.1, 10, 0.01, 100]
  if (level <= 4) return [0.1, 10, 0.5, 2]
  if (level <= 6) return [0.5, 2, 0.7, 1.5]
  if (level <= 8) return [0.6, 1.5, 0.75, 1.35]
  if (level <= 10) return [0.75, 1.25, 0.8, 1.35]
  if (level <= 14) return [0.8, 1.2, 0.85, 1.15]
  return [0.85, 1.15, 0.9, 1.1]
}

/** Used when close factors collapse onto the same rounded value. */
const FALLBACK_FACTORS = [0.7, 1.3, 0.6, 1.5, 0.5, 2]

/** Rounds to 2 significant digits, the precision of the options. */
export function roundSignificant(n: number): number {
  if (n === 0) return 0
  const magnitude = 10 ** (Math.floor(Math.log10(Math.abs(n))) - 1)
  return Math.round(n / magnitude) * magnitude
}

export interface EstimationTrial {
  prompt: string
  exact: number
  options: number[]
  /** Index of the right option in `options`. */
  answerIndex: number
  kind: EstimationKind
  level: number
}

function magnitudeFor(level: number): number {
  return level <= 3 ? 99 : level <= 6 ? 999 : level <= 14 ? 9999 : 99999
}

function build(kind: EstimationKind, level: number, rng: Rng): { prompt: string; exact: number } {
  const max = magnitudeFor(level)
  switch (kind) {
    case 'multiply': {
      const a = randInt(rng, 12, max)
      const b = randInt(rng, 12, level <= 5 ? 99 : 999)
      return { prompt: `${a} × ${b}`, exact: a * b }
    }
    case 'divide': {
      const b = randInt(rng, 3, level <= 5 ? 30 : 99)
      const a = randInt(rng, b * 10, b * max)
      return { prompt: `${a} ÷ ${b}`, exact: a / b }
    }
    case 'sum': {
      const terms = Array.from({ length: 3 + Math.floor(level / 3) }, () => randInt(rng, 11, max))
      return { prompt: terms.join(' + '), exact: terms.reduce((s, t) => s + t, 0) }
    }
    case 'percent': {
      const p = randInt(rng, 3, 97)
      const n = randInt(rng, 50, max * 10)
      return { prompt: `${p} % de ${n}`, exact: (p * n) / 100 }
    }
  }
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: EstimationKind | null = null): EstimationTrial {
  checkLevel(level)
  const kind = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, ESTIMATION_KINDS)
  const { prompt, exact } = build(kind, level, rng)
  const right = roundSignificant(exact)
  const values = [right]
  for (const factor of [...distractorFactors(level), ...FALLBACK_FACTORS]) {
    const candidate = roundSignificant(right * factor)
    if (candidate > 0 && !values.includes(candidate)) values.push(candidate)
    if (values.length === OPTION_COUNT) break
  }
  if (values.length < OPTION_COUNT) throw new Error(`Could not build ${OPTION_COUNT} distinct options for ${prompt}`)
  const options = values.toSorted((x, y) => x - y)
  return { prompt, exact, options, answerIndex: options.indexOf(right), kind, level }
}

/** Compact French display: 12 300 → "12 300", 0,45 → "0,45". */
export function formatOption(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}
