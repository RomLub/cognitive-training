import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import {
  colorsForLevel,
  generateTrial,
  incongruentShare,
  LEVEL_BOUNDS,
  readWordShare,
  SIX_COLORS_FROM_LEVEL,
  SWITCH_FROM_LEVEL,
  timeLimitMs,
} from './stroop'

describe('stroop', () => {
  it('builds consistent trials at every level', () => {
    const rng = seededRng(5)
    for (let level = LEVEL_BOUNDS.min; level <= LEVEL_BOUNDS.max; level++) {
      const colors = colorsForLevel(level)
      for (let i = 0; i < 300; i++) {
        const t = generateTrial(level, rng)
        expect(colors).toContain(t.ink)
        expect(colors).toContain(t.word)
        expect(t.kind === 'congruent').toBe(t.word === t.ink)
        // "Read the word" trials are always incongruent, otherwise the cue would not matter.
        if (t.kind === 'read-word') {
          expect(t.rule).toBe('word')
          expect(t.target).toBe(t.word)
          expect(t.word).not.toBe(t.ink)
        } else {
          expect(t.rule).toBe('ink')
          expect(t.target).toBe(t.ink)
        }
        if (level < SWITCH_FROM_LEVEL) expect(t.kind).not.toBe('read-word')
      }
    }
  })

  it('keeps levels 1-10 unchanged (history stays comparable)', () => {
    expect(incongruentShare(1)).toBeCloseTo(0.3)
    expect(incongruentShare(10)).toBeCloseTo(0.75)
    expect(timeLimitMs(1)).toBe(3000)
    expect(timeLimitMs(10)).toBe(930)
    expect(colorsForLevel(10)).toHaveLength(4)
    expect(readWordShare(10)).toBe(0)
  })

  it('adds task switching from level 11 and 6 colors from level 16', () => {
    expect(readWordShare(SWITCH_FROM_LEVEL)).toBeCloseTo(0.25)
    expect(readWordShare(LEVEL_BOUNDS.max)).toBeCloseTo(0.5)
    expect(colorsForLevel(SIX_COLORS_FROM_LEVEL - 1)).toHaveLength(4)
    expect(colorsForLevel(SIX_COLORS_FROM_LEVEL)).toHaveLength(6)
    expect(incongruentShare(LEVEL_BOUNDS.max)).toBeCloseTo(0.75)
  })

  it('shortens the deadline within each band, down to ~0.75 s', () => {
    for (const [from, to] of [[1, 10], [11, 15], [16, 20]] as const) {
      for (let level = from + 1; level <= to; level++) expect(timeLimitMs(level)).toBeLessThan(timeLimitMs(level - 1))
    }
    expect(timeLimitMs(LEVEL_BOUNDS.max)).toBe(740)
  })

  it('matches the target shares and over-represents the focus', () => {
    const share = (level: number, focus: 'incongruent' | 'read-word' | null, kind: string) => {
      const rng = seededRng(9)
      let n = 0
      for (let i = 0; i < 4000; i++) if (generateTrial(level, rng, focus).kind === kind) n++
      return n / 4000
    }
    expect(share(1, null, 'incongruent')).toBeCloseTo(incongruentShare(1), 1)
    expect(share(1, 'incongruent', 'incongruent')).toBeGreaterThan(0.6)
    expect(share(13, null, 'read-word')).toBeCloseTo(readWordShare(13), 1)
    expect(share(13, 'read-word', 'read-word')).toBeGreaterThan(0.6)
    // A focus the level does not offer is ignored.
    expect(share(5, 'read-word', 'read-word')).toBe(0)
  })

  it('rejects unknown levels', () => {
    expect(() => generateTrial(0)).toThrow()
    expect(() => timeLimitMs(LEVEL_BOUNDS.max + 1)).toThrow()
  })
})
