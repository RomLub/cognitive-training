import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'
import { sample } from '../episodic/wordList'

/**
 * Syllogisms with invented words (so prior beliefs cannot help): is the conclusion forced by the premises?
 * Validity is computed, not looked up: the conclusion must hold in every model of the premises, where a model
 * says which Venn regions of the terms are inhabited and every term is non-empty.
 */
export type Quantifier = 'all' | 'none' | 'some' | 'some-not'
export type SyllogismKind = 'valid' | 'invalid'

export const SYLLOGISM_KINDS: readonly SyllogismKind[] = ['valid', 'invalid']

export function isSyllogismKind(value: string): value is SyllogismKind {
  return value === 'valid' || value === 'invalid'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 10 }
export const SESSION_LENGTH = 10
export const FOCUS_SHARE = 0.5

/** Invented nouns: [singular, plural]. */
const TERMS: readonly (readonly [string, string])[] = [
  ['blip', 'blips'], ['zorg', 'zorgs'], ['frak', 'fraks'], ['glim', 'glims'],
  ['quib', 'quibs'], ['snel', 'snels'], ['vorp', 'vorps'], ['dran', 'drans'],
]

export interface Statement {
  q: Quantifier
  /** Term indexes. */
  x: number
  y: number
}

interface SyllogismSpec {
  /** Number of terms (premises = terms − 1, chained). */
  terms: number
  quantifiers: readonly Quantifier[]
}

const LEVELS: readonly SyllogismSpec[] = [
  { terms: 3, quantifiers: ['all'] },
  { terms: 3, quantifiers: ['all', 'none'] },
  { terms: 3, quantifiers: ['all', 'none'] },
  { terms: 3, quantifiers: ['all', 'none', 'some'] },
  { terms: 3, quantifiers: ['all', 'none', 'some'] },
  { terms: 3, quantifiers: ['all', 'none', 'some', 'some-not'] },
  { terms: 3, quantifiers: ['all', 'none', 'some', 'some-not'] },
  { terms: 4, quantifiers: ['all', 'none', 'some'] },
  { terms: 4, quantifiers: ['all', 'none', 'some', 'some-not'] },
  { terms: 4, quantifiers: ['all', 'none', 'some', 'some-not'] },
]

export function syllogismSpec(level: number): SyllogismSpec {
  const spec = LEVELS[level - 1]
  if (!Number.isInteger(level) || spec === undefined) throw new Error(`Unknown syllogism level: ${level}`)
  return spec
}

/*
 * Regions are the non-empty Venn cells: region r (1 … 2^terms − 1) has bit t set when inside term t.
 * A model is a bitmask over regions (bit r − 1 set = region r inhabited), so each check is one AND.
 */

/** Mask of the regions where the statement's "witness" lives: X∖Y for all/some-not, X∩Y for none/some. */
function witnessMask(s: Statement, termCount: number): number {
  let mask = 0
  for (let r = 1; r < 1 << termCount; r++) {
    const inX = (r >> s.x) & 1
    const inY = (r >> s.y) & 1
    const witness = s.q === 'all' || s.q === 'some-not' ? inX && !inY : inX && inY
    if (witness) mask |= 1 << (r - 1)
  }
  return mask
}

function holds(s: Statement, mask: number, model: number): boolean {
  const inhabited = (model & mask) !== 0
  // all / none: no witness may exist; some / some-not: one must.
  return s.q === 'all' || s.q === 'none' ? !inhabited : inhabited
}

/** True when the conclusion holds in every model of the premises (with all terms non-empty). */
export function isValid(premises: readonly Statement[], conclusion: Statement, termCount: number): boolean {
  const regionCount = (1 << termCount) - 1
  const termMasks = Array.from({ length: termCount }, (_, t) => {
    let mask = 0
    for (let r = 1; r <= regionCount; r++) if ((r >> t) & 1) mask |= 1 << (r - 1)
    return mask
  })
  const premiseMasks = premises.map((p) => witnessMask(p, termCount))
  const conclusionMask = witnessMask(conclusion, termCount)
  let consistent = false
  for (let model = 0; model < 1 << regionCount; model++) {
    if (!termMasks.every((m) => (model & m) !== 0)) continue
    if (!premises.every((p, i) => holds(p, premiseMasks[i]!, model))) continue
    consistent = true
    if (!holds(conclusion, conclusionMask, model)) return false
  }
  // Contradictory premises are excluded by the generator; treat them as not valid to be safe.
  return consistent
}

export interface SyllogismTrial {
  premises: string[]
  conclusion: string
  kind: SyllogismKind
  level: number
}

function sentence(s: Statement, names: readonly (readonly [string, string])[]): string {
  const [xs, xp] = names[s.x]!
  const [ys, yp] = names[s.y]!
  switch (s.q) {
    case 'all': return `Tous les ${xp} sont des ${yp}.`
    case 'none': return `Aucun ${xs} n’est un ${ys}.`
    case 'some': return `Certains ${xp} sont des ${yp}.`
    case 'some-not': return `Certains ${xp} ne sont pas des ${yp}.`
  }
}

export function generateTrial(level: number, rng: Rng = Math.random, focus: SyllogismKind | null = null): SyllogismTrial {
  const spec = syllogismSpec(level)
  // Aim for an even mix of valid and invalid conclusions, or the focus.
  const wanted: SyllogismKind = focus !== null && rng() < FOCUS_SHARE ? focus : rng() < 0.5 ? 'valid' : 'invalid'
  const names = sample(rng, TERMS, spec.terms)
  for (let attempt = 0; attempt < 500; attempt++) {
    // Chained premises: term0–term1, term1–term2, … with random direction.
    const premises: Statement[] = []
    for (let t = 0; t < spec.terms - 1; t++) {
      const forward = rng() < 0.5
      premises.push({ q: pick(rng, spec.quantifiers), x: forward ? t : t + 1, y: forward ? t + 1 : t })
    }
    const conclusion: Statement = { q: pick(rng, spec.quantifiers), x: 0, y: spec.terms - 1 }
    if (!isValid(premises, { q: 'all', x: 0, y: 0 }, spec.terms)) continue // contradictory premises
    const kind: SyllogismKind = isValid(premises, conclusion, spec.terms) ? 'valid' : 'invalid'
    if (kind !== wanted) continue
    return { premises: premises.map((p) => sentence(p, names)), conclusion: sentence(conclusion, names), kind, level }
  }
  throw new Error(`Could not build a ${wanted} syllogism at level ${level}`)
}
