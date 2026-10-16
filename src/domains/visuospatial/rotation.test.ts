import { describe, expect, it } from 'vitest'
import { seededRng } from '../../core/random'
import { canonical, generateTrial, isChiral, mirror, randomPolyomino, rotationSpec, type Cell } from './rotation'

describe('mental rotation', () => {
  it('tells chiral shapes from symmetric ones', () => {
    const square: Cell[] = [[0, 0], [1, 0], [0, 1], [1, 1]]
    const lShape: Cell[] = [[0, 0], [0, 1], [0, 2], [1, 2]]
    const tShape: Cell[] = [[0, 0], [1, 0], [2, 0], [1, 1]]
    expect(isChiral(square)).toBe(false)
    expect(isChiral(tShape)).toBe(false)
    expect(isChiral(lShape)).toBe(true)
  })

  it('grows connected asymmetric shapes of the requested size', () => {
    const rng = seededRng(7)
    for (let size = 4; size <= 9; size++) {
      for (let i = 0; i < 30; i++) {
        const cells = randomPolyomino(size, rng)
        expect(new Set(cells.map(([x, y]) => `${x},${y}`)).size).toBe(size)
        expect(isChiral(cells)).toBe(true)
        // Connected: every cell touches another one.
        for (const [x, y] of cells) {
          expect(cells.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) === 1)).toBe(true)
        }
      }
    }
  })

  it('mirrors only on mirror trials, with a level angle', () => {
    const rng = seededRng(8)
    for (let level = 1; level <= 10; level++) {
      for (let i = 0; i < 30; i++) {
        const t = generateTrial(level, rng)
        expect(t.cells).toHaveLength(rotationSpec(level).cells)
        expect(rotationSpec(level).angles).toContain(t.angle)
        expect(t.angle % 360).not.toBe(0)
        const sameShape = canonical(t.rightCells) === canonical(t.cells)
        expect(sameShape).toBe(t.kind === 'same')
        if (t.kind === 'mirror') expect(canonical(t.rightCells)).toBe(canonical(mirror(t.cells)))
      }
    }
  })
})
