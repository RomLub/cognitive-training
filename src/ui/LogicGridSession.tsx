import { useCallback, useState } from 'react'
import { GRID_KIND_LABELS } from '../domains/reflection/labels'
import { generatePuzzle, isGridSolved, LEVEL_BOUNDS, type GridKind, type GridPuzzle } from '../domains/reflection/logicGrid'
import { Elapsed, ReviewPanel, Scratchpad } from './Deliberate'
import { useDeliberate } from './useDeliberate'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'

type Answer = (number | null)[][]

function emptyAnswer(puzzle: GridPuzzle): Answer {
  return puzzle.attributes.map(() => puzzle.names.map(() => null))
}

function SolutionTable({ puzzle, answer }: { puzzle: GridPuzzle; answer: Answer }) {
  return (
    <table className="grid-table solution">
      <thead>
        <tr>
          <th scope="col" />
          {puzzle.attributes.map((a) => (
            <th key={a.title} scope="col">
              {a.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {puzzle.names.map((name, p) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            {puzzle.attributes.map((a, ai) => {
              const right = puzzle.solution[ai]![p]!
              return (
                <td key={a.title} className={answer[ai]?.[p] === right ? 'ok' : 'ko'}>
                  {a.values[right]!.name}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function LogicGridSession({ startLevel, focus, length, onFinish, onQuit }: ExerciseProps<GridKind>) {
  const generate = useCallback((level: number) => {
    const p = generatePuzzle(level, Math.random, focus)
    return { ...p, category: p.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'reflection', exercise: 'logic-grid', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const puzzle = session.item
  const { review, submit, next } = useDeliberate(session)
  const [answer, setAnswer] = useState<Answer>(() => emptyAnswer(puzzle))
  const [answerFor, setAnswerFor] = useState(puzzle)
  if (answerFor !== puzzle) {
    setAnswerFor(puzzle)
    setAnswer(emptyAnswer(puzzle))
  }
  const complete = answer.every((row) => row.every((v) => v !== null))

  function choose(attribute: number, person: number, value: number | null) {
    setAnswer((prev) =>
      prev.map((row, a) =>
        row.map((v, p) => {
          if (a === attribute && p === person) return value
          // A value belongs to one person only: picking it elsewhere frees it here.
          if (a === attribute && value !== null && v === value) return null
          return v
        }),
      ),
    )
  }

  function validate() {
    const correct = isGridSolved(puzzle, answer)
    submit(
      correct,
      correct ? 'Grille exacte' : 'La grille contenait des erreurs',
      <>
        <p>{correct ? 'Toute la grille est juste.' : 'Les cases en rouge étaient fausses. La solution :'}</p>
        <SolutionTable puzzle={puzzle} answer={answer} />
      </>,
    )
  }

  return (
    <SessionFrame
      itemLabel="Énigme"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : GRID_KIND_LABELS[focus]}
      feedback={null}
      onQuit={onQuit}
    >
      <Elapsed key={session.index} stopped={review !== null} />
      <p className="instruction muted">
        Chaque personne a une seule valeur de chaque colonne, et deux personnes n’ont jamais la même.
        {puzzle.kind === 'ordered' && ' Les maisons sont alignées de gauche (1) à droite.'}
      </p>
      <ul className="clues" data-testid="clues">
        {puzzle.clues.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      {review === null ? (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th scope="col" />
                {puzzle.attributes.map((a) => (
                  <th key={a.title} scope="col">
                    {a.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {puzzle.names.map((name, p) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  {puzzle.attributes.map((a, ai) => (
                    <td key={a.title}>
                      <select
                        aria-label={`${a.title} de ${name}`}
                        value={answer[ai]?.[p] ?? ''}
                        onChange={(e) => choose(ai, p, e.target.value === '' ? null : Number(e.target.value))}
                      >
                        <option value="">—</option>
                        {a.values.map((v, vi) => (
                          <option key={v.name} value={vi}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Scratchpad itemKey={session.index} />
          <div className="actions">
            <button type="button" className="big" disabled={!complete} onClick={validate}>
              Valider la grille
            </button>
          </div>
        </>
      ) : (
        <ReviewPanel review={review} last={session.index + 1 >= length} onNext={next} />
      )}
    </SessionFrame>
  )
}
