import { useEffect, useState } from 'react'
import { formatClock } from './format'
import { Mascot } from './Mascot'
import type { Review } from './useDeliberate'

/** Shared pieces of the "Réflexion" exercises: thinking time, scratchpad and correction panel. */

/** Thinking time so far, as a gentle indication (never a limit). Freezes once answered. */
export function Elapsed({ stopped }: { stopped: boolean }) {
  // Keyed on the item by the caller, so it restarts from zero for each problem.
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(start)
  useEffect(() => {
    if (stopped) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [stopped])
  return (
    <p className="elapsed muted" aria-label="Temps de réflexion">
      ⏳ {formatClock(now - start)}
    </p>
  )
}

/** Free notes for the current problem; paper works just as well. */
export function Scratchpad({ itemKey }: { itemKey: number }) {
  return (
    <details className="scratchpad">
      <summary>✏️ Brouillon</summary>
      <textarea key={itemKey} aria-label="Brouillon" rows={5} placeholder="Note tes pistes ici, ou prends une feuille." />
    </details>
  )
}

export function ReviewPanel({ review, last, onNext }: { review: Review; last: boolean; onNext: () => void }) {
  return (
    <div className={`review ${review.correct ? 'ok' : 'ko'}`} role="status" data-testid="review" data-result={review.correct ? 'ok' : 'ko'}>
      <div className="review-head">
        <Mascot mood={review.correct ? 'celebrate' : 'sad'} size={44} />
        <strong>{review.correct ? 'Bien raisonné !' : 'Pas tout à fait'}</strong>
      </div>
      <div className="review-details">{review.details}</div>
      <button type="button" className="big" onClick={onNext} autoFocus>
        {last ? 'Voir le bilan' : 'Problème suivant'}
      </button>
    </div>
  )
}
