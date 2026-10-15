import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { charsetFor, generateTrial, LEVEL_BOUNDS, pairLength, timeLimitMs } from './compare'

describe('pair comparison', () => {
  it('builds identical pairs for "same" and pairs differing by one edit for "different"', () => {
    const rng = seededRng(8)
    for (let level = LEVEL_BOUNDS.min; level <= LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 300; i++) {
        const t = generateTrial(level, rng)
        expect(t.left).toHaveLength(pairLength(level))
        expect(t.right).toHaveLength(pairLength(level))
        for (const c of t.left + t.right) expect(charsetFor(level)).toContain(c)
        if (t.kind === 'same') {
          expect(t.right).toBe(t.left)
        } else {
          expect(t.right).not.toBe(t.left)
          const diffs = [...t.left].filter((c, k) => c !== t.right[k]).length
          expect(diffs === 1 || diffs === 2).toBe(true)
        }
      }
    }
  })

  it('gives a sensible deadline at every level', () => {
    for (let level = LEVEL_BOUNDS.min; level <= LEVEL_BOUNDS.max; level++) {
      expect(timeLimitMs(level)).toBeGreaterThan(2000)
      expect(timeLimitMs(level)).toBeLessThan(7000)
    }
  })

  it('over-represents the focus kind', () => {
    const rng = seededRng(1)
    let n = 0
    for (let i = 0; i < 4000; i++) if (generateTrial(3, rng, 'different').kind === 'different') n++
    expect(n / 4000).toBeCloseTo(0.75, 1)
  })

  it('rejects unknown levels', () => {
    expect(() => generateTrial(0)).toThrow()
    expect(() => pairLength(11)).toThrow()
  })
})
