import type { SeriesRule } from './series'

export const SERIES_RULE_LABELS: Record<SeriesRule, string> = {
  arithmetic: 'Arithmétique',
  geometric: 'Géométrique',
  alternating: 'Alternée',
  'second-order': 'Écarts croissants',
  fibonacci: 'Somme des précédents',
  interleaved: 'Entremêlée',
}

export const MATRIX_KIND_LABELS: Record<string, string> = {
  column: 'Règle par colonne',
  row: 'Règle par ligne',
  latin: 'Chaque valeur une fois',
}

export const SYLLOGISM_KIND_LABELS: Record<string, string> = { valid: 'Conclusion valide', invalid: 'Conclusion non valide' }
