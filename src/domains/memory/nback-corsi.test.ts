import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import * as corsi from './corsi'
import * as nback from './nback'

describe('n-back', () => {
  it('builds blocks with exactly 30 % targets and no accidental matches', () => {
    const rng = seededRng(4)
    for (let level = nback.LEVEL_BOUNDS.min; level <= nback.LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 100; i++) {
        const b = nback.generateBlock(level, rng)
        expect(b.n).toBe(nback.nbackSpec(level).n)
        expect(b.stimuli).toHaveLength(b.n + nback.SCORED_PER_BLOCK)
        expect(b.isTarget.filter(Boolean)).toHaveLength(Math.round(nback.SCORED_PER_BLOCK * nback.TARGET_SHARE))
        b.stimuli.forEach((s, k) => expect(b.isTarget[k]).toBe(k >= b.n && s === b.stimuli[k - b.n]))
        if (b.modality === 'positions') for (const s of b.stimuli) expect(Number(s)).toBeLessThan(nback.GRID_CELLS)
      }
    }
  })

  it('scores perfect, passive and noisy responses', () => {
    const b = nback.generateBlock(3, seededRng(1))
    const perfect = nback.scoreBlock(b, b.isTarget)
    expect(perfect).toMatchObject({ misses: 0, falseAlarms: 0, accuracy: 1, passed: true })
    const passive = nback.scoreBlock(b, [])
    expect(passive.accuracy).toBeCloseTo(0.7)
    expect(passive.passed).toBe(false)
    const always = nback.scoreBlock(b, b.stimuli.map(() => true))
    expect(always.falseAlarms).toBe(14)
    expect(always.passed).toBe(false)
  })

  it('raises n with the level', () => {
    expect(nback.nbackSpec(1).n).toBe(1)
    expect(nback.nbackSpec(10).n).toBe(4)
    expect(nback.nbackSpec(20).n).toBe(7)
    expect(() => nback.nbackSpec(21)).toThrow()
  })
})

describe('Corsi blocks', () => {
  it('builds sequences of the right length without immediate repeats', () => {
    const rng = seededRng(6)
    for (let level = corsi.LEVEL_BOUNDS.min; level <= corsi.LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 200; i++) {
        const t = corsi.generateTrial(level, rng)
        expect(t.sequence).toHaveLength(corsi.corsiLength(level, t.mode))
        t.sequence.forEach((b, k) => {
          expect(b).toBeLessThan(corsi.BLOCK_POSITIONS.length)
          if (k > 0) expect(b).not.toBe(t.sequence[k - 1])
        })
        expect(t.answer).toEqual(t.mode === 'forward' ? t.sequence : t.sequence.toReversed())
        if (level < corsi.BACKWARD_FROM_LEVEL) expect(t.mode).toBe('forward')
      }
    }
  })
})
