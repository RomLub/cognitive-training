import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { generateTrial, isValid, type Statement } from './syllogism'

const s = (q: Statement['q'], x: number, y: number): Statement => ({ q, x, y })

describe('syllogism validity', () => {
  it('recognizes classic valid forms', () => {
    // Barbara: all A are B, all B are C ⊢ all A are C.
    expect(isValid([s('all', 0, 1), s('all', 1, 2)], s('all', 0, 2), 3)).toBe(true)
    // Celarent: all A are B, no B is C ⊢ no A is C.
    expect(isValid([s('all', 0, 1), s('none', 1, 2)], s('none', 0, 2), 3)).toBe(true)
    // Darii: some A are B, all B are C ⊢ some A are C.
    expect(isValid([s('some', 0, 1), s('all', 1, 2)], s('some', 0, 2), 3)).toBe(true)
    // With every term non-empty: all A are B, all B are C ⊢ some A are C.
    expect(isValid([s('all', 0, 1), s('all', 1, 2)], s('some', 0, 2), 3)).toBe(true)
  })

  it('rejects classic fallacies', () => {
    // Undistributed middle: all A are B, all C are B ⊬ all A are C.
    expect(isValid([s('all', 0, 1), s('all', 2, 1)], s('all', 0, 2), 3)).toBe(false)
    // Some A are B, some B are C ⊬ some A are C.
    expect(isValid([s('some', 0, 1), s('some', 1, 2)], s('some', 0, 2), 3)).toBe(false)
    // All A are B, no B... reversed: no A is B, no B is C ⊬ no A is C.
    expect(isValid([s('none', 0, 1), s('none', 1, 2)], s('none', 0, 2), 3)).toBe(false)
  })

  it('handles 4-term chains', () => {
    expect(isValid([s('all', 0, 1), s('all', 1, 2), s('all', 2, 3)], s('all', 0, 3), 4)).toBe(true)
    expect(isValid([s('all', 0, 1), s('some', 1, 2), s('all', 2, 3)], s('all', 0, 3), 4)).toBe(false)
  })
})

describe('syllogism generation', () => {
  it('labels each trial with its computed validity and mixes both kinds', () => {
    const rng = seededRng(12)
    for (let level = 1; level <= 10; level++) {
      const kinds = new Set<string>()
      for (let i = 0; i < 20; i++) {
        const t = generateTrial(level, rng)
        expect(t.premises.length).toBe(level >= 8 ? 3 : 2)
        expect(t.conclusion).toMatch(/\.$/)
        kinds.add(t.kind)
      }
      expect(kinds.size).toBe(2)
    }
  })
})
