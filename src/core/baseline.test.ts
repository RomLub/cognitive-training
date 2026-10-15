import { describe, expect, it } from 'vitest'
import { domainEvolution, snapshot } from './baseline'
import type { SessionRecord } from './types'

function session(day: number, endLevel: number, correct: number, items = 10, avgResponseMs = 2000): SessionRecord {
  return {
    id: `s${day}`, domain: 'calculation', startedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    startLevel: 1, endLevel, items, correct, avgResponseMs,
  }
}

describe('snapshot', () => {
  it('averages levels and weights accuracy and time by item count', () => {
    const s = snapshot([session(1, 4, 10, 10, 1000), session(2, 6, 10, 30, 3000)])
    expect(s.level).toBe(5)
    expect(s.accuracy).toBe(20 / 40)
    expect(s.avgResponseMs).toBe((1000 * 10 + 3000 * 30) / 40)
    expect(s.sessions).toBe(2)
  })

  it('refuses an empty list', () => {
    expect(() => snapshot([])).toThrow()
  })
})

describe('domainEvolution', () => {
  it('has nothing without sessions of the domain', () => {
    expect(domainEvolution('calculation', [{ ...session(1, 5, 5), domain: 'memory' }])).toEqual({ status: 'none' })
  })

  it('builds the baseline over the first 3 sessions', () => {
    const e = domainEvolution('calculation', [session(1, 3, 5), session(2, 5, 7)])
    expect(e.status).toBe('building')
    if (e.status === 'building') expect(e.baseline.sessions).toBe(2)
  })

  it('compares the first 3 sessions with the latest 3, regardless of input order', () => {
    const records = [7, 1, 3, 2, 6, 5, 4].map((d) => session(d, d, d))
    const e = domainEvolution('calculation', records)
    if (e.status !== 'ready') throw new Error(`unexpected status ${e.status}`)
    expect(e.baseline.level).toBe(2) // days 1-3
    expect(e.current.level).toBe(6) // days 5-7
  })

  it('never overlaps baseline and recent sessions', () => {
    const e = domainEvolution('calculation', [1, 2, 3, 4].map((d) => session(d, d, 5)))
    if (e.status !== 'ready') throw new Error(`unexpected status ${e.status}`)
    expect(e.current.sessions).toBe(1)
    expect(e.current.level).toBe(4)
  })
})
