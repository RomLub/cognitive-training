import { describe, expect, it } from 'vitest'
import { clampLevel, initialAdaptiveState, updateAdaptive, type AdaptiveState } from './adaptive'
import { MAX_LEVEL, MIN_LEVEL } from './levels'

function run(start: AdaptiveState, answers: boolean[]): AdaptiveState {
  return answers.reduce(updateAdaptive, start)
}

describe('adaptive staircase', () => {
  it('moves up after 3 consecutive correct answers', () => {
    expect(run(initialAdaptiveState(3), [true, true]).level).toBe(3)
    expect(run(initialAdaptiveState(3), [true, true, true]).level).toBe(4)
  })

  it('moves down after 2 consecutive wrong answers', () => {
    expect(run(initialAdaptiveState(3), [false]).level).toBe(3)
    expect(run(initialAdaptiveState(3), [false, false]).level).toBe(2)
  })

  it('resets streaks when the answer flips', () => {
    expect(run(initialAdaptiveState(3), [true, true, false, true, true]).level).toBe(3)
    expect(run(initialAdaptiveState(3), [false, true, false]).level).toBe(3)
  })

  it('stays within bounds', () => {
    expect(run(initialAdaptiveState(MAX_LEVEL), [true, true, true, true]).level).toBe(MAX_LEVEL)
    expect(run(initialAdaptiveState(MIN_LEVEL), [false, false, false]).level).toBe(MIN_LEVEL)
  })

  it('clamps the initial level', () => {
    expect(clampLevel(0)).toBe(MIN_LEVEL)
    expect(clampLevel(99)).toBe(MAX_LEVEL)
    expect(initialAdaptiveState(4.6).level).toBe(5)
  })
})
