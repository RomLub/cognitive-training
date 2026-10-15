import { useEffect, useRef, useState, type FormEvent } from 'react'
import { initialAdaptiveState, updateAdaptive } from '../core/adaptive'
import { buildSessionRecord } from '../core/session'
import type { ItemResult, SessionRecord } from '../core/types'
import { formatProblem, generateProblem, type Problem } from '../domains/calculation/generator'
import { OPERATOR_LABELS } from '../domains/calculation/labels'
import { LEVEL_BOUNDS, type Operator } from '../domains/calculation/levels'
import { parseAnswer, SESSION_LENGTH } from '../domains/calculation/session'

interface Props {
  startLevel: number
  /** Weak operator to practise more, or null for a uniform mix. */
  focus: Operator | null
  onFinish: (record: SessionRecord) => void
  onQuit: () => void
}

interface Feedback {
  correct: boolean
  text: string
}

export function CalculationSession({ startLevel, focus, onFinish, onQuit }: Props) {
  const [adaptive, setAdaptive] = useState(() => initialAdaptiveState(startLevel, LEVEL_BOUNDS))
  const [problem, setProblem] = useState<Problem>(() => generateProblem(adaptive.level, Math.random, focus))
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ItemResult[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [startedAt] = useState(() => new Date())
  const shownAt = useRef(0)

  // Restart the response timer whenever a new problem is displayed.
  useEffect(() => {
    shownAt.current = performance.now()
  }, [problem])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const answer = parseAnswer(input)
    if (answer === null) return

    const correct = answer === problem.answer
    const result: ItemResult = {
      level: problem.level,
      category: problem.operator,
      correct,
      responseMs: Math.round(performance.now() - shownAt.current),
    }
    const nextResults = [...results, result]
    const nextAdaptive = updateAdaptive(adaptive, correct, LEVEL_BOUNDS)

    if (nextResults.length >= SESSION_LENGTH) {
      onFinish(
        buildSessionRecord({
          id: crypto.randomUUID(),
          domain: 'calculation',
          startedAt,
          startLevel: initialAdaptiveState(startLevel, LEVEL_BOUNDS).level,
          endLevel: nextAdaptive.level,
          results: nextResults,
        }),
      )
      return
    }

    setFeedback({ correct, text: `${formatProblem(problem)} = ${problem.answer}` })
    setResults(nextResults)
    setAdaptive(nextAdaptive)
    setProblem(generateProblem(nextAdaptive.level, Math.random, focus))
    setInput('')
  }

  return (
    <section className="session">
      <header className="session-header">
        <span>
          Question {results.length + 1}/{SESSION_LENGTH}
        </span>
        <span>Niveau {adaptive.level}</span>
        {focus !== null && <span className="focus">Focus : {OPERATOR_LABELS[focus]}</span>}
        <button type="button" className="link" onClick={onQuit}>
          Abandonner
        </button>
      </header>

      <progress max={SESSION_LENGTH} value={results.length} />

      <p className="problem" aria-live="polite">
        {formatProblem(problem)}
      </p>

      <form onSubmit={handleSubmit} className="answer-form">
        <input
          autoFocus
          aria-label="Réponse"
          inputMode="numeric"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={parseAnswer(input) === null}>
          Valider
        </button>
      </form>

      <p className={`feedback ${feedback === null ? '' : feedback.correct ? 'ok' : 'ko'}`}>
        {feedback === null ? ' ' : `${feedback.correct ? '✓' : '✗'} ${feedback.text}`}
      </p>
    </section>
  )
}
