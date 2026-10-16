import { useCallback, useEffect, useRef, useState } from 'react'
import { initialAdaptiveState, updateAdaptive, type LevelBounds } from '../core/adaptive'
import { buildSessionRecord } from '../core/session'
import type { CognitiveDomain, ItemResult, SessionRecord } from '../core/types'

/** Minimal shape every exercise item must have. */
export interface SessionItem {
  level: number
  category: string
}

export interface Feedback {
  correct: boolean
  text: string
  /** Consecutive correct answers including this one (0 after a mistake). */
  combo: number
}

interface Options<T extends SessionItem> {
  domain: CognitiveDomain
  /** Exercise id stored on the session record. */
  exercise: string
  bounds: LevelBounds
  length: number
  startLevel: number
  generate: (level: number) => T
  onFinish: (record: SessionRecord) => void
  /** Optional per-item deadline; when it expires the item counts as wrong unless `onTimeout` says otherwise. */
  timeLimitMs?: (item: T) => number | null
  /** Feedback shown when the deadline expires. */
  timeoutText?: (item: T) => string
  /** Outcome of an expired deadline, for exercises where not answering can be right (Go/No-Go). */
  onTimeout?: (item: T) => { correct: boolean; text: string }
}

export interface AdaptiveSession<T extends SessionItem> {
  item: T
  level: number
  /** Number of items already answered. */
  index: number
  length: number
  feedback: Feedback | null
  /** Active deadline for the current item, for display. */
  timeLimit: number | null
  answer: (correct: boolean, feedbackText: string) => void
  /** Restarts the response timer, e.g. once a memory sequence has finished playing. */
  restartTimer: () => void
}

/**
 * Shared session engine: adaptive level, response timing, optional deadline, feedback and session record.
 * Each exercise only renders its item and calls `answer`.
 */
export function useAdaptiveSession<T extends SessionItem>(options: Options<T>): AdaptiveSession<T> {
  const { domain, exercise, bounds, length, startLevel, generate, onFinish, timeLimitMs, timeoutText, onTimeout } = options
  const [adaptive, setAdaptive] = useState(() => initialAdaptiveState(startLevel, bounds))
  const [item, setItem] = useState<T>(() => generate(initialAdaptiveState(startLevel, bounds).level))
  const [results, setResults] = useState<ItemResult[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [startedAt] = useState(() => new Date())
  const shownAt = useRef(0)
  const answeredItem = useRef<T | null>(null)
  const timeLimit = timeLimitMs?.(item) ?? null

  const answer = useCallback(
    (correct: boolean, feedbackText: string) => {
      // Guards against a double answer (e.g. a click racing the deadline).
      if (answeredItem.current === item) return
      answeredItem.current = item

      const result: ItemResult = {
        level: item.level,
        category: item.category,
        correct,
        responseMs: Math.round(performance.now() - shownAt.current),
      }
      const nextResults = [...results, result]
      const nextAdaptive = updateAdaptive(adaptive, correct, bounds)

      if (nextResults.length >= length) {
        onFinish(
          buildSessionRecord({
            id: crypto.randomUUID(),
            domain,
            exercise,
            startedAt,
            startLevel: initialAdaptiveState(startLevel, bounds).level,
            endLevel: nextAdaptive.level,
            results: nextResults,
          }),
        )
        return
      }

      setFeedback({ correct, text: feedbackText, combo: correct ? (feedback?.combo ?? 0) + 1 : 0 })
      setResults(nextResults)
      setAdaptive(nextAdaptive)
      setItem(generate(nextAdaptive.level))
    },
    [item, results, adaptive, bounds, length, onFinish, domain, exercise, startedAt, startLevel, generate, feedback],
  )

  // Latest `answer` for the deadline timer, which must not restart on unrelated re-renders.
  const answerRef = useRef(answer)
  useEffect(() => {
    answerRef.current = answer
  })

  const restartTimer = useCallback(() => {
    shownAt.current = performance.now()
  }, [])

  useEffect(() => {
    shownAt.current = performance.now()
    if (timeLimit === null) return
    const timer = setTimeout(() => {
      const outcome = onTimeout?.(item) ?? { correct: false, text: timeoutText?.(item) ?? 'Temps écoulé' }
      answerRef.current(outcome.correct, outcome.text)
    }, timeLimit)
    return () => clearTimeout(timer)
    // Only a new item (re)starts the deadline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item])

  return { item, level: adaptive.level, index: results.length, length, feedback, timeLimit, answer, restartTimer }
}
