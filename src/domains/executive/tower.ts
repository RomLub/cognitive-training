import type { LevelBounds } from '../../core/adaptive'
import { pick } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Tower of London (planning): 3 balls on 3 pegs holding 3, 2 and 1 balls. Move one top ball at a time
 * to reproduce the goal in the minimum number of moves. A problem passes when solved at that minimum.
 */
export type Ball = 'red' | 'green' | 'blue'
/** Pegs bottom → top. */
export type TowerState = readonly [readonly Ball[], readonly Ball[], readonly Ball[]]

export const BALLS: readonly Ball[] = ['red', 'green', 'blue']
export const CAPACITIES = [3, 2, 1] as const
/** Planning has a single category; difficulty comes from the number of moves. */
export const TOWER_KINDS = ['plan'] as const

export function isTowerKind(value: string): value is 'plan' {
  return value === 'plan'
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 6
/** Moves allowed beyond the minimum before the problem is counted as failed. */
export const EXTRA_MOVES_ALLOWED = 3

const MIN_MOVES = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8]

export function minMovesFor(level: number): number {
  const moves = MIN_MOVES[level - 1]
  if (!Number.isInteger(level) || moves === undefined) throw new Error(`Unknown tower level: ${level}`)
  return moves
}

/** No time limit up to level 12, then 60 s per problem down to 25 s at level 20. */
export function towerTimeLimitMs(level: number): number | null {
  minMovesFor(level)
  return level <= 12 ? null : 60_000 - (level - 13) * 5_000
}

export function stateKey(state: TowerState): string {
  return state.map((peg) => peg.map((b) => b[0]).join('')).join('|')
}

/** Moves the top ball of `from` onto `to`; null when illegal (empty source, full target, same peg). */
export function move(state: TowerState, from: number, to: number): TowerState | null {
  if (from === to) return null
  const source = state[from]
  const target = state[to]
  if (source === undefined || target === undefined || source.length === 0) return null
  if (target.length >= CAPACITIES[to as 0 | 1 | 2]) return null
  const next = state.map((peg) => [...peg]) as Ball[][]
  next[to]!.push(next[from]!.pop()!)
  return next as unknown as TowerState
}

/** Every reachable state (36 of them). */
export function allStates(): TowerState[] {
  const states: TowerState[] = []
  const perms = [
    ['red', 'green', 'blue'], ['red', 'blue', 'green'], ['green', 'red', 'blue'],
    ['green', 'blue', 'red'], ['blue', 'red', 'green'], ['blue', 'green', 'red'],
  ] as const
  for (const perm of perms) {
    for (let a = 0; a <= 3; a++) {
      for (let b = 0; b <= 2; b++) {
        const c = 3 - a - b
        if (c < 0 || c > 1) continue
        states.push([perm.slice(0, a), perm.slice(a, a + b), perm.slice(a + b)] as TowerState)
      }
    }
  }
  return states
}

/** Minimum number of moves between two states (breadth-first search). */
export function minMoves(from: TowerState, to: TowerState): number {
  const goal = stateKey(to)
  const seen = new Set([stateKey(from)])
  let frontier: TowerState[] = [from]
  for (let depth = 0; frontier.length > 0; depth++) {
    if (frontier.some((s) => stateKey(s) === goal)) return depth
    const next: TowerState[] = []
    for (const s of frontier) {
      for (let f = 0; f < 3; f++) {
        for (let t = 0; t < 3; t++) {
          const m = move(s, f, t)
          if (m !== null && !seen.has(stateKey(m))) {
            seen.add(stateKey(m))
            next.push(m)
          }
        }
      }
    }
    frontier = next
  }
  throw new Error('Goal unreachable')
}

export interface TowerTrial {
  start: TowerState
  goal: TowerState
  minMoves: number
  level: number
}

export function generateTrial(level: number, rng: Rng = Math.random): TowerTrial {
  const target = minMovesFor(level)
  const states = allStates()
  for (let attempt = 0; attempt < 200; attempt++) {
    const start = pick(rng, states)
    const goals = states.filter((g) => minMoves(start, g) === target)
    if (goals.length > 0) return { start, goal: pick(rng, goals), minMoves: target, level }
  }
  throw new Error(`No tower problem with ${target} moves`)
}

export function sameState(a: TowerState, b: TowerState): boolean {
  return stateKey(a) === stateKey(b)
}
