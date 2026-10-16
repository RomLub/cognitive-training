import type { LevelBounds } from '../../core/adaptive'
import { randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Symbol-digit coding: a key pairs 9 symbols with the digits 1-9; type the digit of the symbol shown,
 * as fast as possible. Above level 5 the symbols look alike, which slows the lookup.
 */
export type SymbolSet = 'distinct' | 'similar'

export const SYMBOL_SETS: readonly SymbolSet[] = ['distinct', 'similar']

export function isSymbolSet(value: string): value is SymbolSet {
  return value === 'distinct' || value === 'similar'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 30
export const SIMILAR_FROM_LEVEL = 6

const SYMBOLS: Record<SymbolSet, readonly string[]> = {
  distinct: ['◆', '●', '▲', '■', '★', '✚', '♥', '☾', '✿'],
  similar: ['⊢', '⊣', '⊤', '⊥', '⊏', '⊐', '⊓', '⊔', '⋈'],
}

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) {
    throw new Error(`Unknown symbol-digit level: ${level}`)
  }
}

export function symbolSetFor(level: number): SymbolSet {
  checkLevel(level)
  return level >= SIMILAR_FROM_LEVEL ? 'similar' : 'distinct'
}

/** Deadline: 3.5 s at level 1 down to 1.25 s at level 10, then 1.15 s down to 0.745 s at level 20. */
export function timeLimitMs(level: number): number {
  checkLevel(level)
  return level <= 10 ? 3500 - (level - 1) * 250 : 1150 - (level - 11) * 45
}

/** One key per session: for each set, symbols[digit - 1]. */
export type SymbolKey = Record<SymbolSet, string[]>

export function generateKey(rng: Rng = Math.random): SymbolKey {
  const shuffle = (items: readonly string[]) => {
    const pool = [...items]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = randInt(rng, 0, i)
      ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
    }
    return pool
  }
  return { distinct: shuffle(SYMBOLS.distinct), similar: shuffle(SYMBOLS.similar) }
}

export interface SymbolTrial {
  symbol: string
  digit: number
  set: SymbolSet
  level: number
}

export function generateTrial(key: SymbolKey, level: number, rng: Rng = Math.random, previous: number | null = null): SymbolTrial {
  const set = symbolSetFor(level)
  let digit = randInt(rng, 1, 9)
  // Avoid the same symbol twice in a row, which would look like a frozen screen.
  while (digit === previous) digit = randInt(rng, 1, 9)
  return { symbol: key[set][digit - 1]!, digit, set, level }
}
