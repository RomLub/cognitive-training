import { useCallback } from 'react'
import { GO_KIND_LABELS } from '../domains/attention/labels'
import { generateTrial, intervalMs, LEVEL_BOUNDS, NOGO_DIGIT, type GoKind } from '../domains/attention/goNoGo'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useKeyboardChoice } from './useKeyboardChoice'

const KEYS = { ' ': 'press', j: 'press' } as const

/** No voice: the pace is faster than speech recognition. */
export function GoNoGoSession({ startLevel, focus, length, onFinish, onQuit }: ExerciseProps<GoKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({
    domain: 'attention',
    exercise: 'go-no-go',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: (item) => intervalMs(item.level),
    // Not pressing is the right answer on a no-go trial.
    onTimeout: (item) => (item.kind === 'nogo' ? { correct: true, text: `Bien retenu sur le ${NOGO_DIGIT}` } : { correct: false, text: 'Trop lent' }),
  })
  const trial = session.item

  function press() {
    if (trial.kind === 'go') session.answer(true, 'OK')
    else session.answer(false, `Pas sur le ${NOGO_DIGIT} !`)
  }

  useKeyboardChoice(KEYS, press)

  return (
    <SessionFrame
      itemLabel="Chiffre"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (GO_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
    >
      <p className="instruction muted">Appuie pour chaque chiffre, sauf le {NOGO_DIGIT}.</p>
      <p className="problem gonogo" data-testid="gonogo-digit" key={session.index}>
        {trial.digit}
      </p>
      <div className="choice-grid">
        <button type="button" onClick={press}>
          Appuyer <kbd>Espace</kbd>
        </button>
      </div>
    </SessionFrame>
  )
}
