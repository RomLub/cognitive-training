import { useCallback } from 'react'
import { PRACTICAL_KIND_LABELS } from '../domains/calculation/labels'
import { generateTrial, LEVEL_BOUNDS, type PracticalKind } from '../domains/calculation/practical'
import { parseFrenchNumber } from '../voice/parse'
import { NumericKeypad } from './NumericKeypad'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

export function PracticalSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<PracticalKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'calculation', exercise: 'practical', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const trial = session.item

  function submit(value: number) {
    session.answer(value === trial.answer, `${trial.prompt} → ${trial.answer}${trial.unit === '' ? '' : ` ${trial.unit}`}`)
  }

  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseFrenchNumber, onAnswer: submit })

  return (
    <SessionFrame
      itemLabel="Question"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (PRACTICAL_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="problem practical" aria-live="polite">
        {trial.prompt}
      </p>
      <NumericKeypad
        expectedLength={String(trial.answer).length}
        onSubmit={(v) => submit(Number(v))}
        resetKey={session.index}
        suffix={trial.unit === '' ? undefined : trial.unit}
      />
    </SessionFrame>
  )
}
