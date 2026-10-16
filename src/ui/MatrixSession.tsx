import { useCallback, useId } from 'react'
import { MATRIX_KIND_LABELS } from '../domains/logic/labels'
import { generateTrial, LEVEL_BOUNDS, type Figure, type MatrixKind } from '../domains/logic/matrices'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useKeyboardChoice } from './useKeyboardChoice'

/** Item positions for 1, 2 or 3 copies of a shape inside a 60×60 cell. */
const LAYOUTS: readonly (readonly [number, number][])[] = [
  [[30, 30]],
  [[18, 30], [42, 30]],
  [[30, 16], [16, 42], [44, 42]],
]

function Shape({ shape, x, y, fill, size }: { shape: number; x: number; y: number; fill: string; size: number }) {
  const r = size / 2
  if (shape === 0) return <circle cx={x} cy={y} r={r} fill={fill} />
  if (shape === 1) return <rect x={x - r} y={y - r} width={size} height={size} fill={fill} />
  return <polygon points={`${x},${y - r} ${x + r},${y + r} ${x - r},${y + r}`} fill={fill} />
}

function FigureView({ figure, label }: { figure: Figure | null; label: string }) {
  // One stripe pattern per figure: ids must be unique in the page.
  const patternId = useId()
  const size = figure?.count === 0 ? 26 : 18
  const fill = figure === null ? 'none' : (['none', `url(#${patternId})`, 'currentColor'] as const)[figure.fill]!
  return (
    <svg viewBox="0 0 60 60" className="matrix-figure" role="img" aria-label={label}>
      <defs>
        <pattern id={patternId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="1.6" />
        </pattern>
      </defs>
      {figure === null ? (
        <text x="30" y="38" textAnchor="middle" fontSize="24" fill="currentColor">
          ?
        </text>
      ) : (
        <g stroke="currentColor" strokeWidth="2">
          {LAYOUTS[figure.count]!.map(([x, y], i) => (
            <Shape key={i} shape={figure.shape} x={x} y={y} fill={fill} size={size} />
          ))}
        </g>
      )}
    </svg>
  )
}

const KEYS: Readonly<Record<string, number>> = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [String(i + 1), i]))

export function MatrixSession({ startLevel, focus, length, onFinish, onQuit }: ExerciseProps<MatrixKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'logic', exercise: 'matrices', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const trial = session.item

  function choose(index: number) {
    if (index >= trial.options.length) return
    const correct = index === trial.answerIndex
    session.answer(correct, correct ? 'Bonne figure' : `C’était la figure ${trial.answerIndex + 1}`)
  }

  useKeyboardChoice(KEYS, choose)

  return (
    <SessionFrame
      itemLabel="Matrice"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (MATRIX_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      onQuit={onQuit}
    >
      <p className="instruction muted">Quelle figure complète la grille ? Regarde les lignes et les colonnes.</p>
      <div className="matrix-grid" data-testid="matrix" data-answer={trial.answerIndex}>
        {trial.cells.map((cell, i) => (
          <FigureView key={i} figure={i === 8 ? null : cell} label={i === 8 ? 'Case à trouver' : `Case ${i + 1}`} />
        ))}
      </div>
      <div className="matrix-options">
        {trial.options.map((option, i) => (
          <button key={i} type="button" className="secondary" onClick={() => choose(i)} aria-label={`Figure ${i + 1}`}>
            <FigureView figure={option} label={`Figure ${i + 1}`} />
            <kbd>{i + 1}</kbd>
          </button>
        ))}
      </div>
    </SessionFrame>
  )
}
