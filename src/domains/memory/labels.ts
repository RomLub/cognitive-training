import type { SpanMode } from './span'

export const SPAN_MODE_LABELS: Record<SpanMode, string> = {
  forward: 'Ordre direct',
  backward: 'Ordre inverse',
}
