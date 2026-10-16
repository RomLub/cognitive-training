import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import * as chain from './chain'
import * as estimation from './estimation'
import * as practical from './practical'

describe('chain calculation', () => {
  it('replays to the stated answer, keeps totals non-negative and divisions exact', () => {
    const rng = seededRng(21)
    for (let level = chain.LEVEL_BOUNDS.min; level <= chain.LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 200; i++) {
        const t = chain.generateTrial(level, rng)
        expect(t.steps).toHaveLength(chain.chainSpec(level).steps)
        let total = t.start
        for (const step of t.steps) {
          total = chain.applyStep(total, step)
          expect(Number.isInteger(total)).toBe(true)
          expect(total).toBeGreaterThanOrEqual(0)
          expect(total).toBeLessThanOrEqual(999)
        }
        expect(total).toBe(t.answer)
        const hasMult = t.steps.some((s) => s.op === '×' || s.op === '÷')
        if (t.kind === 'multiplicative') expect(hasMult).toBe(true)
        else expect(hasMult).toBe(false)
      }
    }
  })

  it('uses only + and − before level 3, and focuses when asked', () => {
    const rng = seededRng(3)
    for (let i = 0; i < 100; i++) expect(chain.generateTrial(2, rng, 'multiplicative').kind).toBe('additive')
    let mult = 0
    for (let i = 0; i < 1000; i++) if (chain.generateTrial(6, rng, 'multiplicative').kind === 'multiplicative') mult++
    expect(mult / 1000).toBeGreaterThan(0.65)
  })

  it('formats steps with a real minus sign', () => {
    expect(chain.formatStep({ op: '-', value: 4 })).toBe('− 4')
    expect(chain.formatStep({ op: '×', value: 3 })).toBe('× 3')
  })
})

describe('practical calculation', () => {
  it('produces integer answers matching the prompt at every level', () => {
    const rng = seededRng(13)
    for (let level = practical.LEVEL_BOUNDS.min; level <= practical.LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 300; i++) {
        const t = practical.generateTrial(level, rng)
        expect(practical.practicalSpec(level).kinds).toContain(t.kind)
        expect(Number.isInteger(t.answer)).toBe(true)
        expect(t.answer).toBeGreaterThan(0)
        const nums = (t.prompt.match(/\d+/g) ?? []).map(Number)
        switch (t.kind) {
          case 'percent': expect(t.answer).toBe((nums[0]! * nums[1]!) / 100); break
          case 'fraction': expect(t.answer).toBe((nums[0]! * nums[2]!) / nums[1]!); break
          case 'discount': expect(t.answer).toBe(nums[0]! - (nums[0]! * nums[1]!) / 100); break
          case 'increase': expect(t.answer).toBe(nums[0]! + (nums[0]! * nums[1]!) / 100); break
          case 'rule-of-three': expect(t.answer).toBe((nums[1]! / nums[0]!) * nums[2]!); break
        }
      }
    }
  })

  it('introduces kinds progressively', () => {
    expect(practical.practicalSpec(1).kinds).toEqual(['percent'])
    expect(practical.practicalSpec(10).kinds).toEqual(practical.PRACTICAL_KINDS)
  })
})

describe('estimation', () => {
  it('offers 4 distinct sorted options with the rounded exact value among them', () => {
    const rng = seededRng(17)
    for (let level = estimation.LEVEL_BOUNDS.min; level <= estimation.LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 300; i++) {
        const t = estimation.generateTrial(level, rng)
        expect(t.options).toHaveLength(estimation.OPTION_COUNT)
        expect(new Set(t.options).size).toBe(estimation.OPTION_COUNT)
        expect(t.options).toEqual(t.options.toSorted((x, y) => x - y))
        expect(t.options[t.answerIndex]).toBe(estimation.roundSignificant(t.exact))
        // The right option is the closest to the exact value.
        const distances = t.options.map((o) => Math.abs(Math.log(o / t.exact)))
        expect(Math.min(...distances)).toBe(distances[t.answerIndex])
      }
    }
  })

  it('rounds to 2 significant digits and shortens the deadline', () => {
    expect(estimation.roundSignificant(10234)).toBe(10000)
    expect(estimation.roundSignificant(487 * 21)).toBe(10000)
    expect(estimation.roundSignificant(0.456)).toBeCloseTo(0.46)
    expect(estimation.timeLimitMs(1)).toBe(7000)
    expect(estimation.timeLimitMs(10)).toBe(3000)
  })
})
