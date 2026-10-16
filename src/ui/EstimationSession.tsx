import { useCallback, useEffect, useRef } from 'react'
import { formatOption, generateTrial, LEVEL_BOUNDS, timeLimitMs, type EstimationKind } from '../domains/calculation/estimation'
import { ESTIMATION_KIND_LABELS } from '../domains/calculation/labels'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'

/** Multiple choice under a deadline (keys 1-4). No voice: reading big numbers aloud is slower than clicking. */
export function EstimationSession({ startLevel, focus, length, onFinish, onQuit }: ExerciseProps<EstimationKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({
    domain: 'calculation',
    exercise: 'estimation',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: (item) => timeLimitMs(item.level),
    timeoutText: (item) => `Trop lent : ≈ ${formatOption(item.options[item.answerIndex]!)}`,
  })
  const trial = session.item

  function choose(index: number) {
    const correct = index === trial.answerIndex
    session.answer(correct, `${trial.prompt} ≈ ${formatOption(trial.options[trial.answerIndex]!)} (exact : ${formatOption(trial.exact)})`)
  }

  const chooseRef = useRef(choose)
  useEffect(() => {
    chooseRef.current = choose
  })
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const n = Number.parseInt(event.key, 10)
      if (n >= 1 && n <= 4) chooseRef.current(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SessionFrame
      itemLabel="Estimation"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (ESTIMATION_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
    >
      <p className="instruction muted">Quelle valeur est la plus proche ?</p>
      <p className="problem estimation" aria-live="polite" data-testid="estimation-prompt">
        {trial.prompt}
      </p>
      <div className="choice-grid">
        {trial.options.map((option, i) => (
          <button key={option} type="button" className="secondary" data-option={i} onClick={() => choose(i)}>
            {formatOption(option)} <kbd>{i + 1}</kbd>
          </button>
        ))}
      </div>
    </SessionFrame>
  )
}
