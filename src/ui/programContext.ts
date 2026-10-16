import { exerciseForDomain, rankDomainsByWeakness, type ProgramContext } from '../core/programs'
import { sessionsOf } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { ACTIVE_DOMAINS, CATALOG, EXERCISES, getExercise } from './exercises'

export function buildProgramContext(records: readonly SessionRecord[]): ProgramContext {
  return {
    domainRanking: rankDomainsByWeakness(ACTIVE_DOMAINS, CATALOG, records),
    exerciseFor: (domain) => exerciseForDomain(domain, CATALOG, records),
    shortLength: (exercise) => getExercise(exercise).shortLength,
    untried: untriedAcrossDomains(records),
  }
}

/** Untried exercises interleaved by domain (1st of each domain, then 2nd…), so discovery covers variety. */
function untriedAcrossDomains(records: readonly SessionRecord[]): string[] {
  const perDomain = ACTIVE_DOMAINS.map((d) =>
    EXERCISES.filter((e) => e.domain === d && sessionsOf(records, e.id).length === 0).map((e) => e.id),
  )
  const longest = Math.max(0, ...perDomain.map((ids) => ids.length))
  return Array.from({ length: longest }, (_, i) => perDomain.flatMap((ids) => (ids[i] === undefined ? [] : [ids[i]]))).flat()
}
