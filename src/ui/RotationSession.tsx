import { useCallback } from 'react'
import { generateTrial, LEVEL_BOUNDS, type Cell, type RotationKind } from '../domains/visuospatial/rotation'
import { ROTATION_KIND_LABELS } from '../domains/visuospatial/labels'
import { parseKeyword } from '../voice/parse'
import { VOICE_ALLOWANCE_MS } from '../voice/useSpeechAnswers'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useKeyboardChoice } from './useKeyboardChoice'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const KEYS: Readonly<Record<string, RotationKind>> = { arrowleft: 'same', f: 'same', arrowright: 'mirror', j: 'mirror' }
const parseVerdict = (text: string) =>
  parseKeyword(text, { same: ['pareil', 'identique', 'meme', 'oui'], mirror: ['miroir', 'inverse', 'different', 'non'] })

/** Draws cells (unit squares) centered on the viewBox origin, rotated by `angle` degrees. */
function Shape({ cells, angle, label }: { cells: readonly Cell[]; angle: number; label: string }) {
  const cx = cells.reduce((s, [x]) => s + x + 0.5, 0) / cells.length
  const cy = cells.reduce((s, [, y]) => s + y + 0.5, 0) / cells.length
  // Radius covering every cell corner whatever the rotation; mirroring keeps it, so both shapes share a scale.
  const radius = Math.max(...cells.flatMap(([x, y]) => [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].map(([px, py]) => Math.hypot(px! - cx, py! - cy)))) + 0.3
  return (
    <svg viewBox={`${-radius} ${-radius} ${2 * radius} ${2 * radius}`} className="rotation-shape" role="img" aria-label={label}>
      <g transform={`rotate(${angle})`}>
        {cells.map(([x, y]) => (
          <rect key={`${x},${y}`} x={x - cx} y={y - cy} width={1} height={1} />
        ))}
      </g>
    </svg>
  )
}

export function RotationSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<RotationKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const timeLimit = useCallback(
    (item: { timeLimitMs: number }) => item.timeLimitMs + (voice ? VOICE_ALLOWANCE_MS : 0),
    [voice],
  )
  const session = useAdaptiveSession({
    domain: 'visuospatial',
    exercise: 'mental-rotation',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: timeLimit,
    timeoutText: (item) => `Trop lent : c’était ${item.kind === 'same' ? 'la même forme' : 'son reflet'}`,
  })
  const trial = session.item

  function choose(kind: RotationKind) {
    session.answer(kind === trial.kind, trial.kind === 'same' ? `Même forme, tournée de ${trial.angle}°` : `Reflet en miroir, tourné de ${trial.angle}°`)
  }

  useKeyboardChoice(KEYS, choose)
  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseVerdict, onAnswer: choose })

  return (
    <SessionFrame
      itemLabel="Paire"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (ROTATION_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction muted">La forme de droite est-elle celle de gauche tournée, ou son reflet dans un miroir ?</p>
      <div className="rotation-pair" data-testid="rotation" data-kind={trial.kind}>
        <Shape cells={trial.cells} angle={0} label="Forme de référence" />
        <Shape cells={trial.rightCells} angle={trial.angle} label="Forme à comparer" />
      </div>
      <div className="choice-grid two">
        <button type="button" className="secondary" onClick={() => choose('same')}>
          Même forme <kbd>←</kbd>
        </button>
        <button type="button" className="secondary" onClick={() => choose('mirror')}>
          Miroir <kbd>→</kbd>
        </button>
      </div>
    </SessionFrame>
  )
}
