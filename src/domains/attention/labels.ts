import type { InkColor, StroopKind } from './stroop'

export const STROOP_KIND_LABELS: Record<StroopKind, string> = {
  congruent: 'Concordant',
  incongruent: 'Discordant',
  'read-word': 'Lire le mot',
}

export const COLOR_NAMES: Record<InkColor, string> = {
  red: 'Rouge',
  blue: 'Bleu',
  green: 'Vert',
  yellow: 'Jaune',
  purple: 'Violet',
  brown: 'Marron',
}

/** Keyboard shortcut per color (French initial; I for vIolet since V is taken by vert, M for marron). */
export const COLOR_KEYS: Record<InkColor, string> = {
  red: 'r',
  blue: 'b',
  green: 'v',
  yellow: 'j',
  purple: 'i',
  brown: 'm',
}

export const GO_KIND_LABELS: Record<string, string> = { go: 'Appuyer', nogo: 'Se retenir' }

export const FLANKER_KIND_LABELS: Record<string, string> = { congruent: 'Concordant', incongruent: 'Discordant' }

export const SEARCH_KIND_LABELS: Record<string, string> = { present: 'Cible présente', absent: 'Cible absente' }
