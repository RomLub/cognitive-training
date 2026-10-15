import type { Operator } from './levels'

export const OPERATOR_LABELS: Record<Operator, string> = {
  '+': 'Addition',
  '-': 'Soustraction',
  '×': 'Multiplication',
  '÷': 'Division',
}

/** Display order for operator stats. */
export const OPERATOR_ORDER: readonly Operator[] = ['+', '-', '×', '÷']
