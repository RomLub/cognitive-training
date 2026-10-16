import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { normalizeWord, splitWords } from '../../core/text'
import * as pairs from './pairs'
import * as wordList from './wordList'
import { ABSTRACT_NOUNS, CONCRETE_NOUNS, RELATED_PAIRS } from './words'

describe('word banks', () => {
  it('have no duplicates once normalized, and enough words for the hardest level', () => {
    for (const bank of [CONCRETE_NOUNS, ABSTRACT_NOUNS]) {
      expect(new Set(bank.map(normalizeWord)).size).toBe(bank.length)
      expect(bank.length).toBeGreaterThanOrEqual(wordList.listSpec(wordList.LEVEL_BOUNDS.max).words * 3)
    }
    expect(RELATED_PAIRS.length).toBeGreaterThanOrEqual(pairs.pairsSpec(pairs.LEVEL_BOUNDS.max).pairs * 3)
  })
})

describe('text normalization', () => {
  it('ignores case, accents, articles and plurals', () => {
    expect(normalizeWord('Les Éléphants')).toBe('elephant')
    expect(normalizeWord("l'arbre")).toBe('arbre')
    expect(normalizeWord('Œuf')).toBe('oeuf')
    expect(normalizeWord('  Chapeaux ')).toBe('chapeau')
    expect(normalizeWord('bus')).toBe('bus')
  })

  it('splits free text, keeping articles with their noun', () => {
    expect(splitWords('le chat, pomme\nla table')).toEqual(['le chat', 'pomme', 'la table'])
  })
})

describe('word list recall', () => {
  it('draws distinct words of the level size and kind', () => {
    const rng = seededRng(2)
    for (let level = 1; level <= 20; level++) {
      const t = wordList.generateList(level, rng)
      expect(t.words).toHaveLength(wordList.listSpec(level).words)
      expect(new Set(t.words).size).toBe(t.words.length)
      const bank = t.kind === 'concrete' ? CONCRETE_NOUNS : ABSTRACT_NOUNS
      for (const w of t.words) expect(bank).toContain(w)
      expect(t.required).toBe(Math.ceil(t.words.length * 0.7))
    }
  })

  it('scores tolerant recall, misses and intrusions', () => {
    const t = { ...wordList.generateList(1, seededRng(1)), words: ['éléphant', 'pomme', 'tapis', 'robot', 'tasse', 'pont'] }
    const s = wordList.scoreRecall(t, ['les elephants', 'POMME', 'tapis', 'robot', 'girafe', 'pomme'])
    expect(s.found).toEqual(['éléphant', 'pomme', 'tapis', 'robot'])
    expect(s.missed).toEqual(['tasse', 'pont'])
    expect(s.intrusions).toEqual(['girafe'])
    expect(s.passed).toBe(false) // 4 < ceil(6 × 0.7) = 5
    expect(wordList.scoreRecall(t, [...t.words.slice(0, 5)]).passed).toBe(true)
  })
})

describe('word pairs', () => {
  it('builds the right number of pairs and a full shuffled test order', () => {
    const rng = seededRng(3)
    for (let level = 1; level <= 20; level++) {
      const t = pairs.generatePairs(level, rng)
      expect(t.pairs).toHaveLength(pairs.pairsSpec(level).pairs)
      expect(t.testOrder.toSorted((a, b) => a - b)).toEqual(t.pairs.map((_, i) => i))
      const all = t.pairs.flat().map(normalizeWord)
      if (t.kind === 'unrelated') expect(new Set(all).size).toBe(all.length)
    }
  })

  it('accepts the partner with tolerant spelling', () => {
    const t = { ...pairs.generatePairs(1, seededRng(1)), pairs: [['pain', 'beurre']] as [string, string][] }
    expect(pairs.isRightPartner(t, 0, 'du Beurre')).toBe(true)
    expect(pairs.isRightPartner(t, 0, 'confiture')).toBe(false)
    expect(() => pairs.isRightPartner(t, 3, 'x')).toThrow()
  })
})
