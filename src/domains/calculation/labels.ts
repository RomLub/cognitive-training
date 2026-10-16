import type { Operator } from './levels'

export const OPERATOR_LABELS: Record<Operator, string> = {
  '+': 'Addition',
  '-': 'Soustraction',
  '×': 'Multiplication',
  '÷': 'Division',
}

/** Display order for operator stats. */
export const OPERATOR_ORDER: readonly Operator[] = ['+', '-', '×', '÷']

export const CHAIN_KIND_LABELS: Record<string, string> = {
  additive: 'Additions et soustractions',
  multiplicative: 'Avec × et ÷',
}

export const PRACTICAL_KIND_LABELS: Record<string, string> = {
  percent: 'Pourcentage',
  fraction: 'Fraction',
  discount: 'Remise',
  increase: 'Hausse',
  'rule-of-three': 'Règle de trois',
}

export const ESTIMATION_KIND_LABELS: Record<string, string> = {
  multiply: 'Multiplication',
  divide: 'Division',
  sum: 'Somme',
  percent: 'Pourcentage',
}
