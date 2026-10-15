import { summarizeItems } from '../../core/stats'
import type { ItemResult, SessionRecord } from '../../core/types'

export const SESSION_LENGTH = 20

/** Parses the user's typed answer; returns null when it is not a plain integer. */
export function parseAnswer(input: string): number | null {
  const trimmed = input.trim().replace(/\s/g, '')
  if (!/^-?\d+$/.test(trimmed)) return null
  return Number.parseInt(trimmed, 10)
}

export function buildSessionRecord(params: {
  id: string
  startedAt: Date
  startLevel: number
  endLevel: number
  results: readonly ItemResult[]
}): SessionRecord {
  return {
    id: params.id,
    domain: 'calculation',
    startedAt: params.startedAt.toISOString(),
    startLevel: params.startLevel,
    endLevel: params.endLevel,
    ...summarizeItems(params.results),
  }
}
