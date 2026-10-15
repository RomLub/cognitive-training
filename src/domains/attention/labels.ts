import type { InkColor, StroopKind } from './stroop'

export const STROOP_KIND_LABELS: Record<StroopKind, string> = {
  congruent: 'Concordant',
  incongruent: 'Discordant',
}

export const COLOR_NAMES: Record<InkColor, string> = {
  red: 'Rouge',
  blue: 'Bleu',
  green: 'Vert',
  yellow: 'Jaune',
}

/** Keyboard shortcut per color (French initial). */
export const COLOR_KEYS: Record<InkColor, string> = {
  red: 'r',
  blue: 'b',
  green: 'v',
  yellow: 'j',
}
