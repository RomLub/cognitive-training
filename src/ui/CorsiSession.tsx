import { useCallback, useEffect, useState } from 'react'
import { CORSI_LABELS } from '../domains/memory/labels'
import { BLOCK_POSITIONS, GAP_MS, generateTrial, LEVEL_BOUNDS, type CorsiMode } from '../domains/memory/corsi'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'

const LEAD_MS = 1000

export function CorsiSession({ startLevel, focus, length, onFinish, onQuit }: ExerciseProps<CorsiMode>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.mode }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'memory', exercise: 'corsi', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const { item: trial, restartTimer } = session
  const [lit, setLit] = useState<number | null>(null)
  const [answering, setAnswering] = useState(false)
  const [taps, setTaps] = useState<number[]>([])

  useEffect(() => {
    const step = trial.flashMs + GAP_MS
    const timers = trial.sequence.flatMap((block, i) => [
      setTimeout(() => setLit(block), LEAD_MS + i * step),
      setTimeout(() => setLit(null), LEAD_MS + i * step + trial.flashMs),
    ])
    timers.push(
      setTimeout(() => {
        restartTimer()
        setAnswering(true)
      }, LEAD_MS + trial.sequence.length * step),
    )
    return () => timers.forEach(clearTimeout)
  }, [trial, restartTimer])

  function tap(block: number) {
    if (!answering) return
    const next = [...taps, block]
    if (next.length < trial.answer.length) {
      setTaps(next)
      return
    }
    const correct = next.every((b, i) => b === trial.answer[i])
    session.answer(correct, correct ? 'Séquence exacte' : `Il fallait : ${trial.answer.map((b) => b + 1).join(' → ')}`)
    setTaps([])
    setAnswering(false)
  }

  return (
    <SessionFrame
      itemLabel="Séquence"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (CORSI_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      onQuit={onQuit}
    >
      <p className={`span-mode ${trial.mode}`}>
        {CORSI_LABELS[trial.mode]} · {trial.sequence.length} blocs
        {answering && ` · ${taps.length}/${trial.answer.length}`}
      </p>
      <div className="corsi-board" aria-label="Plateau de blocs">
        {BLOCK_POSITIONS.map(([x, y], i) => (
          <button
            key={i}
            type="button"
            aria-label={`Bloc ${i + 1}`}
            className={`corsi-block ${lit === i ? 'lit' : ''} ${taps.includes(i) ? 'tapped' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            disabled={!answering}
            onClick={() => tap(i)}
          />
        ))}
      </div>
      <p className="muted small center">{answering ? 'Touche les blocs dans l’ordre demandé.' : 'Observe la séquence…'}</p>
    </SessionFrame>
  )
}
