import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import * as tower from './tower'
import * as trail from './trail'

describe('trail making', () => {
  it('labels numbers and alternating trails in click order', () => {
    expect(trail.trailLabels('numbers', 4)).toEqual(['1', '2', '3', '4'])
    expect(trail.trailLabels('alternating', 6)).toEqual(['1', 'A', '2', 'B', '3', 'C'])
  })

  it('places all circles inside the board and apart from each other', () => {
    const rng = seededRng(5)
    for (let level = 1; level <= 10; level++) {
      for (let i = 0; i < 20; i++) {
        const t = trail.generateTrial(level, rng)
        expect(t.nodes).toHaveLength(trail.nodeCount(level))
        for (const [k, a] of t.nodes.entries()) {
          expect(a.x).toBeGreaterThanOrEqual(6)
          expect(a.x).toBeLessThanOrEqual(94)
          for (const b of t.nodes.slice(k + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(trail.MIN_DISTANCE)
        }
      }
    }
  })

  it('gives less time per circle as levels rise', () => {
    expect(trail.trailTimeLimitMs(1) / trail.nodeCount(1)).toBeGreaterThan(trail.trailTimeLimitMs(10) / trail.nodeCount(10))
  })
})

describe('tower of London', () => {
  it('enumerates the 36 legal states', () => {
    const states = tower.allStates()
    expect(states).toHaveLength(36)
    expect(new Set(states.map(tower.stateKey)).size).toBe(36)
    for (const s of states) s.forEach((peg, i) => expect(peg.length).toBeLessThanOrEqual(tower.CAPACITIES[i as 0 | 1 | 2]))
  })

  it('refuses illegal moves', () => {
    const s: tower.TowerState = [['red', 'green'], ['blue'], []]
    expect(tower.move(s, 2, 0)).toBeNull() // empty source
    expect(tower.move(s, 0, 0)).toBeNull() // same peg
    expect(tower.move([['red'], ['green'], ['blue']], 0, 2)).toBeNull() // full target
    expect(tower.move(s, 0, 2)).toEqual([['red'], ['blue'], ['green']])
  })

  it('builds problems whose minimum matches the level', () => {
    const rng = seededRng(8)
    for (let level = 1; level <= 10; level++) {
      const t = tower.generateTrial(level, rng)
      expect(tower.minMoves(t.start, t.goal)).toBe(tower.minMovesFor(level))
      expect(t.minMoves).toBe(tower.minMovesFor(level))
    }
  })

  it('computes minimum moves with breadth-first search', () => {
    const s: tower.TowerState = [['red', 'green', 'blue'], [], []]
    expect(tower.minMoves(s, s)).toBe(0)
    expect(tower.minMoves(s, [['red', 'green'], ['blue'], []])).toBe(1)
  })
})
