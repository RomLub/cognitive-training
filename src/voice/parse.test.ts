import { describe, expect, it } from 'vitest'
import { firstParsed, parseDigitSequence, parseFrenchNumber, parseKeyword, parseSameDifferent } from './parse'

describe('parseFrenchNumber', () => {
  it('reads digits as returned by most recognizers', () => {
    expect(parseFrenchNumber('42')).toBe(42)
    expect(parseFrenchNumber('1 024')).toBe(1024)
    expect(parseFrenchNumber("c'est 56")).toBe(56)
  })

  it('reads French number words', () => {
    const cases: [string, number][] = [
      ['zéro', 0],
      ['sept', 7],
      ['dix-sept', 17],
      ['vingt et un', 21],
      ['quarante-deux', 42],
      ['soixante-dix', 70],
      ['soixante et onze', 71],
      ['quatre-vingts', 80],
      ['quatre-vingt-dix-neuf', 99],
      ['cent', 100],
      ['cent un', 101],
      ['deux cent trente-quatre', 234],
      ['cent quatre-vingt-trois', 183],
      ['mille', 1000],
      ['trois mille deux cents', 3200],
      ['euh quarante', 40],
    ]
    for (const [text, expected] of cases) expect(parseFrenchNumber(text), text).toBe(expected)
  })

  it('rejects what is not a number', () => {
    expect(parseFrenchNumber('')).toBeNull()
    expect(parseFrenchNumber('bonjour')).toBeNull()
    expect(parseFrenchNumber('quarante bonjour')).toBeNull()
  })
})

describe('parseDigitSequence', () => {
  it('reads digits with or without spaces', () => {
    expect(parseDigitSequence('3 8 1')).toBe('381')
    expect(parseDigitSequence('381')).toBe('381')
    expect(parseDigitSequence('0 7')).toBe('07')
  })

  it('reads digit words, including common mis-recognitions', () => {
    expect(parseDigitSequence('trois huit un')).toBe('381')
    expect(parseDigitSequence('cette neuf zéro')).toBe('790')
  })

  it('falls back to a merged number', () => {
    expect(parseDigitSequence('trois cent quatre-vingt-un')).toBe('381')
  })

  it('rejects unrelated speech', () => {
    expect(parseDigitSequence('je ne sais pas')).toBeNull()
    expect(parseDigitSequence('')).toBeNull()
  })
})

describe('keywords', () => {
  const colors = { red: ['rouge'], green: ['vert', 'verre'] } as const

  it('finds a keyword anywhere, accents and case ignored', () => {
    expect(parseKeyword('C’est VERRE', colors)).toBe('green')
    expect(parseKeyword('rouge', colors)).toBe('red')
    expect(parseKeyword('bleu', colors)).toBeNull()
  })

  it('reads same / different, negations first', () => {
    expect(parseSameDifferent('pareil')).toBe('same')
    expect(parseSameDifferent('identiques')).toBe('same')
    expect(parseSameDifferent('différent')).toBe('different')
    expect(parseSameDifferent('pas pareil')).toBe('different')
    expect(parseSameDifferent('pas identique')).toBe('different')
    expect(parseSameDifferent('peut-être')).toBeNull()
  })

  it('uses the first alternative that parses', () => {
    expect(firstParsed(['bonjour', 'quarante', '40'], parseFrenchNumber)).toBe(40)
    expect(firstParsed(['bonjour'], parseFrenchNumber)).toBeNull()
  })
})
