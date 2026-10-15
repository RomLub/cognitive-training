import type { SeriesRule } from './series'

export const SERIES_RULE_LABELS: Record<SeriesRule, string> = {
  arithmetic: 'Arithmétique',
  geometric: 'Géométrique',
  alternating: 'Alternée',
  'second-order': 'Écarts croissants',
  fibonacci: 'Somme des précédents',
  interleaved: 'Entremêlée',
}
