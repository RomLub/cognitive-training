import { describe, expect, it } from 'vitest'
import type { SessionRecord } from '../../core/types'
import { analyzeSpanModes } from './focus'

function session(domain: SessionRecord['domain'], breakdown: SessionRecord['breakdown']): SessionRecord {
  return {
    id: domain, domain, startedAt: '2026-10-14T10:00:00.000Z',
    startLevel: 3, endLevel: 3, items: 16, correct: 12, avgResponseMs: 3000, breakdown,
  }
}

describe('analyzeSpanModes', () => {
  it('finds the weaker recall mode among memory sessions only', () => {
    const records = [
      session('memory', { forward: { items: 8, correct: 7, totalResponseMs: 1 }, backward: { items: 8, correct: 3, totalResponseMs: 1 } }),
      session('calculation', { '+': { items: 20, correct: 0, totalResponseMs: 1 } }),
    ]
    expect(analyzeSpanModes(records).weakest?.category).toBe('backward')
  })

  it('fails loudly on an unknown category', () => {
    const records = [session('memory', { sideways: { items: 10, correct: 1, totalResponseMs: 1 } })]
    expect(() => analyzeSpanModes(records)).toThrow(/Unknown memory category/)
  })
})
