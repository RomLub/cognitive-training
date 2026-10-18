import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'
import { shuffled } from './util'

/**
 * Knights and knaves: on an island, the sincere always tell the truth and liars always lie. Each
 * inhabitant makes one statement; statements are drawn at random until exactly one assignment of
 * types is consistent, then the user must find everyone's type.
 */
export type KnightKind = 'direct' | 'compound' | 'counting'

export const KNIGHT_KINDS: readonly KnightKind[] = ['direct', 'compound', 'counting']

export function isKnightKind(value: string): value is KnightKind {
  return (KNIGHT_KINDS as readonly string[]).includes(value)
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 3
export const FOCUS_SHARE = 0.6

interface KnightSpec {
  people: number
  kinds: readonly KnightKind[]
}

const SPECS: readonly KnightSpec[] = [
  { people: 2, kinds: ['direct'] },
  { people: 2, kinds: ['direct', 'compound'] },
  { people: 3, kinds: ['direct'] },
  { people: 3, kinds: ['direct', 'compound'] },
  { people: 3, kinds: ['direct', 'compound'] },
  { people: 3, kinds: ['direct', 'compound', 'counting'] },
  { people: 3, kinds: ['compound', 'counting'] },
  { people: 4, kinds: ['direct'] },
  { people: 4, kinds: ['direct', 'compound'] },
  { people: 4, kinds: ['direct', 'compound', 'counting'] },
  { people: 4, kinds: ['compound', 'counting'] },
  { people: 4, kinds: ['compound', 'counting'] },
  { people: 5, kinds: ['direct', 'compound'] },
  { people: 5, kinds: ['direct', 'compound', 'counting'] },
  { people: 5, kinds: ['compound', 'counting'] },
  { people: 5, kinds: ['compound', 'counting'] },
  { people: 6, kinds: ['direct', 'compound', 'counting'] },
  { people: 6, kinds: ['compound', 'counting'] },
  { people: 6, kinds: ['compound', 'counting'] },
  { people: 7, kinds: ['compound', 'counting'] },
]

export function knightSpec(level: number): KnightSpec {
  const spec = SPECS[level - 1]
  if (spec === undefined) throw new Error(`Invalid knights level: ${level}`)
  return spec
}

const NAMES = ['Anna', 'Basile', 'Clara', 'Denis', 'Elsa', 'Félix', 'Gaspard']
/** Grammatical gender, for "menteur" / "menteuse". */
const FEMININE = [true, false, true, false, true, false, false]

/** types[i] is true when inhabitant i is sincere. */
type Types = readonly boolean[]

export interface Statement {
  text: string
  /** Whether the statement is true under an assignment of types. */
  holds: (types: Types) => boolean
}

function typeName(sincere: boolean, person: number): string {
  if (sincere) return 'sincère'
  return FEMININE[person] === true ? 'menteuse' : 'menteur'
}

/** `count` inhabitants other than the speaker, at random. */
function others(people: number, speaker: number, rng: Rng, count: number): number[] {
  return shuffled(
    rng,
    Array.from({ length: people }, (_, i) => i).filter((i) => i !== speaker),
  ).slice(0, count)
}

function directStatement(rng: Rng, people: number, speaker: number, names: readonly string[]): Statement {
  const [x, y] = others(people, speaker, rng, 2)
  const target = x!
  const form = pick(rng, y === undefined ? (['is', 'with-me'] as const) : (['is', 'with-me', 'pair'] as const))
  const same = rng() < 0.5
  if (form === 'is') return { text: `${names[target]} est ${typeName(same, target)}.`, holds: (t) => t[target] === same }
  if (form === 'with-me') {
    return {
      text: same ? `${names[target]} et moi sommes du même type.` : `${names[target]} et moi sommes de types différents.`,
      holds: (t) => (t[target] === t[speaker]) === same,
    }
  }
  return {
    text: same ? `${names[target]} et ${names[y!]} sont du même type.` : `${names[target]} et ${names[y!]} sont de types différents.`,
    holds: (t) => (t[target] === t[y!]) === same,
  }
}

function compoundStatement(rng: Rng, people: number, speaker: number, names: readonly string[]): Statement {
  // Pairs may include the speaker ("moi") for self-reference.
  const pool = Array.from({ length: people }, (_, i) => i)
  const [x, y] = shuffled(rng, pool)
  const bx = rng() < 0.5
  const by = rng() < 0.5
  const clause = (i: number, b: boolean) => (i === speaker ? `je suis ${typeName(b, i)}` : `${names[i]} est ${typeName(b, i)}`)
  const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
  const cx = clause(x!, bx)
  const cy = clause(y!, by)
  const form = pick(rng, ['and', 'or', 'if', 'either'] as const)
  if (form === 'and') {
    return { text: `${capital(cx)} et ${cy}.`, holds: (t) => t[x!] === bx && t[y!] === by }
  }
  if (form === 'or') {
    return { text: `${capital(cx)} ou ${cy} (ou les deux).`, holds: (t) => t[x!] === bx || t[y!] === by }
  }
  if (form === 'if') {
    return { text: `Si ${cx}, alors ${cy}.`, holds: (t) => t[x!] !== bx || t[y!] === by }
  }
  return {
    text: `Soit ${cx}, soit ${cy}, mais pas les deux.`,
    holds: (t) => (t[x!] === bx) !== (t[y!] === by),
  }
}

function countingStatement(rng: Rng, people: number): Statement {
  const liars = (t: Types) => t.filter((s) => !s).length
  const n = 1 + Math.floor(rng() * (people - 1))
  const word = (k: number) => (k === 1 ? 'un' : String(k))
  const form = pick(rng, ['exactly-liars', 'at-least-liars', 'at-most-liars', 'exactly-sincere'] as const)
  if (form === 'exactly-liars') {
    return { text: `Parmi nous, il y a exactement ${word(n)} menteur${n > 1 ? 's' : ''}.`, holds: (t) => liars(t) === n }
  }
  if (form === 'at-least-liars') {
    return { text: `Au moins ${word(n)} d’entre nous ${n > 1 ? 'mentent' : 'ment'}.`, holds: (t) => liars(t) >= n }
  }
  if (form === 'at-most-liars') {
    return { text: `Au plus ${word(n)} d’entre nous ${n > 1 ? 'mentent' : 'ment'}.`, holds: (t) => liars(t) <= n }
  }
  return {
    text: `Exactement ${word(n)} d’entre nous ${n > 1 ? 'sont sincères' : 'est sincère'}.`,
    holds: (t) => people - liars(t) === n,
  }
}

function statementOf(kind: KnightKind, rng: Rng, people: number, speaker: number, names: readonly string[]): Statement {
  if (kind === 'direct') return directStatement(rng, people, speaker, names)
  if (kind === 'compound') return compoundStatement(rng, people, speaker, names)
  return countingStatement(rng, people)
}

/** Every assignment of types under which each speaker's statement is true iff the speaker is sincere. */
export function consistentAssignments(people: number, statements: readonly ((t: Types) => boolean)[]): boolean[][] {
  const out: boolean[][] = []
  for (let mask = 0; mask < 1 << people; mask++) {
    const types = Array.from({ length: people }, (_, i) => (mask & (1 << i)) !== 0)
    if (statements.every((holds, i) => holds(types) === types[i])) out.push(types)
  }
  return out
}

export interface KnightPuzzle {
  level: number
  kind: KnightKind
  names: readonly string[]
  statements: readonly Statement[]
  /** true = sincere. */
  solution: readonly boolean[]
}

export function generatePuzzle(level: number, rng: Rng, focus: KnightKind | null = null): KnightPuzzle {
  const spec = knightSpec(level)
  const kind =
    focus !== null && spec.kinds.includes(focus) && rng() < FOCUS_SHARE ? focus : pick(rng, spec.kinds)
  // The puzzle's kind is its most advanced statement type; simpler ones fill in around it.
  const pool: KnightKind[] = kind === 'direct' ? ['direct'] : ['direct', kind, kind]
  const names = NAMES.slice(0, spec.people)
  for (let attempt = 0; attempt < 5000; attempt++) {
    const kinds = Array.from({ length: spec.people }, () => pick(rng, pool))
    if (!kinds.includes(kind)) kinds[Math.floor(rng() * spec.people)] = kind
    const statements = kinds.map((k, speaker) => statementOf(k, rng, spec.people, speaker, names))
    if (new Set(statements.map((s) => s.text)).size < statements.length) continue
    const solutions = consistentAssignments(spec.people, statements.map((s) => s.holds))
    if (solutions.length !== 1) continue
    const solution = solutions[0]!
    // Avoid the dull all-same island.
    if (spec.people > 2 && solution.every((s) => s === solution[0])) continue
    return { level, kind, names, statements, solution }
  }
  throw new Error(`Could not generate a knights puzzle at level ${level}`)
}

export function typeLabel(sincere: boolean, person: number): string {
  const name = typeName(sincere, person)
  return name.charAt(0).toUpperCase() + name.slice(1)
}
