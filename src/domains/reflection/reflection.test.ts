import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import * as grid from './logicGrid'
import * as knights from './knights'
import * as problems from './wordProblems'

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1)

function allGrids(people: number, attributes: number): number[][][] {
  const perms = (n: number): number[][] =>
    n === 0 ? [[]] : perms(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]))
  let grids: number[][][] = [[]]
  for (let a = 0; a < attributes; a++) grids = grids.flatMap((g) => perms(people).map((p) => [...g, p]))
  return grids
}

describe('logic grid', () => {
  it('has a solution that satisfies every clue, at every level', () => {
    for (const level of LEVELS) {
      const p = grid.generatePuzzle(level, seededRng(level))
      expect(p.names).toHaveLength(grid.gridSpec(level).people)
      expect(p.attributes).toHaveLength(grid.gridSpec(level).attributes)
      expect(grid.satisfiesClues(p, p.solution), `level ${level}`).toBe(true)
      expect(grid.countSolutions(p.names.length, p.attributes.length, p.constraints, p.house)).toBe(1)
      for (const text of p.clues) expect(text).not.toMatch(/undefined|NaN/)
    }
  })

  it('has exactly one solution, checked by brute force on small grids', () => {
    for (const level of [1, 2, 3, 4]) {
      for (let seed = 0; seed < 5; seed++) {
        const p = grid.generatePuzzle(level, seededRng(seed * 31 + level))
        const solutions = allGrids(p.names.length, p.attributes.length).filter((g) => grid.satisfiesClues(p, g))
        expect(solutions).toEqual([p.solution.map((r) => [...r])])
      }
    }
  })

  it('keeps only necessary clues', () => {
    for (const level of [3, 8, 12]) {
      const p = grid.generatePuzzle(level, seededRng(level * 7))
      p.constraints.forEach((_, i) => {
        const without = p.constraints.filter((_, j) => j !== i)
        expect(grid.countSolutions(p.names.length, p.attributes.length, without, p.house)).toBeGreaterThan(1)
      })
    }
  })

  it('gives ordered puzzles a house column and relations, and honours the focus', () => {
    const puzzles = Array.from({ length: 20 }, (_, seed) => grid.generatePuzzle(9, seededRng(seed), 'ordered'))
    const ordered = puzzles.filter((p) => p.kind === 'ordered')
    expect(ordered.length).toBeGreaterThan(10)
    for (const p of ordered) expect(p.attributes.at(-1)!.title).toBe('Maison')
    expect(ordered.some((p) => p.constraints.some((c) => c.kind === 'left-of' || c.kind === 'next-to'))).toBe(true)
    expect(grid.generatePuzzle(1, seededRng(3), 'ordered').kind).toBe('classic')
  })

  it('states nothing directly about a person at indirect levels', () => {
    const p = grid.generatePuzzle(20, seededRng(5))
    expect(p.constraints.some((c) => c.kind === 'same' && (c.a.kind === 'name' || c.b.kind === 'name'))).toBe(false)
  })

  it('checks a filled grid', () => {
    const p = grid.generatePuzzle(5, seededRng(1))
    expect(grid.isGridSolved(p, p.solution)).toBe(true)
    const wrong = p.solution.map((row) => [...row])
    ;[wrong[0]![0], wrong[0]![1]] = [wrong[0]![1]!, wrong[0]![0]!]
    expect(grid.isGridSolved(p, wrong)).toBe(false)
    expect(grid.isGridSolved(p, p.solution.map((row) => row.map(() => null)))).toBe(false)
  })

  it('rejects invalid levels', () => {
    expect(() => grid.gridSpec(21)).toThrow()
  })
})

describe('knights and knaves', () => {
  it('has exactly one consistent assignment, at every level', () => {
    for (const level of LEVELS) {
      for (let seed = 0; seed < 3; seed++) {
        const p = knights.generatePuzzle(level, seededRng(seed * 13 + level))
        expect(p.statements).toHaveLength(knights.knightSpec(level).people)
        expect(knights.consistentAssignments(p.names.length, p.statements.map((s) => s.holds))).toEqual([p.solution])
        for (const s of p.statements) expect(s.text).not.toMatch(/undefined|NaN/)
      }
    }
  })

  it('makes sincere people tell the truth and liars lie', () => {
    const p = knights.generatePuzzle(10, seededRng(4))
    p.statements.forEach((s, i) => expect(s.holds(p.solution)).toBe(p.solution[i]))
  })

  it('honours the focus when the level allows it', () => {
    const kinds = Array.from({ length: 20 }, (_, s) => knights.generatePuzzle(12, seededRng(s), 'counting').kind)
    expect(kinds.filter((k) => k === 'counting').length).toBeGreaterThan(10)
    expect(knights.generatePuzzle(1, seededRng(1), 'counting').kind).toBe('direct')
  })

  it('agrees the feminine form', () => {
    expect(knights.typeLabel(false, 0)).toBe('Menteuse')
    expect(knights.typeLabel(false, 1)).toBe('Menteur')
    expect(knights.typeLabel(true, 0)).toBe('Sincère')
  })
})

describe('word problems', () => {
  it('always has a whole positive answer, explained, at every level and kind', () => {
    for (const level of LEVELS) {
      for (const kind of problems.PROBLEM_KINDS) {
        for (let seed = 0; seed < 4; seed++) {
          const p = problems.generateProblem(level, seededRng(seed * 101 + level), kind)
          expect(Number.isInteger(p.answer) && p.answer > 0, p.text).toBe(true)
          expect(`${p.text} ${p.explanation}`).not.toMatch(/undefined|NaN|Infinity/)
          expect(p.explanation).toContain(String(p.answer))
        }
      }
    }
  })

  it('solves coin and handshake problems correctly', () => {
    for (let seed = 0; seed < 30; seed++) {
      const p = problems.generateProblem(2, seededRng(seed), 'mixture')
      const m = /contient (\d+) pièces.* (\d+) €\. Combien/.exec(p.text)
      if (m !== null) expect(p.answer).toBe((Number(m[2]) - 2 * Number(m[1])) / 3)
      const h = problems.generateProblem(2, seededRng(seed), 'counting')
      const n = /réunion de (\d+) personnes/.exec(h.text)
      if (n !== null) expect(h.answer).toBe((Number(n[1]) * (Number(n[1]) - 1)) / 2)
    }
  })

  it('solves meeting problems correctly', () => {
    for (let seed = 0; seed < 30; seed++) {
      const p = problems.generateProblem(3, seededRng(seed), 'motion')
      const m = /sont à (\d+) km.*l’une à (\d+) km\/h, l’autre à (\d+) km\/h/.exec(p.text)
      if (m !== null) expect(p.answer).toBe((60 * Number(m[1])) / (Number(m[2]) + Number(m[3])))
    }
  })

  it('unlocks harder problems at higher levels', () => {
    const texts = Array.from({ length: 40 }, (_, s) => problems.generateProblem(18, seededRng(s), 'ages').text)
    expect(texts.some((t) => t.includes('quand j’avais'))).toBe(true)
    const low = Array.from({ length: 40 }, (_, s) => problems.generateProblem(1, seededRng(s), 'ages').text)
    expect(low.every((t) => !t.includes('quand j’avais'))).toBe(true)
  })

  it('rejects invalid levels', () => {
    expect(() => problems.generateProblem(21, seededRng(1))).toThrow()
  })
})
