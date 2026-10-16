import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import * as flanker from './flanker'
import * as goNoGo from './goNoGo'
import * as search from './visualSearch'

describe('go/no-go', () => {
  it('shows the no-go digit exactly on no-go trials', () => {
    const rng = seededRng(1)
    for (let level = 1; level <= 10; level++) {
      for (let i = 0; i < 300; i++) {
        const t = goNoGo.generateTrial(level, rng)
        expect(t.digit === goNoGo.NOGO_DIGIT).toBe(t.kind === 'nogo')
        expect(t.digit).toBeGreaterThanOrEqual(1)
        expect(t.digit).toBeLessThanOrEqual(9)
      }
    }
  })

  it('gets faster with rarer no-gos as levels rise', () => {
    expect(goNoGo.intervalMs(10)).toBeLessThan(goNoGo.intervalMs(1))
    expect(goNoGo.nogoShare(10)).toBeLessThan(goNoGo.nogoShare(1))
    expect(goNoGo.nogoShare(10)).toBeGreaterThan(0.1)
  })
})

describe('flanker', () => {
  it('puts the target in the middle, flankers matching the kind', () => {
    const rng = seededRng(2)
    for (let level = 1; level <= 10; level++) {
      for (let i = 0; i < 200; i++) {
        const t = flanker.generateTrial(level, rng)
        const chars = [...t.arrows]
        const side = flanker.flankersPerSide(level)
        expect(chars).toHaveLength(2 * side + 1)
        expect(chars[side]).toBe(t.target === 'left' ? '←' : '→')
        const flanks = new Set([...chars.slice(0, side), ...chars.slice(side + 1)])
        expect(flanks.size).toBe(1)
        expect([...flanks][0] === chars[side]).toBe(t.kind === 'congruent')
      }
    }
  })

  it('shortens the deadline with the level', () => {
    expect(flanker.timeLimitMs(1)).toBe(2500)
    expect(flanker.timeLimitMs(10)).toBe(700)
  })
})

describe('visual search', () => {
  it('places exactly one target when present and none when absent', () => {
    const rng = seededRng(3)
    for (let level = 1; level <= 10; level++) {
      for (let i = 0; i < 200; i++) {
        const t = search.generateTrial(level, rng)
        expect(t.grid).toHaveLength(t.side * t.side)
        const targets = t.grid.filter((c) => c === t.target).length
        expect(targets).toBe(t.kind === 'present' ? 1 : 0)
        expect(new Set(t.grid.filter((c) => c !== t.target)).size).toBe(1)
      }
    }
  })

  it('grows the grid with the level', () => {
    expect(search.searchSpec(1).side).toBe(3)
    expect(search.searchSpec(10).side).toBe(8)
  })
})
