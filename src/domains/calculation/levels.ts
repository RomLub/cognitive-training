import type { LevelBounds } from '../../core/adaptive'

export type Operator = '+' | '-' | '×' | '÷'

export function isOperator(value: string): value is Operator {
  return value === '+' || value === '-' || value === '×' || value === '÷'
}

type Range = readonly [min: number, max: number]

/**
 * Difficulty table. Each operator lists operand ranges; omitted operators are not used at that level.
 * For '÷' the ranges are divisor and quotient, so divisions are always exact.
 */
export interface LevelSpec {
  '+'?: { a: Range; b: Range }
  '-'?: { a: Range; b: Range }
  '×'?: { a: Range; b: Range }
  '÷'?: { divisor: Range; quotient: Range }
}

export const LEVELS: readonly LevelSpec[] = [
  /* 1 */ { '+': { a: [1, 9], b: [1, 9] } },
  /* 2 */ { '+': { a: [2, 20], b: [2, 20] }, '-': { a: [2, 20], b: [1, 20] } },
  /* 3 */ { '+': { a: [10, 99], b: [2, 9] }, '-': { a: [10, 99], b: [2, 9] }, '×': { a: [2, 5], b: [2, 10] } },
  /* 4 */ { '+': { a: [10, 99], b: [10, 99] }, '-': { a: [10, 99], b: [10, 99] }, '×': { a: [2, 9], b: [2, 10] } },
  /* 5 */ { '+': { a: [10, 99], b: [10, 99] }, '-': { a: [10, 99], b: [10, 99] }, '×': { a: [2, 12], b: [2, 12] }, '÷': { divisor: [2, 9], quotient: [2, 10] } },
  /* 6 */ { '+': { a: [100, 999], b: [10, 99] }, '-': { a: [100, 999], b: [10, 99] }, '×': { a: [11, 30], b: [2, 9] }, '÷': { divisor: [2, 12], quotient: [2, 12] } },
  /* 7 */ { '+': { a: [100, 999], b: [100, 999] }, '-': { a: [100, 999], b: [100, 999] }, '×': { a: [11, 99], b: [2, 9] }, '÷': { divisor: [2, 12], quotient: [11, 30] } },
  /* 8 */ { '+': { a: [100, 999], b: [100, 999] }, '-': { a: [100, 999], b: [100, 999] }, '×': { a: [11, 25], b: [11, 19] }, '÷': { divisor: [3, 15], quotient: [11, 50] } },
  /* 9 */ { '+': { a: [1000, 9999], b: [100, 999] }, '-': { a: [1000, 9999], b: [100, 999] }, '×': { a: [11, 99], b: [11, 25] }, '÷': { divisor: [11, 25], quotient: [11, 30] } },
  /* 10 */ { '+': { a: [1000, 9999], b: [1000, 9999] }, '-': { a: [1000, 9999], b: [1000, 9999] }, '×': { a: [11, 99], b: [11, 99] }, '÷': { divisor: [11, 99], quotient: [11, 50] } },
  // Levels 11-20: five-/six-digit additions, three-digit products and long divisions.
  /* 11 */ { '+': { a: [10000, 99999], b: [1000, 9999] }, '-': { a: [10000, 99999], b: [1000, 9999] }, '×': { a: [11, 99], b: [11, 99] }, '÷': { divisor: [11, 99], quotient: [11, 99] } },
  /* 12 */ { '+': { a: [10000, 99999], b: [10000, 99999] }, '-': { a: [10000, 99999], b: [10000, 99999] }, '×': { a: [101, 999], b: [2, 9] }, '÷': { divisor: [2, 9], quotient: [101, 999] } },
  /* 13 */ { '+': { a: [10000, 99999], b: [10000, 99999] }, '-': { a: [10000, 99999], b: [10000, 99999] }, '×': { a: [101, 999], b: [11, 19] }, '÷': { divisor: [11, 49], quotient: [101, 300] } },
  /* 14 */ { '+': { a: [100000, 999999], b: [10000, 99999] }, '-': { a: [100000, 999999], b: [10000, 99999] }, '×': { a: [101, 999], b: [11, 49] }, '÷': { divisor: [11, 99], quotient: [101, 500] } },
  /* 15 */ { '+': { a: [100000, 999999], b: [100000, 999999] }, '-': { a: [100000, 999999], b: [100000, 999999] }, '×': { a: [101, 999], b: [11, 99] }, '÷': { divisor: [11, 99], quotient: [101, 999] } },
  /* 16 */ { '+': { a: [100000, 999999], b: [100000, 999999] }, '-': { a: [100000, 999999], b: [100000, 999999] }, '×': { a: [101, 999], b: [51, 99] }, '÷': { divisor: [101, 499], quotient: [11, 99] } },
  /* 17 */ { '×': { a: [101, 999], b: [101, 199] }, '÷': { divisor: [101, 999], quotient: [11, 99] }, '+': { a: [100000, 999999], b: [100000, 999999] }, '-': { a: [100000, 999999], b: [100000, 999999] } },
  /* 18 */ { '×': { a: [101, 999], b: [101, 499] }, '÷': { divisor: [101, 999], quotient: [101, 299] } },
  /* 19 */ { '×': { a: [101, 999], b: [101, 999] }, '÷': { divisor: [101, 999], quotient: [101, 999] } },
  /* 20 */ { '×': { a: [1001, 9999], b: [11, 99] }, '÷': { divisor: [11, 99], quotient: [1001, 9999] } },
]

export const MIN_LEVEL = 1
export const MAX_LEVEL = LEVELS.length
export const LEVEL_BOUNDS: LevelBounds = { min: MIN_LEVEL, max: MAX_LEVEL }

export function getLevelSpec(level: number): LevelSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) {
    throw new Error(`Unknown calculation level: ${level}`)
  }
  return spec
}
