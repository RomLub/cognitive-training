import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/** Number series: find the next term. Each rule type is a category for weak-point tracking. */
export type SeriesRule = 'arithmetic' | 'geometric' | 'alternating' | 'second-order' | 'fibonacci' | 'interleaved'

export const SERIES_RULES: readonly SeriesRule[] = [
  'arithmetic',
  'geometric',
  'alternating',
  'second-order',
  'fibonacci',
  'interleaved',
]

export function isSeriesRule(value: string): value is SeriesRule {
  return (SERIES_RULES as readonly string[]).includes(value)
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 12
export const FOCUS_SHARE = 0.5

/** Rules available per level (index 0 = level 1). Magnitudes also grow with the level. */
const LEVEL_RULES: readonly (readonly SeriesRule[])[] = [
  ['arithmetic'],
  ['arithmetic'],
  ['arithmetic', 'geometric'],
  ['arithmetic', 'geometric', 'alternating'],
  ['geometric', 'alternating', 'second-order'],
  ['alternating', 'second-order', 'fibonacci'],
  ['alternating', 'second-order', 'fibonacci', 'interleaved'],
  ...Array.from({ length: 13 }, () => SERIES_RULES),
]

export function rulesForLevel(level: number): readonly SeriesRule[] {
  const rules = LEVEL_RULES[level - 1]
  if (!Number.isInteger(level) || rules === undefined) throw new Error(`Unknown logic level: ${level}`)
  return rules
}

export interface SeriesTrial {
  /** Visible terms; the answer is the next one. */
  terms: number[]
  answer: number
  rule: SeriesRule
  level: number
  /** Short explanation shown after answering. */
  explanation: string
}

/** Visible terms: 5, then only 4 from level 15 (less evidence to infer the rule). */
function visibleTerms(level: number): number {
  return level >= 15 ? 4 : 5
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${-n}`
}

function build(rule: SeriesRule, level: number, rng: Rng): Omit<SeriesTrial, 'level' | 'rule'> {
  const VISIBLE_TERMS = visibleTerms(level)
  switch (rule) {
    case 'arithmetic': {
      const step = randInt(rng, 1, 2 + level) * (level >= 2 && rng() < 0.4 ? -1 : 1)
      // Descending series start high enough to stay non-negative.
      const start = step < 0 ? -step * VISIBLE_TERMS + randInt(rng, 0, 10 * level) : randInt(rng, 1, 10 * level)
      const terms = Array.from({ length: VISIBLE_TERMS + 1 }, (_, i) => start + i * step)
      return { terms: terms.slice(0, -1), answer: terms.at(-1)!, explanation: `${signed(step)} à chaque fois` }
    }
    case 'geometric': {
      const ratio = level >= 15 ? randInt(rng, 3, 5) : level >= 8 ? randInt(rng, 2, 4) : randInt(rng, 2, 3)
      const start = randInt(rng, 1, 2 + Math.floor(level / 2))
      const terms = Array.from({ length: VISIBLE_TERMS + 1 }, (_, i) => start * ratio ** i)
      return { terms: terms.slice(0, -1), answer: terms.at(-1)!, explanation: `×${ratio} à chaque fois` }
    }
    case 'alternating': {
      const a = randInt(rng, 2, 3 + level)
      let b = randInt(rng, 1, 2 + level) * (rng() < 0.5 ? -1 : 1)
      if (b === a) b = -b
      const start = randInt(rng, 1, 10 * level) + Math.max(0, -b) * VISIBLE_TERMS
      const terms = [start]
      for (let i = 0; i < VISIBLE_TERMS; i++) terms.push(terms[i]! + (i % 2 === 0 ? a : b))
      return { terms: terms.slice(0, -1), answer: terms.at(-1)!, explanation: `${signed(a)} puis ${signed(b)} en alternance` }
    }
    case 'second-order': {
      const d0 = randInt(rng, 1, 3 + level)
      const k = randInt(rng, 1, 1 + Math.floor(level / 3))
      const start = randInt(rng, 1, 10 * level)
      const terms = [start]
      for (let i = 0; i < VISIBLE_TERMS; i++) terms.push(terms[i]! + d0 + i * k)
      return {
        terms: terms.slice(0, -1),
        answer: terms.at(-1)!,
        explanation: `les écarts augmentent de ${k} : ${signed(d0)}, ${signed(d0 + k)}, ${signed(d0 + 2 * k)}…`,
      }
    }
    case 'fibonacci': {
      const terms = [randInt(rng, 1, 2 + level), randInt(rng, 1, 2 + level)]
      while (terms.length < VISIBLE_TERMS + 1) terms.push(terms.at(-1)! + terms.at(-2)!)
      return { terms: terms.slice(0, -1), answer: terms.at(-1)!, explanation: 'chaque terme est la somme des deux précédents' }
    }
    case 'interleaved': {
      // Two arithmetic series a, b interleaved: a0 b0 a1 b1 a2 b2 → a3.
      const a0 = randInt(rng, 1, 10 * level)
      const sa = randInt(rng, 1, 2 + level)
      const b0 = randInt(rng, 1, 10 * level)
      const sb = randInt(rng, 1, 2 + level) * (rng() < 0.5 ? -1 : 1)
      const b0Safe = sb < 0 ? b0 - sb * 3 : b0
      const terms = [0, 1, 2].flatMap((i) => [a0 + i * sa, b0Safe + i * sb])
      return {
        terms,
        answer: a0 + 3 * sa,
        explanation: `deux suites entremêlées : ${signed(sa)} et ${signed(sb)}`,
      }
    }
  }
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: SeriesRule | null = null): SeriesTrial {
  const rules = rulesForLevel(level)
  const rule = focus !== null && rules.includes(focus) && rng() < FOCUS_SHARE ? focus : pick(rng, rules)
  return { ...build(rule, level, rng), rule, level }
}
