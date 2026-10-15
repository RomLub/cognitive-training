import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { generateTrial, LEVEL_BOUNDS, rulesForLevel, SERIES_RULES, type SeriesRule } from './series'

/** Independent check of each rule: recomputes the next term from the visible ones. */
function nextTerm(rule: SeriesRule, t: number[]): number {
  const at = (i: number) => t.at(i)!
  switch (rule) {
    case 'arithmetic': return at(-1) + (at(-1) - at(-2))
    case 'geometric': return at(-1) * (at(-1) / at(-2))
    case 'alternating': return at(-1) + (at(-2) - at(-3))
    case 'second-order': return at(-1) + 2 * (at(-1) - at(-2)) - (at(-2) - at(-3))
    case 'fibonacci': return at(-1) + at(-2)
    case 'interleaved': return at(-2) + (at(-2) - at(-4))
  }
}

describe('number series', () => {
  it('produces integer, non-negative series whose answer follows the rule', () => {
    const rng = seededRng(2)
    for (let level = LEVEL_BOUNDS.min; level <= LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 300; i++) {
        const t = generateTrial(level, rng)
        expect(rulesForLevel(level)).toContain(t.rule)
        expect(t.terms.length).toBeGreaterThanOrEqual(5)
        for (const n of [...t.terms, t.answer]) {
          expect(Number.isInteger(n)).toBe(true)
          expect(n).toBeGreaterThanOrEqual(0)
        }
        expect(t.answer).toBe(nextTerm(t.rule, t.terms))
        expect(t.explanation.length).toBeGreaterThan(0)
      }
    }
  })

  it('unlocks every rule by the top levels', () => {
    expect(rulesForLevel(1)).toEqual(['arithmetic'])
    expect([...rulesForLevel(LEVEL_BOUNDS.max)].sort()).toEqual([...SERIES_RULES].sort())
  })

  it('focuses on a weak rule only when the level offers it', () => {
    const count = (level: number, focus: SeriesRule) => {
      const rng = seededRng(4)
      let n = 0
      for (let i = 0; i < 2000; i++) if (generateTrial(level, rng, focus).rule === focus) n++
      return n / 2000
    }
    expect(count(10, 'fibonacci')).toBeGreaterThan(0.5)
    expect(count(1, 'fibonacci')).toBe(0)
  })

  it('rejects unknown levels', () => {
    expect(() => generateTrial(0)).toThrow()
    expect(() => generateTrial(11)).toThrow()
  })
})
