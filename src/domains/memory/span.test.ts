import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { FOCUS_SHARE, generateTrial, LEVEL_BOUNDS, normalizeSpanAnswer, spanLength, type SpanMode } from './span'

describe('spanLength', () => {
  it('grows with the level, backward one shorter', () => {
    expect(spanLength(1, 'forward')).toBe(3)
    expect(spanLength(1, 'backward')).toBe(2)
    expect(spanLength(LEVEL_BOUNDS.max, 'forward')).toBe(12)
  })

  it('rejects unknown levels', () => {
    expect(() => spanLength(0, 'forward')).toThrow()
    expect(() => spanLength(LEVEL_BOUNDS.max + 1, 'forward')).toThrow()
    expect(() => spanLength(2.5, 'forward')).toThrow()
  })
})

describe('generateTrial', () => {
  it('builds sequences of the right length and the matching expected answer', () => {
    const rng = seededRng(3)
    for (let level = LEVEL_BOUNDS.min; level <= LEVEL_BOUNDS.max; level++) {
      for (let i = 0; i < 100; i++) {
        const t = generateTrial(level, rng)
        expect(t.digits).toHaveLength(spanLength(level, t.mode))
        const expected = t.mode === 'forward' ? t.digits : t.digits.toReversed()
        expect(t.answer).toBe(expected.join(''))
        t.digits.forEach((d, j) => {
          expect(d).toBeGreaterThanOrEqual(0)
          expect(d).toBeLessThanOrEqual(9)
          if (j > 0) expect(d).not.toBe(t.digits[j - 1])
        })
      }
    }
  })

  const share = (focus: SpanMode | null, mode: SpanMode) => {
    const rng = seededRng(11)
    const n = 4000
    let hits = 0
    for (let i = 0; i < n; i++) if (generateTrial(4, rng, focus).mode === mode) hits++
    return hits / n
  }

  it('mixes both modes evenly without focus', () => {
    expect(share(null, 'backward')).toBeCloseTo(0.5, 1)
  })

  it('over-represents the focus mode', () => {
    expect(share('backward', 'backward')).toBeCloseTo(FOCUS_SHARE + (1 - FOCUS_SHARE) / 2, 1)
  })
})

describe('normalizeSpanAnswer', () => {
  it('accepts digits with or without spaces', () => {
    expect(normalizeSpanAnswer('381')).toBe('381')
    expect(normalizeSpanAnswer(' 3 8 1 ')).toBe('381')
    expect(normalizeSpanAnswer('007')).toBe('007')
  })

  it('rejects empty or non-digit input', () => {
    expect(normalizeSpanAnswer('')).toBeNull()
    expect(normalizeSpanAnswer('3,8')).toBeNull()
    expect(normalizeSpanAnswer('abc')).toBeNull()
  })
})
