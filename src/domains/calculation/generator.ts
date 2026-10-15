import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'
import { getLevelSpec, type Operator } from './levels'

export interface Problem {
  a: number
  b: number
  operator: Operator
  answer: number
  level: number
}

/** Share of draws forced onto the focus operator; the rest stay uniform (focus included). */
export const FOCUS_SHARE = 0.5

/**
 * @param focus operator to practise more (the user's weak point). Ignored when the level doesn't use it.
 */
export function generateProblem(level: number, rng: Rng = Math.random, focus: Operator | null = null): Problem {
  const spec = getLevelSpec(level)
  const operators = (Object.keys(spec) as Operator[]).filter((op) => spec[op] !== undefined)
  const operator = focus !== null && operators.includes(focus) && rng() < FOCUS_SHARE ? focus : pick(rng, operators)

  switch (operator) {
    case '+': {
      const r = spec['+']!
      const a = randInt(rng, ...r.a)
      const b = randInt(rng, ...r.b)
      return { a, b, operator, answer: a + b, level }
    }
    case '-': {
      // Larger operand first so results stay non-negative.
      const r = spec['-']!
      const x = randInt(rng, ...r.a)
      const y = randInt(rng, ...r.b)
      const [a, b] = x >= y ? [x, y] : [y, x]
      return { a, b, operator, answer: a - b, level }
    }
    case '×': {
      const r = spec['×']!
      const a = randInt(rng, ...r.a)
      const b = randInt(rng, ...r.b)
      return { a, b, operator, answer: a * b, level }
    }
    case '÷': {
      const r = spec['÷']!
      const divisor = randInt(rng, ...r.divisor)
      const quotient = randInt(rng, ...r.quotient)
      return { a: divisor * quotient, b: divisor, operator, answer: quotient, level }
    }
  }
}

export function formatProblem(p: Problem): string {
  return `${p.a} ${p.operator} ${p.b}`
}
