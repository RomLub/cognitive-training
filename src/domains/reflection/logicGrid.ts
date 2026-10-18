import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'
import { shuffled } from './util'

/**
 * Logic grid puzzles ("Einstein" puzzles): each person has exactly one value of each attribute; clues are
 * generated from a random solution, added until the solution is unique, then pruned to a minimal set so
 * every clue is needed. The user fills the whole grid, so guessing does not pay.
 */
export type GridKind = 'classic' | 'ordered'

export const GRID_KINDS: readonly GridKind[] = ['classic', 'ordered']

export function isGridKind(value: string): value is GridKind {
  return value === 'classic' || value === 'ordered'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 3
export const FOCUS_SHARE = 0.6

interface GridSpec {
  people: number
  /** Attributes besides the name (the house number counts as one in ordered puzzles). */
  attributes: number
  /** Ordered puzzles (people live in a row of houses) are allowed. */
  ordered: boolean
  /** No clue states a person's attribute directly: everything goes through links. */
  indirectOnly: boolean
}

const SPECS: readonly GridSpec[] = [
  { people: 3, attributes: 2, ordered: false, indirectOnly: false },
  { people: 3, attributes: 2, ordered: true, indirectOnly: false },
  { people: 3, attributes: 3, ordered: false, indirectOnly: false },
  { people: 3, attributes: 3, ordered: true, indirectOnly: false },
  { people: 4, attributes: 2, ordered: false, indirectOnly: false },
  { people: 4, attributes: 2, ordered: true, indirectOnly: false },
  { people: 4, attributes: 3, ordered: false, indirectOnly: false },
  { people: 4, attributes: 3, ordered: true, indirectOnly: false },
  { people: 4, attributes: 3, ordered: true, indirectOnly: true },
  { people: 4, attributes: 4, ordered: false, indirectOnly: false },
  { people: 4, attributes: 4, ordered: true, indirectOnly: false },
  { people: 5, attributes: 2, ordered: true, indirectOnly: false },
  { people: 5, attributes: 3, ordered: false, indirectOnly: false },
  { people: 5, attributes: 3, ordered: true, indirectOnly: false },
  { people: 5, attributes: 3, ordered: true, indirectOnly: true },
  { people: 5, attributes: 4, ordered: false, indirectOnly: false },
  { people: 5, attributes: 4, ordered: true, indirectOnly: false },
  { people: 5, attributes: 4, ordered: false, indirectOnly: true },
  { people: 5, attributes: 4, ordered: true, indirectOnly: true },
  { people: 5, attributes: 5, ordered: true, indirectOnly: true },
]

export function gridSpec(level: number): GridSpec {
  const spec = SPECS[level - 1]
  if (spec === undefined) throw new Error(`Invalid logic grid level: ${level}`)
  return spec
}

const NAMES = ['Alice', 'Bruno', 'Chloé', 'David', 'Emma']

interface AttributeValue {
  name: string
  /** "boit du thé" */
  has: string
  /** "ne boit pas de thé" */
  hasNot: string
  /** "la personne qui boit du thé" */
  who: string
}

export interface Attribute {
  title: string
  values: readonly AttributeValue[]
}

function attr(title: string, entries: readonly (readonly [string, string, string])[]): Attribute {
  return {
    title,
    values: entries.map(([name, has, hasNot]) => ({ name, has, hasNot, who: `la personne qui ${has}` })),
  }
}

const ATTRIBUTES: readonly Attribute[] = [
  attr('Animal', [
    ['chat', 'a le chat', 'n’a pas le chat'],
    ['chien', 'a le chien', 'n’a pas le chien'],
    ['lapin', 'a le lapin', 'n’a pas le lapin'],
    ['perroquet', 'a le perroquet', 'n’a pas le perroquet'],
    ['tortue', 'a la tortue', 'n’a pas la tortue'],
  ]),
  attr('Boisson', [
    ['thé', 'boit du thé', 'ne boit pas de thé'],
    ['café', 'boit du café', 'ne boit pas de café'],
    ['jus', 'boit du jus', 'ne boit pas de jus'],
    ['lait', 'boit du lait', 'ne boit pas de lait'],
    ['eau', 'boit de l’eau', 'ne boit pas d’eau'],
  ]),
  attr('Couleur', [
    ['rouge', 'porte du rouge', 'ne porte pas de rouge'],
    ['bleu', 'porte du bleu', 'ne porte pas de bleu'],
    ['vert', 'porte du vert', 'ne porte pas de vert'],
    ['jaune', 'porte du jaune', 'ne porte pas de jaune'],
    ['blanc', 'porte du blanc', 'ne porte pas de blanc'],
  ]),
  attr('Sport', [
    ['tennis', 'fait du tennis', 'ne fait pas de tennis'],
    ['judo', 'fait du judo', 'ne fait pas de judo'],
    ['natation', 'fait de la natation', 'ne fait pas de natation'],
    ['vélo', 'fait du vélo', 'ne fait pas de vélo'],
    ['escalade', 'fait de l’escalade', 'ne fait pas d’escalade'],
  ]),
]

function houseAttribute(people: number): Attribute {
  return {
    title: 'Maison',
    values: Array.from({ length: people }, (_, i) => ({
      name: String(i + 1),
      has: `habite la maison ${i + 1}`,
      hasNot: `n’habite pas la maison ${i + 1}`,
      who: `l’habitant de la maison ${i + 1}`,
    })),
  }
}

/** A person, designated by name or by one of their attribute values. */
type Ref = { kind: 'name'; person: number } | { kind: 'attr'; attribute: number; value: number }

export type Clue =
  | { kind: 'same'; a: Ref; b: Ref } // a and b are the same person
  | { kind: 'different'; a: Ref; b: Ref }
  | { kind: 'left-of'; a: Ref; b: Ref } // a lives immediately left of b
  | { kind: 'next-to'; a: Ref; b: Ref }
  | { kind: 'somewhere-left'; a: Ref; b: Ref }

export interface GridPuzzle {
  level: number
  kind: GridKind
  names: readonly string[]
  attributes: readonly Attribute[]
  /** solution[attribute][person] = value index. */
  solution: readonly (readonly number[])[]
  clues: readonly string[]
  /** The clues in structured form, same order as `clues` (for checking). */
  constraints: readonly Clue[]
  /** Index of the house attribute, or -1 for classic puzzles. */
  house: number
}

/** Whether a complete grid (grid[attribute][person] = value) satisfies every clue of the puzzle. */
export function satisfiesClues(puzzle: GridPuzzle, grid: readonly (readonly number[])[]): boolean {
  const people = puzzle.names.length
  const s: Assignment = { people, holder: [] }
  for (const row of grid) {
    const inverse: number[] = []
    row.forEach((value, person) => (inverse[value] = person))
    s.holder.push(...inverse)
  }
  return puzzle.constraints.every((c) => evaluate(c, s, puzzle.house) === true)
}

/** Partial assignment: who holds each value; people not yet placed are -1. */
interface Assignment {
  people: number
  /** holder[attribute * people + value] = person, or -1. */
  holder: number[]
}

function personOf(ref: Ref, s: Assignment): number | undefined {
  if (ref.kind === 'name') return ref.person
  const p = s.holder[ref.attribute * s.people + ref.value]!
  return p < 0 ? undefined : p
}

/** House number of a person, or undefined while unknown. */
function houseOf(person: number, s: Assignment, house: number): number | undefined {
  for (let h = 0; h < s.people; h++) if (s.holder[house * s.people + h] === person) return h
  return undefined
}

/** true/false once decidable, undefined while something it needs is unknown. */
function evaluate(clue: Clue, s: Assignment, house: number): boolean | undefined {
  const a = personOf(clue.a, s)
  const b = personOf(clue.b, s)
  if (a === undefined || b === undefined) return undefined
  if (clue.kind === 'same') return a === b
  if (clue.kind === 'different') return a !== b
  const ha = houseOf(a, s, house)
  const hb = houseOf(b, s, house)
  if (ha === undefined || hb === undefined) return undefined
  if (clue.kind === 'left-of') return ha + 1 === hb
  if (clue.kind === 'next-to') return Math.abs(ha - hb) === 1
  return ha < hb
}

function popcount(mask: number): number {
  let n = 0
  for (let m = mask; m !== 0; m &= m - 1) n++
  return n
}

/**
 * Number of grids satisfying the clues, counting no further than `limit`. Constraint search: each
 * variable is "who holds value v of attribute a"; domains are pruned by the all-different rule and by
 * every clue that becomes decidable (forward checking), and the most constrained variable goes first.
 */
export function countSolutions(people: number, attributes: number, clues: readonly Clue[], house: number, limit = 2): number {
  const nVars = people * attributes
  const s: Assignment = { people, holder: new Array<number>(nVars).fill(-1) }
  const varOf = (r: Ref) => (r.kind === 'name' ? -1 : r.attribute * people + r.value)
  // Same/different clues only depend on their two refs; relations also depend on houses, so they are
  // re-checked after every assignment.
  const touching: Clue[][] = Array.from({ length: nVars }, () => [])
  const relations: Clue[] = []
  for (const c of clues) {
    if (c.kind === 'same' || c.kind === 'different') {
      for (const v of [varOf(c.a), varOf(c.b)]) if (v >= 0) touching[v]!.push(c)
    } else relations.push(c)
  }
  const consistent = (v: number) =>
    touching[v]!.every((c) => evaluate(c, s, house) !== false) && relations.every((c) => evaluate(c, s, house) !== false)

  let count = 0
  const full = (1 << people) - 1
  const search = (domains: number[]) => {
    let best = -1
    let bestSize = Infinity
    for (let v = 0; v < nVars; v++) {
      if (s.holder[v]! >= 0) continue
      const size = popcount(domains[v]!) - (Math.floor(v / people) === house ? 0.5 : 0)
      if (size < bestSize) {
        best = v
        bestSize = size
      }
    }
    if (best < 0) {
      count++
      return
    }
    const attribute = Math.floor(best / people)
    for (let p = 0; p < people && count < limit; p++) {
      if ((domains[best]! & (1 << p)) === 0) continue
      s.holder[best] = p
      if (consistent(best)) {
        const next = [...domains]
        let dead = false
        for (let u = 0; u < nVars && !dead; u++) {
          if (s.holder[u]! >= 0) continue
          let mask = next[u]!
          if (Math.floor(u / people) === attribute) mask &= ~(1 << p) & full
          for (let q = 0; q < people; q++) {
            if ((mask & (1 << q)) === 0) continue
            s.holder[u] = q
            if (!consistent(u)) mask &= ~(1 << q)
            s.holder[u] = -1
          }
          next[u] = mask
          if (mask === 0) dead = true
        }
        if (!dead) search(next)
      }
      s.holder[best] = -1
    }
  }
  search(new Array<number>(nVars).fill(full))
  return count
}

function randomRef(rng: Rng, people: number, attributes: number, allowName: boolean): Ref {
  if (allowName && rng() < 0.4) return { kind: 'name', person: Math.floor(rng() * people) }
  return { kind: 'attr', attribute: Math.floor(rng() * attributes), value: Math.floor(rng() * people) }
}

/** A random clue that is true for the solution, or null when the drawn refs do not fit the chosen kind. */
function randomTrueClue(rng: Rng, solution: Assignment, spec: GridSpec, house: number): Clue | null {
  const a = randomRef(rng, spec.people, spec.attributes, true)
  const b = randomRef(rng, spec.people, spec.attributes, !spec.indirectOnly && a.kind !== 'name')
  if (a.kind === 'name' && b.kind === 'name') return null
  if (a.kind === 'attr' && b.kind === 'attr' && a.attribute === b.attribute) return null
  // Positions only appear through relations or as a plain attribute value, never compared to themselves.
  const kinds: Clue['kind'][] = ['same', 'different']
  if (house >= 0) {
    const refersToHouse = (r: Ref) => r.kind === 'attr' && r.attribute === house
    if (!refersToHouse(a) && !refersToHouse(b)) kinds.push('left-of', 'next-to', 'somewhere-left', 'next-to')
  }
  const clue = { kind: pick(rng, kinds), a, b } as Clue
  if (spec.indirectOnly && clue.kind === 'same' && (a.kind === 'name' || b.kind === 'name')) return null
  return evaluate(clue, solution, house) === true ? clue : null
}

function refText(ref: Ref, names: readonly string[], attributes: readonly Attribute[]): string {
  if (ref.kind === 'name') return names[ref.person]!
  return attributes[ref.attribute]!.values[ref.value]!.who
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "de Bruno", "d’Alice", "de la personne qui…", "de l’habitant…". */
function ofRef(ref: Ref, names: readonly string[], attributes: readonly Attribute[]): string {
  const text = refText(ref, names, attributes)
  return /^[AEÉIOU]/.test(text) ? `d’${text}` : `de ${text}`
}

export function clueText(clue: Clue, names: readonly string[], attributes: readonly Attribute[]): string {
  const subject = capitalize(refText(clue.a, names, attributes))
  if (clue.kind === 'same' || clue.kind === 'different') {
    // "X a le chat" / "X n'a pas le chat": the second ref is turned into its predicate.
    if (clue.b.kind === 'attr') {
      const v = attributes[clue.b.attribute]!.values[clue.b.value]!
      return `${subject} ${clue.kind === 'same' ? v.has : v.hasNot}.`
    }
    const name = names[clue.b.person]!
    return clue.kind === 'same' ? `${subject}, c’est ${name}.` : `${subject} n’est pas ${name}.`
  }
  const other = ofRef(clue.b, names, attributes)
  if (clue.kind === 'left-of') return `${subject} habite juste à gauche ${other}.`
  if (clue.kind === 'next-to') return `${subject} habite à côté ${other}.`
  return `${subject} habite quelque part à gauche ${other}.`
}

function generateOnce(level: number, kind: GridKind, rng: Rng): GridPuzzle | null {
  const spec = gridSpec(level)
  const ordered = kind === 'ordered'
  const plain = ordered ? spec.attributes - 1 : spec.attributes
  const attributes = [...shuffled(rng, ATTRIBUTES).slice(0, plain), ...(ordered ? [houseAttribute(spec.people)] : [])].map(
    (a) => ({ ...a, values: a.values.slice(0, spec.people) }),
  )
  const house = ordered ? attributes.length - 1 : -1
  // perms[attribute][person] = value; the search works with the inverse (who holds each value).
  const perms = attributes.map(() => shuffled(rng, Array.from({ length: spec.people }, (_, i) => i)))
  const solution: Assignment = { people: spec.people, holder: [] }
  for (const perm of perms) {
    const inverse: number[] = []
    perm.forEach((value, person) => (inverse[value] = person))
    solution.holder.push(...inverse)
  }

  const clues: Clue[] = []
  const seen = new Set<string>()
  let unique = false
  for (let tries = 0; tries < 400 && !unique; tries++) {
    const clue = randomTrueClue(rng, solution, spec, house)
    if (clue === null) continue
    const key = JSON.stringify(clue)
    if (seen.has(key)) continue
    seen.add(key)
    clues.push(clue)
    unique = countSolutions(spec.people, attributes.length, clues, house) === 1
  }
  if (!unique) return null

  // Keep only the clues that are needed, so the puzzle has no shortcut.
  for (const clue of shuffled(rng, [...clues])) {
    const without = clues.filter((c) => c !== clue)
    if (countSolutions(spec.people, attributes.length, without, house) === 1) clues.splice(clues.indexOf(clue), 1)
  }

  const names = NAMES.slice(0, spec.people)
  const presented = shuffled(rng, clues)
  return {
    level,
    kind,
    names,
    attributes,
    solution: perms,
    clues: presented.map((c) => clueText(c, names, attributes)),
    constraints: presented,
    house,
  }
}

export function generatePuzzle(level: number, rng: Rng, focus: GridKind | null = null): GridPuzzle {
  const spec = gridSpec(level)
  let kind: GridKind = 'classic'
  if (spec.ordered) kind = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, GRID_KINDS)
  if (kind === 'ordered' && spec.attributes < 2) kind = 'classic'
  for (let attempt = 0; attempt < 50; attempt++) {
    const puzzle = generateOnce(level, kind, rng)
    if (puzzle !== null) return puzzle
  }
  throw new Error(`Could not generate a logic grid at level ${level}`)
}

/** answer[attribute][person] = chosen value index, or null when left blank. */
export function isGridSolved(puzzle: GridPuzzle, answer: readonly (readonly (number | null)[])[]): boolean {
  return puzzle.solution.every((row, a) => row.every((v, p) => answer[a]?.[p] === v))
}
