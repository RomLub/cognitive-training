import { useEffect, useRef, useState, type FormEvent } from 'react'
import { initialAdaptiveState, updateAdaptive } from '../core/adaptive'
import { buildSessionRecord } from '../core/session'
import type { ItemResult, SessionRecord } from '../core/types'
import { SPAN_MODE_LABELS } from '../domains/memory/labels'
import {
  DIGIT_MS,
  GAP_MS,
  generateTrial,
  LEVEL_BOUNDS,
  normalizeSpanAnswer,
  SESSION_LENGTH,
  type SpanMode,
  type SpanTrial,
} from '../domains/memory/span'

/** Pause before the first digit so the user can read the instruction. */
export const LEAD_MS = 1000

interface Props {
  startLevel: number
  /** Weak mode to practise more, or null for an even mix. */
  focus: SpanMode | null
  onFinish: (record: SessionRecord) => void
  onQuit: () => void
}

interface Feedback {
  correct: boolean
  text: string
}

export function MemorySession({ startLevel, focus, onFinish, onQuit }: Props) {
  const [adaptive, setAdaptive] = useState(() => initialAdaptiveState(startLevel, LEVEL_BOUNDS))
  const [trial, setTrial] = useState<SpanTrial>(() => generateTrial(adaptive.level, Math.random, focus))
  const [visibleDigit, setVisibleDigit] = useState<number | null>(null)
  const [answering, setAnswering] = useState(false)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ItemResult[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [startedAt] = useState(() => new Date())
  const answerShownAt = useRef(0)

  // Plays the sequence one digit at a time, then opens the answer field.
  useEffect(() => {
    const step = DIGIT_MS + GAP_MS
    const timers = trial.digits.flatMap((digit, i) => [
      setTimeout(() => setVisibleDigit(digit), LEAD_MS + i * step),
      setTimeout(() => setVisibleDigit(null), LEAD_MS + i * step + DIGIT_MS),
    ])
    timers.push(
      setTimeout(() => {
        answerShownAt.current = performance.now()
        setAnswering(true)
      }, LEAD_MS + trial.digits.length * step),
    )
    return () => timers.forEach(clearTimeout)
  }, [trial])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const answer = normalizeSpanAnswer(input)
    if (answer === null) return

    const correct = answer === trial.answer
    const result: ItemResult = {
      level: trial.level,
      category: trial.mode,
      correct,
      responseMs: Math.round(performance.now() - answerShownAt.current),
    }
    const nextResults = [...results, result]
    const nextAdaptive = updateAdaptive(adaptive, correct, LEVEL_BOUNDS)

    if (nextResults.length >= SESSION_LENGTH) {
      onFinish(
        buildSessionRecord({
          id: crypto.randomUUID(),
          domain: 'memory',
          startedAt,
          startLevel: initialAdaptiveState(startLevel, LEVEL_BOUNDS).level,
          endLevel: nextAdaptive.level,
          results: nextResults,
        }),
      )
      return
    }

    setFeedback({ correct, text: `Attendu : ${trial.answer.split('').join(' ')}` })
    setResults(nextResults)
    setAdaptive(nextAdaptive)
    setTrial(generateTrial(nextAdaptive.level, Math.random, focus))
    setAnswering(false)
    setVisibleDigit(null)
    setInput('')
  }

  return (
    <section className="session">
      <header className="session-header">
        <span>
          Séquence {results.length + 1}/{SESSION_LENGTH}
        </span>
        <span>Niveau {adaptive.level}</span>
        {focus !== null && <span className="focus">Focus : {SPAN_MODE_LABELS[focus]}</span>}
        <button type="button" className="link" onClick={onQuit}>
          Abandonner
        </button>
      </header>

      <progress max={SESSION_LENGTH} value={results.length} />

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

      <p className={`feedback ${feedback === null ? '' : feedback.correct ? 'ok' : 'ko'}`}>
        {feedback === null ? ' ' : `${feedback.correct ? '✓' : '✗'} ${feedback.text}`}
      </p>
    </section>
  )
}
