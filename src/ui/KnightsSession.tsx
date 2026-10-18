import { useCallback, useState } from 'react'
import { generatePuzzle, LEVEL_BOUNDS, typeLabel, type KnightKind } from '../domains/reflection/knights'
import { KNIGHT_KIND_LABELS } from '../domains/reflection/labels'
import { Elapsed, ReviewPanel, Scratchpad } from './Deliberate'
import { useDeliberate } from './useDeliberate'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'

export function KnightsSession({ startLevel, focus, length, onFinish, onQuit }: ExerciseProps<KnightKind>) {
  const generate = useCallback((level: number) => {
    const p = generatePuzzle(level, Math.random, focus)
    return { ...p, category: p.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'reflection', exercise: 'knights', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const puzzle = session.item
  const { review, submit, next } = useDeliberate(session)
  const [answer, setAnswer] = useState<(boolean | null)[]>(() => puzzle.names.map(() => null))
  const [answerFor, setAnswerFor] = useState(puzzle)
  if (answerFor !== puzzle) {
    setAnswerFor(puzzle)
    setAnswer(puzzle.names.map(() => null))
  }

  function validate() {
    const correct = puzzle.solution.every((s, i) => answer[i] === s)
    submit(
      correct,
      correct ? 'Tout le monde est démasqué' : 'Il y avait des erreurs',
      <>
        <p>{correct ? 'C’est la seule répartition possible :' : 'La seule répartition possible était :'}</p>
        <ul className="knights-check">
          {puzzle.names.map((name, i) => {
            const sincere = puzzle.solution[i]!
            return (
              <li key={name} className={answer[i] === sincere ? 'ok' : 'ko'}>
                <strong>{name}</strong> est {typeLabel(sincere, i).toLowerCase()} : « {puzzle.statements[i]!.text} » est{' '}
                {sincere ? 'vrai' : 'faux'}.
              </li>
            )
          })}
        </ul>
      </>,
    )
  }

  return (
    <SessionFrame
      itemLabel="Île"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : KNIGHT_KIND_LABELS[focus]}
      feedback={null}
      onQuit={onQuit}
    >
      <Elapsed key={session.index} stopped={review !== null} />
      <p className="instruction muted">Les sincères disent toujours vrai, les menteurs toujours faux. Qui est qui ?</p>
      <ul className="statements">
        {puzzle.names.map((name, i) => (
          <li key={name}>
            <strong>{name}</strong> : « {puzzle.statements[i]!.text} »
          </li>
        ))}
      </ul>

      {review === null ? (
        <>
          <div className="knights-answer">
            {puzzle.names.map((name, i) => (
              <div key={name} className="knight-row" role="group" aria-label={name}>
                <span>{name}</span>
                {[true, false].map((sincere) => (
                  <button
                    key={String(sincere)}
                    type="button"
                    className={answer[i] === sincere ? 'selected' : 'secondary'}
                    aria-pressed={answer[i] === sincere}
                    onClick={() => setAnswer((prev) => prev.map((v, j) => (j === i ? sincere : v)))}
                  >
                    {typeLabel(sincere, i)}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <Scratchpad itemKey={session.index} />
          <div className="actions">
            <button type="button" className="big" disabled={answer.some((v) => v === null)} onClick={validate}>
              Valider
            </button>
          </div>
        </>
      ) : (
        <ReviewPanel review={review} last={session.index + 1 >= length} onNext={next} />
      )}
    </SessionFrame>
  )
}
