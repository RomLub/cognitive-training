import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { SPAN_MODE_LABELS } from '../domains/memory/labels'
import { DIGIT_MS, GAP_MS, generateTrial, LEVEL_BOUNDS, normalizeSpanAnswer, type SpanMode } from '../domains/memory/span'
import { parseDigitSequence } from '../voice/parse'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'
import { useAdaptiveSession } from './useAdaptiveSession'

/** Pause before the first digit so the user can read the instruction. */
export const LEAD_MS = 1000

export function MemorySession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<SpanMode>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.mode }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'memory', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const { item: trial, restartTimer } = session
  const [visibleDigit, setVisibleDigit] = useState<number | null>(null)
  const [answering, setAnswering] = useState(false)
  const [input, setInput] = useState('')

  // Plays the sequence one digit at a time, then opens the answer field.
  useEffect(() => {
    const step = DIGIT_MS + GAP_MS
    const timers = trial.digits.flatMap((digit, i) => [
      setTimeout(() => setVisibleDigit(digit), LEAD_MS + i * step),
      setTimeout(() => setVisibleDigit(null), LEAD_MS + i * step + DIGIT_MS),
    ])
    timers.push(
      setTimeout(() => {
        restartTimer()
        setAnswering(true)
      }, LEAD_MS + trial.digits.length * step),
    )
    return () => timers.forEach(clearTimeout)
  }, [trial, restartTimer])

  function submit(answer: string) {
    session.answer(answer === trial.answer, `Attendu : ${trial.answer.split('').join(' ')}`)
    setAnswering(false)
    setVisibleDigit(null)
    setInput('')
  }

  const voiceState = useVoiceAnswer({ enabled: voice && answering, parse: parseDigitSequence, onAnswer: submit })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const answer = normalizeSpanAnswer(input)
    if (answer !== null) submit(answer)
  }

  return (
    <SessionFrame
      itemLabel="Séquence"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : SPAN_MODE_LABELS[focus]}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className={`span-mode ${trial.mode}`}>
        {SPAN_MODE_LABELS[trial.mode]} · {trial.digits.length} chiffres
      </p>

      {answering ? (
        <form onSubmit={handleSubmit} className="answer-form">
          <input
            autoFocus
            aria-label="Réponse"
            inputMode="numeric"
            autoComplete="off"
            placeholder={trial.mode === 'forward' ? 'dans l’ordre' : 'à l’envers'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={normalizeSpanAnswer(input) === null}>
            Valider
          </button>
        </form>
      ) : (
        <p className="problem digit" aria-live="polite" data-testid="digit">
          {visibleDigit ?? ' '}
        </p>
      )}
    </SessionFrame>
  )
}
