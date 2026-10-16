import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import { normalizeWord } from '../../core/text'
import type { Rng } from '../../core/types'
import { ABSTRACT_NOUNS, CONCRETE_NOUNS } from '../episodic/words'

/** Anagrams: unscramble the letters into a word. Any word of the bank using exactly those letters is accepted. */
export type AnagramKind = 'concrete' | 'abstract'

export const ANAGRAM_KINDS: readonly AnagramKind[] = ['concrete', 'abstract']

export function isAnagramKind(value: string): value is AnagramKind {
  return value === 'concrete' || value === 'abstract'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 10
export const FOCUS_SHARE = 0.5

/** Word length range per level (letters, accents removed). */
const LENGTHS: readonly (readonly [number, number])[] = [
  [4, 5], [5, 5], [5, 6], [6, 6], [6, 7], [7, 7], [7, 8], [8, 8], [8, 9], [9, 11],
]

export function lengthRange(level: number): readonly [number, number] {
  const range = LENGTHS[level - 1]
  if (!Number.isInteger(level) || range === undefined) throw new Error(`Unknown anagram level: ${level}`)
  return range
}

/** 45 s at level 1 down to 25 s at level 10. */
export function timeLimitMs(level: number): number {
  lengthRange(level)
  return 45_000 - Math.round(((level - 1) * 20_000) / 9)
}

/** Plain uppercase letters of a word ("Éléphant" → "ELEPHANT"). */
export function letters(word: string): string {
  return normalizeWord(word).replace(/[^a-z]/g, '').toUpperCase()
}

const sortLetters = (s: string) => [...s].sort().join('')

const BANK: Record<AnagramKind, readonly string[]> = {
  concrete: CONCRETE_NOUNS.filter((w) => /^[\p{L}]+$/u.test(w)),
  abstract: ABSTRACT_NOUNS.filter((w) => /^[\p{L}]+$/u.test(w)),
}
/** Every bank word by sorted letters, to accept alternative solutions (e.g. CHIEN / NICHE). */
const BY_LETTERS = new Map<string, Set<string>>()
for (const w of [...BANK.concrete, ...BANK.abstract]) {
  const key = sortLetters(letters(w))
  BY_LETTERS.set(key, (BY_LETTERS.get(key) ?? new Set()).add(letters(w)))
}

export interface AnagramTrial {
  word: string
  scrambled: string
  kind: AnagramKind
  level: number
}

function shuffle(s: string, rng: Rng): string {
  const chars = [...s]
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  return chars.join('')
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: AnagramKind | null = null): AnagramTrial {
  const [min, max] = lengthRange(level)
  const fits = (w: string) => letters(w).length >= min && letters(w).length <= max
  let kind: AnagramKind = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, ANAGRAM_KINDS)
  if (!BANK[kind].some(fits)) kind = kind === 'concrete' ? 'abstract' : 'concrete'
  const word = pick(rng, BANK[kind].filter(fits))
  const plain = letters(word)
  const solutions = BY_LETTERS.get(sortLetters(plain))!
  let scrambled = shuffle(plain, rng)
  // The scramble must not already spell a solution.
  for (let i = 0; i < 50 && solutions.has(scrambled); i++) scrambled = shuffle(plain, rng)
  return { word, scrambled, kind, level }
}

export function isSolution(trial: AnagramTrial, answer: string): boolean {
  const a = letters(answer)
  return sortLetters(a) === sortLetters(letters(trial.word)) && (BY_LETTERS.get(sortLetters(a))?.has(a) ?? false)
}
