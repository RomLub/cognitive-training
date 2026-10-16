import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { ATTRIBUTES, generateTrial, matrixSpec, sameFigure, type Figure, type MatrixRule } from './matrices'

/** Checks an attribute rule independently on the 3×3 grid. */
function follows(rule: MatrixRule, values: number[]): boolean {
  const at = (r: number, c: number) => values[r * 3 + c]!
  const rows = [0, 1, 2]
  switch (rule) {
    case 'constant': return new Set(values).size === 1
    case 'column': return rows.every((r) => rows.every((c) => at(r, c) === at(0, c))) && new Set([at(0, 0), at(0, 1), at(0, 2)]).size === 3
    case 'row': return rows.every((r) => rows.every((c) => at(r, c) === at(r, 0))) && new Set([at(0, 0), at(1, 0), at(2, 0)]).size === 3
    case 'latin': return rows.every((r) => new Set(rows.map((c) => at(r, c))).size === 3 && new Set(rows.map((c) => at(c, r))).size === 3)
  }
}

describe('matrices', () => {
  it('builds grids that follow their rules, with a unique right option', () => {
    const rng = seededRng(14)
    for (let level = 1; level <= 20; level++) {
      const spec = matrixSpec(level)
      for (let i = 0; i < 100; i++) {
        const t = generateTrial(level, rng)
        expect(t.cells).toHaveLength(9)
        for (const a of ATTRIBUTES) expect(follows(t.rules[a], t.cells.map((c) => c[a]))).toBe(true)
        expect(Object.values(t.rules).filter((r) => r !== 'constant')).toHaveLength(spec.varying)
        expect(t.options).toHaveLength(spec.options)
        expect(sameFigure(t.options[t.answerIndex]!, t.cells[8]!)).toBe(true)
        expect(t.options.filter((o: Figure) => sameFigure(o, t.cells[8]!))).toHaveLength(1)
        for (const o of t.options) for (const a of ATTRIBUTES) expect([0, 1, 2]).toContain(o[a])
      }
    }
  })

  it('labels a matrix by its hardest rule', () => {
    const t = generateTrial(9, seededRng(1))
    expect(t.kind).toBe('latin')
  })
})
