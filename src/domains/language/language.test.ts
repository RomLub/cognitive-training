import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { normalizeWord } from '../../core/text'
import * as anagram from './anagram'
import { SEMANTIC_CATEGORIES } from './categories'
import * as fluency from './fluency'

describe('fluency', () => {
  it('has category lists large enough for the hardest target, without duplicates', () => {
    for (const c of SEMANTIC_CATEGORIES) {
      expect(new Set(c.words.map(normalizeWord)).size, c.id).toBe(c.words.length)
      expect(c.words.length).toBeGreaterThanOrEqual(fluency.fluencyTarget(10, 'semantic') * 2)
    }
  })

  it('judges words for a semantic round', () => {
    const round = { ...fluency.generateRound(1, seededRng(1)), kind: 'semantic' as const, accepted: new Set(['chat', 'chien'].map(normalizeWord)) }
    const counted = new Set([normalizeWord('chat')])
    expect(fluency.judgeWord(round, 'Chiens', counted)).toBe('ok')
    expect(fluency.judgeWord(round, 'le chat', counted)).toBe('duplicate')
    expect(fluency.judgeWord(round, 'table', counted)).toBe('unknown')
  })

  it('judges words for a phonemic round', () => {
    const round = { ...fluency.generateRound(1, seededRng(1)), kind: 'phonemic' as const, letter: 'P', accepted: null }
    expect(fluency.judgeWord(round, 'pomme', new Set())).toBe('ok')
    expect(fluency.judgeWord(round, 'Été', new Set())).toBe('wrong-letter')
    expect(fluency.judgeWord(round, 'pu', new Set())).toBe('too-short')
  })

  it('raises the target with the level, phonemic below semantic', () => {
    expect(fluency.fluencyTarget(1, 'semantic')).toBe(8)
    expect(fluency.fluencyTarget(10, 'semantic')).toBe(26)
    expect(fluency.fluencyTarget(10, 'phonemic')).toBeLessThan(26)
    expect(fluency.fluencyTarget(20, 'semantic')).toBe(26)
    expect(fluency.roundMs(20)).toBe(45_000)
  })
})

describe('anagrams', () => {
  it('scrambles a bank word of the level length, never already solved', () => {
    const rng = seededRng(9)
    for (let level = 1; level <= 20; level++) {
      const [min, max] = anagram.lengthRange(level)
      for (let i = 0; i < 100; i++) {
        const t = anagram.generateTrial(level, rng)
        const plain = anagram.letters(t.word)
        expect(plain.length).toBeGreaterThanOrEqual(min)
        expect(plain.length).toBeLessThanOrEqual(max)
        expect([...t.scrambled].sort().join('')).toBe([...plain].sort().join(''))
        expect(anagram.isSolution(t, t.scrambled)).toBe(false)
        expect(anagram.isSolution(t, t.word)).toBe(true)
      }
    }
  })

  it('accepts accents and case, refuses other words', () => {
    const t = { word: 'éléphant', scrambled: 'TNAHPELE', kind: 'concrete' as const, level: 7 }
    expect(anagram.isSolution(t, 'Elephant')).toBe(true)
    expect(anagram.isSolution(t, 'ELEPHANTE')).toBe(false)
  })
})
