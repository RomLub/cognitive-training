import type { PairKind } from './compare'

export const PAIR_KIND_LABELS: Record<PairKind, string> = {
  same: 'Identiques',
  different: 'Différents',
}

export const SYMBOL_SET_LABELS: Record<string, string> = { distinct: 'Symboles distincts', similar: 'Symboles proches' }
