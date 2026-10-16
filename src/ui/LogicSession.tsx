import { useCallback } from 'react'
import { SERIES_RULE_LABELS } from '../domains/logic/labels'
import { generateTrial, LEVEL_BOUNDS, type SeriesRule } from '../domains/logic/series'
import { parseFrenchNumber } from '../voice/parse'
import { NumericKeypad } from './NumericKeypad'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

export function LogicSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<SeriesRule>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.rule }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'logic', exercise: 'number-series', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const trial = session.item

  function submit(value: number) {
    session.answer(value === trial.answer, `${trial.answer} — ${trial.explanation}`)
  }

  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseFrenchNumber, onAnswer: submit })


  return (
    <SessionFrame
      itemLabel="Suite"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : SERIES_RULE_LABELS[focus]}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction muted">Quel est le nombre suivant ?</p>
      <p className="problem series" aria-live="polite">
        {trial.terms.join(', ')}, ?
      </p>

      <NumericKeypad expectedLength={String(trial.answer).length} onSubmit={(v) => submit(Number(v))} resetKey={session.index} />
    </SessionFrame>
  )
}
