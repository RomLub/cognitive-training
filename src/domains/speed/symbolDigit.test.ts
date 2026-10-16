import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { generateKey, generateTrial, SIMILAR_FROM_LEVEL, symbolSetFor, timeLimitMs } from './symbolDigit'

describe('symbol-digit coding', () => {
  it('builds a key of 9 distinct symbols per set', () => {
    const key = generateKey(seededRng(1))
    for (const set of ['distinct', 'similar'] as const) {
      expect(key[set]).toHaveLength(9)
      expect(new Set(key[set]).size).toBe(9)
    }
  })

  it('shows the symbol of the digit in the level set, never the same twice in a row', () => {
    const rng = seededRng(2)
    const key = generateKey(rng)
    for (let level = 1; level <= 10; level++) {
      let previous: number | null = null
      for (let i = 0; i < 100; i++) {
        const t = generateTrial(key, level, rng, previous)
        expect(t.set).toBe(symbolSetFor(level))
        expect(key[t.set][t.digit - 1]).toBe(t.symbol)
        expect(t.digit).not.toBe(previous)
        previous = t.digit
      }
    }
  })

  it('switches to look-alike symbols and shortens the deadline', () => {
    expect(symbolSetFor(SIMILAR_FROM_LEVEL - 1)).toBe('distinct')
    expect(symbolSetFor(SIMILAR_FROM_LEVEL)).toBe('similar')
    expect(timeLimitMs(10)).toBeLessThan(timeLimitMs(1))
  })
})
