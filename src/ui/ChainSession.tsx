import { useCallback, useEffect, useState } from 'react'
import { formatStep, generateTrial, LEVEL_BOUNDS, type ChainKind } from '../domains/calculation/chain'
import { CHAIN_KIND_LABELS } from '../domains/calculation/labels'
import { parseFrenchNumber } from '../voice/parse'
import { NumberAnswerForm } from './NumberAnswerForm'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const GAP_MS = 200

export function ChainSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<ChainKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'calculation', exercise: 'chain', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const { item: trial, restartTimer } = session
  // Index of the element shown: -1 = start number, 0..n-1 = steps, null = gap.
  const [shown, setShown] = useState<number | null>(null)
  const [answering, setAnswering] = useState(false)

  useEffect(() => {
    const slot = trial.stepMs + GAP_MS
    const timers = [-1, ...trial.steps.keys()].flatMap((index, i) => [
      setTimeout(() => setShown(index), 600 + i * slot),
      setTimeout(() => setShown(null), 600 + i * slot + trial.stepMs),
    ])
    timers.push(
      setTimeout(() => {
        restartTimer()
        setAnswering(true)
      }, 600 + (trial.steps.length + 1) * slot),
    )
    return () => timers.forEach(clearTimeout)
  }, [trial, restartTimer])

  function submit(value: number) {
    const replay = [String(trial.start), ...trial.steps.map(formatStep)].join(' ')
    session.answer(value === trial.answer, `${replay} = ${trial.answer}`)
    setAnswering(false)
    setShown(null)
  }

  const voiceState = useVoiceAnswer({ enabled: voice && answering, parse: parseFrenchNumber, onAnswer: submit })

  const display = shown === null ? ' ' : shown === -1 ? String(trial.start) : formatStep(trial.steps[shown]!)

  return (
    <SessionFrame
      itemLabel="Chaîne"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (CHAIN_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction muted">
        {answering ? 'Quel est le résultat ?' : `Garde le total en tête · ${trial.steps.length} opérations`}
      </p>
      {answering ? (
        <NumberAnswerForm key={session.index} onSubmit={submit} />
      ) : (
        <p className="problem" aria-live="polite" data-testid="chain-display">
          {display}
        </p>
      )}
    </SessionFrame>
  )
}
