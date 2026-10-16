import { useCallback } from 'react'
import { formatProblem, generateProblem } from '../domains/calculation/generator'
import { OPERATOR_LABELS } from '../domains/calculation/labels'
import { LEVEL_BOUNDS, type Operator } from '../domains/calculation/levels'
import { parseFrenchNumber } from '../voice/parse'
import { NumericKeypad } from './NumericKeypad'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'
import { useAdaptiveSession } from './useAdaptiveSession'

export function CalculationSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<Operator>) {
  const generate = useCallback((level: number) => {
    const p = generateProblem(level, Math.random, focus)
    return { ...p, category: p.operator }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'calculation', exercise: 'arithmetic', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const problem = session.item

  function submit(value: number) {
    session.answer(value === problem.answer, `${formatProblem(problem)} = ${problem.answer}`)
  }

  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseFrenchNumber, onAnswer: submit })


  return (
    <SessionFrame
      itemLabel="Question"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : OPERATOR_LABELS[focus]}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="problem" aria-live="polite">
        {formatProblem(problem)}
      </p>

      <NumericKeypad expectedLength={String(problem.answer).length} onSubmit={(v) => submit(Number(v))} resetKey={session.index} />
    </SessionFrame>
  )
}
