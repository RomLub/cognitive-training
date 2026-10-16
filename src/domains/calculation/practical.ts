import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/** Everyday calculation: percentages, fractions, discounts, increases, rule of three. Answers are integers. */
export type PracticalKind = 'percent' | 'fraction' | 'discount' | 'increase' | 'rule-of-three'

export const PRACTICAL_KINDS: readonly PracticalKind[] = ['percent', 'fraction', 'discount', 'increase', 'rule-of-three']

export function isPracticalKind(value: string): value is PracticalKind {
  return (PRACTICAL_KINDS as readonly string[]).includes(value)
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 12
export const FOCUS_SHARE = 0.5

interface PracticalSpec {
  kinds: readonly PracticalKind[]
  percents: readonly number[]
  denominators: readonly number[]
  /** Upper bound of the base quantity. */
  maxBase: number
}

const LEVELS: readonly PracticalSpec[] = [
  { kinds: ['percent'], percents: [10, 50], denominators: [2], maxBase: 100 },
  { kinds: ['percent'], percents: [10, 20, 25, 50], denominators: [2, 4], maxBase: 200 },
  { kinds: ['percent', 'fraction'], percents: [5, 10, 20, 25, 50, 75], denominators: [2, 4], maxBase: 200 },
  { kinds: ['percent', 'fraction', 'discount'], percents: [10, 20, 25, 50], denominators: [2, 3, 4, 5], maxBase: 300 },
  { kinds: ['percent', 'fraction', 'discount', 'increase'], percents: [5, 10, 15, 20, 25, 30, 40, 50], denominators: [3, 4, 5], maxBase: 400 },
  { kinds: PRACTICAL_KINDS, percents: [5, 10, 15, 20, 25, 30, 40, 60, 75], denominators: [3, 4, 5, 6, 8], maxBase: 500 },
  { kinds: PRACTICAL_KINDS, percents: [15, 30, 35, 40, 45, 60, 70, 80], denominators: [5, 6, 8], maxBase: 800 },
  { kinds: PRACTICAL_KINDS, percents: [12, 15, 35, 45, 65, 85], denominators: [6, 7, 8, 9], maxBase: 1000 },
  { kinds: PRACTICAL_KINDS, percents: [2, 3, 4, 6, 8, 12, 15, 35, 45], denominators: [7, 8, 9, 12], maxBase: 1500 },
  { kinds: PRACTICAL_KINDS, percents: [2, 3, 6, 7, 8, 12, 16, 35, 45, 65], denominators: [7, 9, 11, 12, 15], maxBase: 2000 },
  // Levels 11-20: unusual percentages and denominators, bases up to 25 000.
  { kinds: PRACTICAL_KINDS, percents: [7, 13, 17, 23, 35, 45, 65], denominators: [7, 9, 11, 13], maxBase: 3000 },
  { kinds: PRACTICAL_KINDS, percents: [6, 14, 18, 26, 42, 58, 72], denominators: [9, 11, 13, 16], maxBase: 4000 },
  { kinds: PRACTICAL_KINDS, percents: [3, 7, 13, 17, 19, 23, 27], denominators: [11, 13, 16, 17], maxBase: 5000 },
  { kinds: PRACTICAL_KINDS, percents: [4, 6, 9, 11, 14, 22, 28, 36], denominators: [12, 15, 16, 18], maxBase: 6000 },
  { kinds: PRACTICAL_KINDS, percents: [7, 11, 13, 17, 19, 21, 29, 31], denominators: [13, 17, 19, 24], maxBase: 8000 },
  { kinds: PRACTICAL_KINDS, percents: [3, 9, 13, 19, 27, 33, 41], denominators: [16, 19, 23, 25], maxBase: 10000 },
  { kinds: PRACTICAL_KINDS, percents: [7, 17, 23, 29, 37, 43, 53], denominators: [17, 21, 23, 27], maxBase: 12000 },
  { kinds: PRACTICAL_KINDS, percents: [11, 19, 31, 37, 47, 59, 61], denominators: [19, 23, 27, 29], maxBase: 15000 },
  { kinds: PRACTICAL_KINDS, percents: [13, 23, 29, 41, 53, 67, 71], denominators: [23, 29, 31, 32], maxBase: 20000 },
  { kinds: PRACTICAL_KINDS, percents: [17, 29, 37, 43, 59, 73, 83], denominators: [29, 31, 37, 41], maxBase: 25000 },
]

export function practicalSpec(level: number): PracticalSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown practical level: ${level}`)
  return spec
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** A base ≤ max that is a multiple of `step` (at least one step). */
function baseMultipleOf(step: number, max: number, rng: Rng): number {
  return step * randInt(rng, 1, Math.max(1, Math.floor(max / step)))
}

export interface PracticalTrial {
  prompt: string
  answer: number
  unit: string
  kind: PracticalKind
  level: number
}

function build(kind: PracticalKind, spec: PracticalSpec, rng: Rng): Omit<PracticalTrial, 'kind' | 'level'> {
  switch (kind) {
    case 'percent': {
      const p = pick(rng, spec.percents)
      const n = baseMultipleOf(100 / gcd(p, 100), spec.maxBase, rng)
      return { prompt: `${p} % de ${n}`, answer: (p * n) / 100, unit: '' }
    }
    case 'fraction': {
      const d = pick(rng, spec.denominators)
      const num = randInt(rng, 1, d - 1)
      const n = baseMultipleOf(d, spec.maxBase, rng)
      return { prompt: `${num}/${d} de ${n}`, answer: (num * n) / d, unit: '' }
    }
    case 'discount': {
      const p = pick(rng, spec.percents)
      const n = baseMultipleOf(100 / gcd(p, 100), spec.maxBase, rng)
      return { prompt: `Un article à ${n} € soldé −${p} % : nouveau prix ?`, answer: n - (p * n) / 100, unit: '€' }
    }
    case 'increase': {
      const p = pick(rng, spec.percents)
      const n = baseMultipleOf(100 / gcd(p, 100), spec.maxBase, rng)
      return { prompt: `${n} € augmentés de ${p} % ?`, answer: n + (p * n) / 100, unit: '€' }
    }
    case 'rule-of-three': {
      const unitPrice = randInt(rng, 2, Math.max(3, Math.floor(spec.maxBase / 50)))
      const a = randInt(rng, 2, 9)
      let c = randInt(rng, 2, 12)
      if (c === a) c += 1
      return { prompt: `${a} kg coûtent ${a * unitPrice} € : combien coûtent ${c} kg ?`, answer: c * unitPrice, unit: '€' }
    }
  }
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: PracticalKind | null = null): PracticalTrial {
  const spec = practicalSpec(level)
  const kind = focus !== null && spec.kinds.includes(focus) && rng() < FOCUS_SHARE ? focus : pick(rng, spec.kinds)
  return { ...build(kind, spec, rng), kind, level }
}
