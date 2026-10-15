import { analyzeCategories, type CategoryAnalysis } from '../../core/focus'
import type { SessionRecord } from '../../core/types'
import { isOperator, type Operator } from './levels'

export function analyzeOperators(records: readonly SessionRecord[]): CategoryAnalysis<Operator> {
  return analyzeCategories('calculation', records, isOperator)
}
