import { useCallback, useRef, useState } from 'react'
import { TRAIL_KIND_LABELS } from '../domains/executive/labels'
import { generateTrial, LEVEL_BOUNDS, type TrailKind } from '../domains/executive/trail'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'

export function TrailSession({ startLevel, focus, length, onFinish, onQuit }: ExerciseProps<TrailKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({
    domain: 'executive',
    exercise: 'trail-making',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: (item) => item.timeLimitMs,
    timeoutText: () => 'Temps écoulé',
  })
  const trial = session.item
  const [next, setNext] = useState(0)
  const [errors, setErrors] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [shownFor, setShownFor] = useState(trial)

  // New trail (finished or timed out): reset progress, derived from the item without an effect.
  if (shownFor !== trial) {
    setShownFor(trial)
    setNext(0)
    setErrors(0)
    setWrong(null)
  }

  // Source of truth for clicks: updated synchronously, so two clicks before a re-render are judged correctly.
  const progress = useRef({ trial, next: 0, errors: 0 })

  function click(index: number) {
    if (progress.current.trial !== trial) progress.current = { trial, next: 0, errors: 0 }
    const p = progress.current
    if (index < p.next) return
    if (index !== p.next) {
      p.errors += 1
      setErrors(p.errors)
      setWrong(index)
      return
    }
    setWrong(null)
    if (index < trial.nodes.length - 1) {
      p.next = index + 1
      setNext(p.next)
      return
    }
    session.answer(p.errors === 0, p.errors === 0 ? 'Parcours sans faute' : `Parcours terminé avec ${p.errors} erreur${p.errors > 1 ? 's' : ''}`)
  }

  const done = trial.nodes.slice(0, next)

  return (
    <SessionFrame
      itemLabel="Parcours"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (TRAIL_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
    >
      <p className="instruction">
        {trial.kind === 'numbers' ? 'Relie 1 → 2 → 3…' : 'Alterne chiffres et lettres : 1 → A → 2 → B…'} · prochain :{' '}
        <strong>{trial.nodes[next]?.label}</strong>
        {errors > 0 && <span className="ko"> · {errors} erreur{errors > 1 ? 's' : ''}</span>}
      </p>
      <div className="trail-board" key={session.index}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {done.slice(1).map((node, i) => (
            <line key={node.label} x1={done[i]!.x} y1={done[i]!.y} x2={node.x} y2={node.y} />
          ))}
        </svg>
        {trial.nodes.map((node, i) => (
          <button
            key={node.label}
            type="button"
            className={`trail-node ${i < next ? 'done' : ''} ${wrong === i ? 'wrong' : ''}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            onClick={() => click(i)}
          >
            {node.label}
          </button>
        ))}
      </div>
    </SessionFrame>
  )
}
