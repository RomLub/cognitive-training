import type { SpanMode } from './span'

export const SPAN_MODE_LABELS: Record<SpanMode, string> = {
  forward: 'Ordre direct',
  backward: 'Ordre inverse',
}

export const NBACK_LABELS: Record<string, string> = { letters: 'Lettres', positions: 'Positions' }

export const CORSI_LABELS: Record<string, string> = { forward: 'Dans l’ordre', backward: 'À l’envers' }
