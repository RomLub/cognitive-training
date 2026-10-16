import { useCallback, useState } from 'react'
import { CAPACITIES, EXTRA_MOVES_ALLOWED, generateTrial, LEVEL_BOUNDS, move, sameState, towerTimeLimitMs, type Ball, type TowerState } from '../domains/executive/tower'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'

/** Letters on the balls so colors are never the only cue. */
const BALL_LETTER: Record<Ball, string> = { red: 'R', green: 'V', blue: 'B' }

function Pegs({ state, selected, onPeg, small = false }: { state: TowerState; selected?: number | null; onPeg?: (peg: number) => void; small?: boolean }) {
  return (
    <div className={`tower ${small ? 'small' : ''}`}>
      {state.map((peg, i) => {
        const content = (
          <>
            {Array.from({ length: CAPACITIES[i as 0 | 1 | 2] }, (_, slot) => {
              const ball = peg[slot]
              return (
                <span key={slot} className={`tower-slot ${ball === undefined ? '' : `ball ball-${ball}`}`}>
                  {ball === undefined ? '' : BALL_LETTER[ball]}
                </span>
              )
            })}
          </>
        )
        return onPeg === undefined ? (
          <div key={i} className="tower-peg">
            {content}
          </div>
        ) : (
          <button
            key={i}
            type="button"
            aria-label={`Tige ${i + 1}`}
            className={`tower-peg ${selected === i ? 'selected' : ''}`}
            onClick={() => onPeg(i)}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}

export function TowerSession({ startLevel, length, onFinish, onQuit }: ExerciseProps<'plan'>) {
  const generate = useCallback((level: number) => ({ ...generateTrial(level), category: 'plan' }), [])
  const session = useAdaptiveSession({
    domain: 'executive',
    exercise: 'tower-of-london',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: (item) => towerTimeLimitMs(item.level),
    timeoutText: (item) => `Temps écoulé : le minimum était ${item.minMoves} coups`,
  })
  const trial = session.item
  const [state, setState] = useState<TowerState>(trial.start)
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [shownFor, setShownFor] = useState(trial)

  // New problem: reset the board (state derived from the item, without an effect).
  if (shownFor !== trial) {
    setShownFor(trial)
    setState(trial.start)
    setSelected(null)
    setMoves(0)
  }

  function onPeg(peg: number) {
    if (selected === null) {
      if (state[peg]!.length > 0) setSelected(peg)
      return
    }
    const next = move(state, selected, peg)
    setSelected(null)
    if (next === null) return
    const count = moves + 1
    setState(next)
    setMoves(count)
    if (sameState(next, trial.goal)) {
      session.answer(count === trial.minMoves, count === trial.minMoves ? `Parfait : ${count} coups` : `Résolu en ${count} coups (minimum ${trial.minMoves})`)
    } else if (count >= trial.minMoves + EXTRA_MOVES_ALLOWED) {
      session.answer(false, `Trop de coups : le minimum était ${trial.minMoves}`)
    }
  }

  return (
    <SessionFrame
      itemLabel="Problème"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={null}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
    >
      <p className="instruction">
        Reproduis le modèle en <strong>{trial.minMoves} coups</strong> · coups joués : {moves}
      </p>
      <div className="tower-layout">
        <div>
          <p className="muted small center">Modèle</p>
          <Pegs state={trial.goal} small />
        </div>
        <div>
          <p className="muted small center">Ton plateau : clique une tige pour prendre la boule du dessus, puis une autre pour la poser</p>
          <Pegs state={state} selected={selected} onPeg={onPeg} />
        </div>
      </div>
    </SessionFrame>
  )
}
