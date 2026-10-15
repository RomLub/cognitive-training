/**
 * Turns French speech transcripts into answers. Recognizers usually return digits ("42"),
 * but sometimes words ("quarante-deux"), so both are handled.
 */

export function normalizeSpeech(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-'’.,!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const UNITS: Readonly<Record<string, number>> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
}

/** Words tolerated around an answer ("c'est 42", "euh 42", "ça fait 42"). */
const FILLERS = new Set(['c', 'est', 'euh', 'ca', 'fait', 'egal', 'egale', 'alors', 'la', 'reponse', 'je', 'dirais', 'et'])

/** Parses a non-negative integer said in French, as digits or words. Returns null when not understood. */
export function parseFrenchNumber(text: string): number | null {
  const normalized = normalizeSpeech(text)
  // Digits, possibly grouped with spaces ("1 024").
  const digitGroup = /\d[\d\s]*/.exec(normalized)
  if (digitGroup !== null) return Number.parseInt(digitGroup[0].replace(/\s/g, ''), 10)

  const words = normalized.split(' ').filter((w) => w.length > 0)
  let total = 0
  let current = 0
  let understood = false
  let previous = ''
  for (const word of words) {
    if ((word === 'vingt' || word === 'vingts') && previous === 'quatre') {
      // "quatre-vingt(s)" = 80: replace the 4 just added.
      current += 80 - 4
    } else if (word in UNITS) {
      current += UNITS[word]!
    } else if (word === 'cent' || word === 'cents') {
      current = (current === 0 ? 1 : current) * 100
    } else if (word === 'mille') {
      total += (current === 0 ? 1 : current) * 1000
      current = 0
    } else if (FILLERS.has(word)) {
      previous = word
      continue
    } else {
      return null
    }
    understood = true
    previous = word
  }
  return understood ? total + current : null
}

const DIGIT_WORDS: Readonly<Record<string, string>> = {
  zero: '0', un: '1', une: '1', deux: '2', trois: '3', quatre: '4', cinq: '5', six: '6', sept: '7', huit: '8', neuf: '9',
  // Frequent mis-recognitions of isolated digits.
  cette: '7', set: '7', sete: '7', huitre: '8', neuve: '9', de: '2',
}

/** Parses digits said one by one ("3 8 1", "trois huit un"). Returns the digit string, or null. */
export function parseDigitSequence(text: string): string | null {
  const normalized = normalizeSpeech(text)
  if (/\d/.test(normalized)) {
    const digits = normalized.replace(/[^\d]/g, '')
    return digits.length > 0 ? digits : null
  }
  const words = normalized.split(' ').filter((w) => w.length > 0 && !FILLERS.has(w))
  if (words.length === 0) return null
  const mapped = words.map((w) => DIGIT_WORDS[w])
  if (mapped.every((d) => d !== undefined)) return mapped.join('')
  // Fallback: the recognizer merged the digits into a number ("trois cent quatre-vingt-un").
  const asNumber = parseFrenchNumber(text)
  return asNumber === null ? null : String(asNumber)
}

/** Finds the first keyword from `options` in the transcript; values are lists of accepted spellings. */
export function parseKeyword<K extends string>(text: string, options: Readonly<Record<K, readonly string[]>>): K | null {
  const words = normalizeSpeech(text).split(' ')
  for (const word of words) {
    for (const [key, spellings] of Object.entries(options) as [K, readonly string[]][]) {
      if (spellings.includes(word)) return key
    }
  }
  return null
}

/** "pas pareil" / "pas identique" must read as different, so negations are checked first. */
export function parseSameDifferent(text: string): 'same' | 'different' | null {
  const normalized = normalizeSpeech(text)
  if (/\bpas (pareil|identique|la meme|les memes|egal)/.test(normalized)) return 'different'
  return parseKeyword(normalized, {
    different: ['different', 'differents', 'differente', 'differentes', 'non', 'difference'],
    same: ['pareil', 'pareils', 'pareille', 'pareilles', 'identique', 'identiques', 'meme', 'memes', 'oui', 'egal', 'egaux'],
  })
}

/** Picks the first alternative transcript the parser understands. */
export function firstParsed<T>(alternatives: readonly string[], parser: (text: string) => T | null): T | null {
  for (const alt of alternatives) {
    const parsed = parser(alt)
    if (parsed !== null) return parsed
  }
  return null
}
