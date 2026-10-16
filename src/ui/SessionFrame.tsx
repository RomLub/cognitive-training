import { useContext, useEffect, type ReactNode } from 'react'
import type { SessionRecord } from '../core/types'
import { Mascot } from './Mascot'
import { sounds } from './sound'
import { SoundContext } from './soundContext'
import type { Feedback } from './useAdaptiveSession'

/** Props shared by every exercise session component. */
export interface ExerciseProps<F extends string> {
  startLevel: number
  /** Weak category to practise more, or null for an even mix. */
  focus: F | null
  /** Items in this session (shorter inside programs). */
  length: number
  /** Answer by voice when the browser supports it. */
  voice: boolean
  onFinish: (record: SessionRecord) => void
  onQuit: () => void
}

interface Props {
  itemLabel: string
  index: number
  length: number
  level: number
  focusLabel: string | null
  feedback: Feedback | null
  /** Deadline of the current item; renders a shrinking bar. */
  timeLimit?: number | null
  onQuit: () => void
  /** Slot for the voice status. */
  status?: ReactNode
  children: ReactNode
}

const PRAISE = ['Bien joué !', 'Excellent !', 'Parfait !', 'Bravo !', 'Tu gères !', 'Impeccable !']
const NUDGE = ['Pas tout à fait', 'Presque !', 'Raté de peu', 'On continue !']

/** Title of the feedback pill; varies with the item so it does not repeat word for word. */
function feedbackTitle(feedback: Feedback, index: number): string {
  if (!feedback.correct) return NUDGE[index % NUDGE.length]!
  if (feedback.combo >= 5) return `Série de ${feedback.combo} !`
  return PRAISE[index % PRAISE.length]!
}

export function SessionFrame({ itemLabel, index, length, level, focusLabel, feedback, timeLimit = null, onQuit, status, children }: Props) {
  const soundOn = useContext(SoundContext)
  const combo = feedback?.combo ?? 0

  useEffect(() => {
    if (feedback === null || !soundOn) return
    if (feedback.correct) sounds.correct()
    else sounds.wrong()
  }, [feedback, soundOn])

  return (
    <section className="session">
      <header className="session-top">
        <button type="button" className="quit" aria-label="Abandonner" onClick={onQuit}>
          ✕
        </button>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Progression"
          aria-valuemin={0}
          aria-valuemax={length}
          aria-valuenow={index}
        >
          <div className="progress-fill" style={{ width: `${(index / length) * 100}%` }} />
        </div>
        {combo >= 2 && (
          <span className="combo" key={combo} title="Bonnes réponses d’affilée">
            🔥 {combo}
          </span>
        )}
      </header>

      <p className="session-meta">
        <span>
          {itemLabel} {index + 1}/{length}
        </span>
        <span>Niveau {level}</span>
        {focusLabel !== null && <span className="focus">Focus : {focusLabel}</span>}
      </p>

      {timeLimit !== null && (
        // Keyed on the item index so the animation restarts for each item.
        <div className="timer-track" aria-hidden="true">
          <div key={index} className="timer-bar" style={{ animationDuration: `${timeLimit}ms` }} />
        </div>
      )}

      <div className="feedback-slot">
        {feedback !== null && (
          <div
            key={index}
            data-testid="feedback"
            data-result={feedback.correct ? 'ok' : 'ko'}
            className={`feedback ${feedback.correct ? 'ok' : 'ko'}`}
            role="status"
          >
            <Mascot mood={feedback.correct ? (combo >= 5 ? 'celebrate' : 'happy') : 'sad'} size={36} />
            <span className="feedback-text">
              <strong>{feedbackTitle(feedback, index)}</strong> <span>{feedback.text}</span>
            </span>
          </div>
        )}
      </div>

      <div className="session-stage">{children}</div>

      {status}
    </section>
  )
}
