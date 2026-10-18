import type { GridKind } from './logicGrid'
import type { KnightKind } from './knights'
import type { ProblemKind } from './wordProblems'

export const GRID_KIND_LABELS: Record<GridKind, string> = { classic: 'Classique', ordered: 'Maisons en rang' }

export const KNIGHT_KIND_LABELS: Record<KnightKind, string> = {
  direct: 'Affirmations simples',
  compound: 'Et / ou / si',
  counting: 'Dénombrement',
}

export const PROBLEM_KIND_LABELS: Record<ProblemKind, string> = {
  ages: 'Âges',
  mixture: 'Mélanges & quantités',
  work: 'Travail à plusieurs',
  motion: 'Vitesses & distances',
  counting: 'Dénombrement',
}
