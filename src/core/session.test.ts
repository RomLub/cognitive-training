import { describe, expect, it } from 'vitest'
import { buildSessionRecord } from './session'

describe('buildSessionRecord', () => {
  it('summarizes results', () => {
    const record = buildSessionRecord({
      id: 'x',
      domain: 'calculation',
      exercise: 'arithmetic',
      startedAt: new Date('2026-10-15T10:00:00Z'),
      startLevel: 2,
      endLevel: 3,
      results: [
        { level: 2, category: '+', correct: true, responseMs: 1000 },
        { level: 2, category: '×', correct: false, responseMs: 3000 },
      ],
    })
    expect(record).toEqual({
      id: 'x',
      domain: 'calculation',
      exercise: 'arithmetic',
      startedAt: '2026-10-15T10:00:00.000Z',
      startLevel: 2,
      endLevel: 3,
      items: 2,
      correct: 1,
      avgResponseMs: 2000,
      breakdown: {
        '+': { items: 1, correct: 1, totalResponseMs: 1000 },
        '×': { items: 1, correct: 0, totalResponseMs: 3000 },
      },
    })
  })
})
