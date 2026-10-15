import { MAX_LEVEL, MIN_LEVEL } from './levels'

/** Consecutive correct answers needed to move up a level. */
export const STREAK_UP = 3
/** Consecutive wrong answers that move down a level. */
export const STREAK_DOWN = 2

export interface AdaptiveState {
  level: number
  correctStreak: number
  wrongStreak: number
}

export function initialAdaptiveState(level: number): AdaptiveState {
  return { level: clampLevel(level), correctStreak: 0, wrongStreak: 0 }
}

/** Staircase: 3 right in a row → harder, 2 wrong in a row → easier. Streaks reset on level change. */
export function updateAdaptive(state: AdaptiveState, correct: boolean): AdaptiveState {
  if (correct) {
    const correctStreak = state.correctStreak + 1
    if (correctStreak >= STREAK_UP && state.level < MAX_LEVEL) {
      return { level: state.level + 1, correctStreak: 0, wrongStreak: 0 }
    }
    return { level: state.level, correctStreak, wrongStreak: 0 }
  }
  const wrongStreak = state.wrongStreak + 1
  if (wrongStreak >= STREAK_DOWN && state.level > MIN_LEVEL) {
    return { level: state.level - 1, correctStreak: 0, wrongStreak: 0 }
  }
  return { level: state.level, correctStreak: 0, wrongStreak }
}

export function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)))
}
