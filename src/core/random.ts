import type { Rng } from './types'

/** Inclusive integer in [min, max]. */
export function randInt(rng: Rng, min: number, max: number): number {
  if (min > max) throw new Error(`randInt: min (${min}) > max (${max})`)
  return min + Math.floor(rng() * (max - min + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick: empty array')
  return items[Math.floor(rng() * items.length)] as T
}

/** Deterministic PRNG (mulberry32), used in tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
