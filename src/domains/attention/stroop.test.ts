import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { generateTrial, incongruentShare, LEVEL_BOUNDS, timeLimitMs } from './stroop'

describe('stroop', () => {
  it('builds congruent trials with word = ink and incongruent ones with word ≠ ink', () => {
    const rng = seededRng(5)
    for (let level = LEVEL_BOUNDS.min; level <= LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 200; i++) {
        const t = generateTrial(level, rng)
        expect(t.kind === 'congruent').toBe(t.word === t.ink)
      }
    }
  })

  it('makes later levels harder: more incongruent trials, shorter deadline', () => {
    expect(incongruentShare(10)).toBeGreaterThan(incongruentShare(1))
    expect(timeLimitMs(10)).toBeLessThan(timeLimitMs(1))
    expect(timeLimitMs(10)).toBeGreaterThan(500)
  })

  it('matches the target incongruent share and over-represents the focus', () => {
    const share = (focus: 'congruent' | 'incongruent' | null) => {
      const rng = seededRng(9)
      let n = 0
      for (let i = 0; i < 4000; i++) if (generateTrial(1, rng, focus).kind === 'incongruent') n++
      return n / 4000
    }
    expect(share(null)).toBeCloseTo(incongruentShare(1), 1)
    expect(share('incongruent')).toBeGreaterThan(0.6)
  })

  it('rejects unknown levels', () => {
    expect(() => generateTrial(0)).toThrow()
    expect(() => timeLimitMs(11)).toThrow()
  })
})
