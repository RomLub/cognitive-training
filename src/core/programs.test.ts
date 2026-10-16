import { describe, expect, it } from 'vitest'
import { exerciseForDomain, getProgram, PROGRAMS, rankDomainsByWeakness, type CatalogExercise, type ProgramContext } from './programs'
import type { CognitiveDomain, SessionRecord } from './types'

const B10 = { min: 1, max: 10 }
const CATALOG: CatalogExercise[] = [
  { id: 'arithmetic', domain: 'calculation', bounds: B10 },
  { id: 'chain', domain: 'calculation', bounds: B10 },
  { id: 'digit-span', domain: 'memory', bounds: B10 },
  { id: 'stroop', domain: 'attention', bounds: { min: 1, max: 20 } },
  { id: 'number-series', domain: 'logic', bounds: B10 },
  { id: 'pair-compare', domain: 'speed', bounds: B10 },
]
const DOMAINS: CognitiveDomain[] = ['calculation', 'memory', 'attention', 'logic', 'speed']

function record(exercise: string, endLevel: number, day = 1): SessionRecord {
  const domain = CATALOG.find((e) => e.id === exercise)!.domain
  return {
    id: `${exercise}-${day}`, domain, exercise, startedAt: `2026-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
    startLevel: endLevel, endLevel, items: 10, correct: 8, avgResponseMs: 2000,
  }
}

describe('rankDomainsByWeakness', () => {
  it('puts untrained domains first, then the lowest relative level', () => {
    const records = [record('arithmetic', 7), record('digit-span', 2), record('stroop', 9), record('number-series', 9)]
    // Stroop 9/20 is relatively weaker than logic 9/10.
    expect(rankDomainsByWeakness(DOMAINS, CATALOG, records)).toEqual(['speed', 'memory', 'attention', 'calculation', 'logic'])
  })

  it('averages the trained exercises of a domain', () => {
    // Calculation: (1/9 + 1) / 2 ≈ 0.56 vs memory 4/9 ≈ 0.44.
    const records = [record('arithmetic', 2), record('chain', 10), record('digit-span', 5)]
    expect(rankDomainsByWeakness(['calculation', 'memory'], CATALOG, records)).toEqual(['memory', 'calculation'])
  })

  it('breaks ties with fewer sessions, then the given order', () => {
    const records = [record('arithmetic', 3, 1), record('arithmetic', 3, 2), record('digit-span', 3)]
    expect(rankDomainsByWeakness(['calculation', 'memory'], CATALOG, records)).toEqual(['memory', 'calculation'])
    expect(rankDomainsByWeakness(['logic', 'speed'], CATALOG, [])).toEqual(['logic', 'speed'])
  })
})

describe('exerciseForDomain', () => {
  it('prefers an untried exercise, in catalog order', () => {
    expect(exerciseForDomain('calculation', CATALOG, [])).toBe('arithmetic')
    expect(exerciseForDomain('calculation', CATALOG, [record('arithmetic', 3)])).toBe('chain')
  })

  it('otherwise picks the least recently played', () => {
    const records = [record('arithmetic', 3, 5), record('chain', 3, 2)]
    expect(exerciseForDomain('calculation', CATALOG, records)).toBe('chain')
  })

  it('fails loudly for a domain without exercise', () => {
    expect(() => exerciseForDomain('language', CATALOG, [])).toThrow()
  })
})

describe('programs', () => {
  const lengths: Record<string, number> = { arithmetic: 10, chain: 8, practical: 8, estimation: 10, 'digit-span': 6 }
  const ctx: ProgramContext = {
    domainRanking: ['logic', 'speed', 'memory', 'calculation', 'attention', 'language'],
    exerciseFor: (d) => CATALOG.find((e) => e.domain === d)?.id ?? `${d}-ex`,
    shortLength: (id) => lengths[id] ?? 12,
    untried: ['chain', 'digit-span', 'stroop', 'number-series', 'pair-compare'],
  }

  it('daily: the 5 weakest domains, one exercise each, the weakest doubled', () => {
    expect(getProgram('daily').steps(ctx)).toEqual([
      { exercise: 'number-series', length: 24 },
      { exercise: 'pair-compare', length: 12 },
      { exercise: 'digit-span', length: 6 },
      { exercise: 'arithmetic', length: 10 },
      { exercise: 'stroop', length: 12 },
    ])
  })

  it('express: a calculation exercise then the two weakest other domains', () => {
    expect(getProgram('express').steps({ ...ctx, domainRanking: ['calculation', 'memory', 'logic'] }).map((s) => s.exercise)).toEqual([
      'arithmetic',
      'digit-span',
      'number-series',
    ])
  })

  it('calculation focus: the four calculation exercises', () => {
    expect(getProgram('calculation-focus').steps(ctx).map((s) => s.exercise)).toEqual(['arithmetic', 'chain', 'practical', 'estimation'])
  })

  it('discovery: up to 4 untried exercises, nothing once all were tried', () => {
    expect(getProgram('discovery').steps(ctx).map((s) => s.exercise)).toEqual(['chain', 'digit-span', 'stroop', 'number-series'])
    expect(getProgram('discovery').steps({ ...ctx, untried: [] })).toEqual([])
  })

  it('every program step has a positive length', () => {
    for (const p of PROGRAMS) for (const s of p.steps(ctx)) expect(s.length).toBeGreaterThan(0)
  })
})
