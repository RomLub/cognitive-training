import type { LevelBounds } from '../core/adaptive'
import { rankDomainsByWeakness, type ProgramContext } from '../core/programs'
import type { CognitiveDomain, SessionRecord } from '../core/types'
import { DOMAIN_UI, TRAINABLE_DOMAINS } from './domains'

function byDomain<T>(pick: (domain: CognitiveDomain) => T): Record<CognitiveDomain, T> {
  return Object.fromEntries(TRAINABLE_DOMAINS.map((d) => [d, pick(d)])) as Record<CognitiveDomain, T>
}

export function buildProgramContext(records: readonly SessionRecord[]): ProgramContext {
  const bounds: Record<CognitiveDomain, LevelBounds> = byDomain((d) => DOMAIN_UI[d].bounds)
  return {
    ranking: rankDomainsByWeakness(TRAINABLE_DOMAINS, records, bounds),
    shortLength: byDomain((d) => DOMAIN_UI[d].shortLength),
  }
}
