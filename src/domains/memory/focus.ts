import { analyzeCategories, type CategoryAnalysis } from '../../core/focus'
import type { SessionRecord } from '../../core/types'
import { isSpanMode, type SpanMode } from './span'

export function analyzeSpanModes(records: readonly SessionRecord[]): CategoryAnalysis<SpanMode> {
  return analyzeCategories('memory', records, isSpanMode)
}
