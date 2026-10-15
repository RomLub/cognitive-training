import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { FOCUS_SHARE, formatProblem, generateProblem } from './generator'
import { getLevelSpec, MAX_LEVEL, MIN_LEVEL } from './levels'

const SAMPLES = 500

describe('generateProblem', () => {
  for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
    it(`level ${level}: correct answers, allowed operators, non-negative integer results`, () => {
      const rng = seededRng(level)
      const allowed = Object.keys(getLevelSpec(level))
      for (let i = 0; i < SAMPLES; i++) {
        const p = generateProblem(level, rng)
        expect(allowed).toContain(p.operator)
        expect(p.level).toBe(level)
        expect(Number.isInteger(p.answer)).toBe(true)
        expect(p.answer).toBeGreaterThanOrEqual(0)
        const expected = { '+': p.a + p.b, '-': p.a - p.b, '×': p.a * p.b, '÷': p.a / p.b }[p.operator]
        expect(p.answer).toBe(expected)
      }
    })
  }

  it('respects operand ranges', () => {
    const rng = seededRng(42)
    for (let i = 0; i < SAMPLES; i++) {
      const p = generateProblem(1, rng)
      expect(p.a).toBeGreaterThanOrEqual(1)
      expect(p.a).toBeLessThanOrEqual(9)
      expect(p.b).toBeGreaterThanOrEqual(1)
      expect(p.b).toBeLessThanOrEqual(9)
    }
  })

  it('is deterministic for a given seed', () => {
    const a = Array.from({ length: 10 }, ((rng) => () => generateProblem(7, rng))(seededRng(1)))
    const b = Array.from({ length: 10 }, ((rng) => () => generateProblem(7, rng))(seededRng(1)))
    expect(a).toEqual(b)
  })

  it('rejects unknown levels', () => {
    expect(() => generateProblem(0)).toThrow()
    expect(() => generateProblem(MAX_LEVEL + 1)).toThrow()
    expect(() => generateProblem(1.5)).toThrow()
  })

  it('formats problems', () => {
    expect(formatProblem({ a: 12, b: 3, operator: '÷', answer: 4, level: 5 })).toBe('12 ÷ 3')
  })

  describe('focus on a weak operator', () => {
    const N = 4000
    const share = (level: number, focus: '+' | '-' | '×' | '÷' | null, op: string) => {
      const rng = seededRng(7)
      let hits = 0
      for (let i = 0; i < N; i++) if (generateProblem(level, rng, focus).operator === op) hits++
      return hits / N
    }

    it('over-represents the focus operator', () => {
      // Level 5 has 4 operators: uniform share 25 %, focused share = FOCUS_SHARE + (1 - FOCUS_SHARE) / 4.
      const expected = FOCUS_SHARE + (1 - FOCUS_SHARE) / 4
      expect(share(5, '÷', '÷')).toBeCloseTo(expected, 1)
      expect(share(5, null, '÷')).toBeCloseTo(0.25, 1)
    })

    it('still produces the other operators', () => {
      for (const op of ['+', '-', '×']) expect(share(5, '÷', op)).toBeGreaterThan(0.08)
    })

    it('ignores a focus the level does not use', () => {
      expect(share(2, '÷', '÷')).toBe(0)
      expect(share(2, '÷', '+')).toBeCloseTo(0.5, 1)
    })
  })
})
