import { describe, expect, it } from 'vitest'
import { clampLevel, initialAdaptiveState, updateAdaptive, type AdaptiveState, type LevelBounds } from './adaptive'

const BOUNDS: LevelBounds = { min: 1, max: 10 }

function run(start: AdaptiveState, answers: boolean[]): AdaptiveState {
  return answers.reduce((state, correct) => updateAdaptive(state, correct, BOUNDS), start)
}

const init = (level: number) => initialAdaptiveState(level, BOUNDS)

describe('adaptive staircase', () => {
  it('moves up after 3 consecutive correct answers', () => {
    expect(run(init(3), [true, true]).level).toBe(3)
    expect(run(init(3), [true, true, true]).level).toBe(4)
  })

  it('moves down after 2 consecutive wrong answers', () => {
    expect(run(init(3), [false]).level).toBe(3)
    expect(run(init(3), [false, false]).level).toBe(2)
  })

  it('resets streaks when the answer flips', () => {
    expect(run(init(3), [true, true, false, true, true]).level).toBe(3)
    expect(run(init(3), [false, true, false]).level).toBe(3)
  })

  it('stays within bounds', () => {
    expect(run(init(BOUNDS.max), [true, true, true, true]).level).toBe(BOUNDS.max)
    expect(run(init(BOUNDS.min), [false, false, false]).level).toBe(BOUNDS.min)
  })

  it('clamps the initial level', () => {
    expect(clampLevel(0, BOUNDS)).toBe(BOUNDS.min)
    expect(clampLevel(99, BOUNDS)).toBe(BOUNDS.max)
    expect(init(4.6).level).toBe(5)
  })
})
