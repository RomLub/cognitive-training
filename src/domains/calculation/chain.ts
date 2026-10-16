import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Chain calculation: a start number then operations shown one at a time ("+ 7", "× 3", "− 5"…);
 * the running total must be kept in mind and given at the end.
 */
export type ChainKind = 'additive' | 'multiplicative'
export type ChainOp = '+' | '-' | '×' | '÷'

export const CHAIN_KINDS: readonly ChainKind[] = ['additive', 'multiplicative']

export function isChainKind(value: string): value is ChainKind {
  return value === 'additive' || value === 'multiplicative'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 10
export const FOCUS_SHARE = 0.5
/** Running totals stay within this range so the chain remains mental arithmetic. */
const MAX_TOTAL = 999

interface ChainSpec {
  steps: number
  addMax: number
  /** Multiplier/divisor range, null when × ÷ are not used yet. */
  mult: readonly [number, number] | null
  stepMs: number
}

const LEVELS: readonly ChainSpec[] = [
  { steps: 3, addMax: 9, mult: null, stepMs: 2000 },
  { steps: 4, addMax: 9, mult: null, stepMs: 2000 },
  { steps: 4, addMax: 9, mult: [2, 3], stepMs: 1800 },
  { steps: 5, addMax: 20, mult: [2, 3], stepMs: 1800 },
  { steps: 5, addMax: 20, mult: [2, 5], stepMs: 1600 },
  { steps: 6, addMax: 20, mult: [2, 5], stepMs: 1600 },
  { steps: 6, addMax: 50, mult: [2, 9], stepMs: 1400 },
  { steps: 7, addMax: 50, mult: [2, 9], stepMs: 1400 },
  { steps: 8, addMax: 50, mult: [2, 9], stepMs: 1200 },
  { steps: 8, addMax: 99, mult: [2, 9], stepMs: 1000 },
]

export function chainSpec(level: number): ChainSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown chain level: ${level}`)
  return spec
}

export interface ChainStep {
  op: ChainOp
  value: number
}

export interface ChainTrial {
  start: number
  steps: ChainStep[]
  answer: number
  kind: ChainKind
  level: number
  stepMs: number
}

export function applyStep(total: number, step: ChainStep): number {
  switch (step.op) {
    case '+': return total + step.value
    case '-': return total - step.value
    case '×': return total * step.value
    case '÷': return total / step.value
  }
}

/** Picks a valid next step: non-negative total, exact division, total under MAX_TOTAL. */
function nextStep(total: number, spec: ChainSpec, allowMult: boolean, rng: Rng): ChainStep {
  const options: ChainStep[] = []
  if (allowMult && spec.mult !== null) {
    const m = randInt(rng, spec.mult[0], spec.mult[1])
    if (total * m <= MAX_TOTAL && total > 0) options.push({ op: '×', value: m })
    const divisors = []
    for (let d = spec.mult[0]; d <= spec.mult[1]; d++) if (total > 0 && total % d === 0) divisors.push(d)
    if (divisors.length > 0) options.push({ op: '÷', value: pick(rng, divisors) })
  }
  const a = randInt(rng, 1, spec.addMax)
  if (total + a <= MAX_TOTAL) options.push({ op: '+', value: a })
  if (total > 0) options.push({ op: '-', value: randInt(rng, 1, Math.min(spec.addMax, total)) })
  return pick(rng, options)
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: ChainKind | null = null): ChainTrial {
  const spec = chainSpec(level)
  const canMultiply = spec.mult !== null
  let kind: ChainKind =
    focus !== null && (focus === 'additive' || canMultiply) && rng() < FOCUS_SHARE
      ? focus
      : canMultiply && rng() < 0.5
        ? 'multiplicative'
        : 'additive'
  if (!canMultiply) kind = 'additive'

  // Retry until a multiplicative chain actually contains × or ÷ (it almost always does).
  for (let attempt = 0; attempt < 50; attempt++) {
    const start = randInt(rng, 2, Math.min(20, spec.addMax + 5))
    let total = start
    const steps: ChainStep[] = []
    for (let i = 0; i < spec.steps; i++) {
      const step = nextStep(total, spec, kind === 'multiplicative', rng)
      steps.push(step)
      total = applyStep(total, step)
    }
    const hasMult = steps.some((st) => st.op === '×' || st.op === '÷')
    if (kind === 'additive' || hasMult) return { start, steps, answer: total, kind, level, stepMs: spec.stepMs }
  }
  throw new Error(`Could not build a multiplicative chain at level ${level}`)
}

export function formatStep(step: ChainStep): string {
  return `${step.op === '-' ? '−' : step.op} ${step.value}`
}
