import { summarizeItems } from './stats'
import type { CognitiveDomain, ItemResult, SessionRecord } from './types'

export function buildSessionRecord(params: {
  id: string
  domain: CognitiveDomain
  exercise: string
  startedAt: Date
  startLevel: number
  endLevel: number
  results: readonly ItemResult[]
}): SessionRecord {
  return {
    id: params.id,
    domain: params.domain,
    exercise: params.exercise,
    startedAt: params.startedAt.toISOString(),
    startLevel: params.startLevel,
    endLevel: params.endLevel,
    ...summarizeItems(params.results),
  }
}
