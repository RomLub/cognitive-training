import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { sounds } from './sound'
import { SoundContext } from './soundContext'
import type { AdaptiveSession, SessionItem } from './useAdaptiveSession'

/**
 * Shared pieces of the "Réflexion" exercises: no deadline, a scratchpad, and a correction to read
 * before moving on. The response time recorded is the thinking time, not the reading of the correction.
 */
export interface Review {
  correct: boolean
  /** One-line summary kept in the session feedback. */
  summary: string
  details: ReactNode
  responseMs: number
}

export function useDeliberate<T extends SessionItem>(session: AdaptiveSession<T>) {
  const soundOn = useContext(SoundContext)
  const [review, setReview] = useState<Review | null>(null)
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [session.index])

  function submit(correct: boolean, summary: string, details: ReactNode) {
    if (review !== null) return
    if (soundOn) {
      if (correct) sounds.correct()
      else sounds.wrong()
    }
    setReview({ correct, summary, details, responseMs: performance.now() - shownAt.current })
  }

  function next() {
    if (review === null) return
    setReview(null)
    session.answer(review.correct, review.summary, review.responseMs)
  }

  return { review, submit, next }
}
