import { describe, expect, it } from 'vitest'
import type { LevelBounds } from './adaptive'
import { getProgram, PROGRAMS, rankDomainsByWeakness, type ProgramContext } from './programs'
import type { CognitiveDomain, SessionRecord } from './types'

const DOMAINS: CognitiveDomain[] = ['calculation', 'memory', 'attention', 'logic', 'speed']
const BOUNDS = Object.fromEntries(DOMAINS.map((d) => [d, { min: 1, max: 10 }])) as Record<CognitiveDomain, LevelBounds>

function record(domain: CognitiveDomain, endLevel: number, day = 1): SessionRecord {
  return {
    id: `${domain}-${day}`, domain, startedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    startLevel: endLevel, endLevel, items: 10, correct: 8, avgResponseMs: 2000,
  }
}

describe('rankDomainsByWeakness', () => {
  it('puts untrained domains first, then the lowest relative level', () => {
    const records = [record('calculation', 7), record('memory', 2), record('attention', 5), record('logic', 9)]
    expect(rankDomainsByWeakness(DOMAINS, records, BOUNDS)).toEqual(['speed', 'memory', 'attention', 'calculation', 'logic'])
  })

  it('normalizes levels by each domain range', () => {
    const bounds = { ...BOUNDS, memory: { min: 1, max: 4 } }
    // Memory 3/4 (ratio 0.67) is stronger than calculation 5/10 (ratio 0.44).
    const ranking = rankDomainsByWeakness(['calculation', 'memory'], [record('calculation', 5), record('memory', 3)], bounds)
    expect(ranking).toEqual(['calculation', 'memory'])
  })

  it('breaks ties with fewer sessions, then the given order', () => {
    const records = [record('calculation', 3, 1), record('calculation', 3, 2), record('memory', 3)]
    expect(rankDomainsByWeakness(['calculation', 'memory'], records, BOUNDS)).toEqual(['memory', 'calculation'])
    expect(rankDomainsByWeakness(['logic', 'speed'], [], BOUNDS)).toEqual(['logic', 'speed'])
  })
})

describe('programs', () => {
  const ctx: ProgramContext = {
    ranking: ['logic', 'speed', 'memory', 'calculation', 'attention'],
    shortLength: { calculation: 10, memory: 6, attention: 12, logic: 6, speed: 12 },
  }

  it('daily: every domain, weakest first with a double set', () => {
    expect(getProgram('daily').steps(ctx)).toEqual([
      { domain: 'logic', length: 12 },
      { domain: 'speed', length: 12 },
      { domain: 'memory', length: 6 },
      { domain: 'calculation', length: 10 },
      { domain: 'attention', length: 12 },
    ])
  })

  it('express: calculation then the two weakest other domains', () => {
    expect(getProgram('express').steps({ ...ctx, ranking: ['calculation', 'memory', 'logic', 'speed', 'attention'] })).toEqual([
      { domain: 'calculation', length: 10 },
      { domain: 'memory', length: 6 },
      { domain: 'logic', length: 6 },
    ])
  })

  it('calculation focus: two long calculation sets around working memory', () => {
    expect(getProgram('calculation-focus').steps(ctx).map((s) => s.domain)).toEqual(['calculation', 'memory', 'calculation'])
  })

  it('every program has steps with positive lengths', () => {
    for (const p of PROGRAMS) {
      const steps = p.steps(ctx)
      expect(steps.length).toBeGreaterThan(0)
      for (const s of steps) expect(s.length).toBeGreaterThan(0)
    }
  })
})
