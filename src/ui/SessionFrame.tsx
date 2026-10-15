import type { ReactNode } from 'react'
import type { SessionRecord } from '../core/types'
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

export function SessionFrame({ itemLabel, index, length, level, focusLabel, feedback, timeLimit = null, onQuit, status, children }: Props) {
  return (
    <section className="session">
      <header className="session-header">
        <span>
          {itemLabel} {index + 1}/{length}
        </span>
        <span>Niveau {level}</span>
        {focusLabel !== null && <span className="focus">Focus : {focusLabel}</span>}
        <button type="button" className="link" onClick={onQuit}>
          Abandonner
        </button>
      </header>

      <progress max={length} value={index} />

      {timeLimit !== null && (
        // Keyed on the item index so the animation restarts for each item.
        <div className="timer-track" aria-hidden="true">
          <div key={index} className="timer-bar" style={{ animationDuration: `${timeLimit}ms` }} />
        </div>
      )}

      {children}

      {status}

      <p className={`feedback ${feedback === null ? '' : feedback.correct ? 'ok' : 'ko'}`}>
        {feedback === null ? ' ' : `${feedback.correct ? '✓' : '✗'} ${feedback.text}`}
      </p>
    </section>
  )
}
