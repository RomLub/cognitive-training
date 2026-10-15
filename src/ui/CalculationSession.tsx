import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ItemResult, SessionRecord } from '../core/types'
import { initialAdaptiveState, updateAdaptive } from '../domains/calculation/adaptive'
import { formatProblem, generateProblem, type Problem } from '../domains/calculation/generator'
import { buildSessionRecord, parseAnswer, SESSION_LENGTH } from '../domains/calculation/session'

interface Props {
  startLevel: number
  onFinish: (record: SessionRecord) => void
  onQuit: () => void
}

interface Feedback {
  correct: boolean
  text: string
}

export function CalculationSession({ startLevel, onFinish, onQuit }: Props) {
  const [adaptive, setAdaptive] = useState(() => initialAdaptiveState(startLevel))
  const [problem, setProblem] = useState<Problem>(() => generateProblem(adaptive.level))
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
    const nextAdaptive = updateAdaptive(adaptive, correct)

    if (nextResults.length >= SESSION_LENGTH) {
      onFinish(
        buildSessionRecord({
          id: crypto.randomUUID(),
          startedAt,
          startLevel: initialAdaptiveState(startLevel).level,
          endLevel: nextAdaptive.level,
          results: nextResults,
        }),
      )
      return
    }

    setFeedback({ correct, text: `${formatProblem(problem)} = ${problem.answer}` })
    setResults(nextResults)
    setAdaptive(nextAdaptive)
    setProblem(generateProblem(nextAdaptive.level))
    setInput('')
  }

  return (
    <section className="session">
      <header className="session-header">
        <span>
          Question {results.length + 1}/{SESSION_LENGTH}
        </span>
        <span>Niveau {adaptive.level}</span>
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
