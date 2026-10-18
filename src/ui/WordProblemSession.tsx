import { useCallback } from 'react'
import { PROBLEM_KIND_LABELS } from '../domains/reflection/labels'
import { generateProblem, LEVEL_BOUNDS, type ProblemKind } from '../domains/reflection/wordProblems'
import { Elapsed, ReviewPanel, Scratchpad } from './Deliberate'
import { useDeliberate } from './useDeliberate'
import { NumericKeypad } from './NumericKeypad'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'

export function WordProblemSession({ startLevel, focus, length, onFinish, onQuit }: ExerciseProps<ProblemKind>) {
  const generate = useCallback((level: number) => {
    const p = generateProblem(level, Math.random, focus)
    return { ...p, category: p.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'reflection', exercise: 'word-problems', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const problem = session.item
  const { review, submit, next } = useDeliberate(session)

  function validate(value: string) {
    const given = Number(value)
    const correct = given === problem.answer
    submit(
      correct,
      `${problem.answer} ${problem.unit}`,
      <>
        <p>
          {correct ? 'Réponse : ' : `Tu as répondu ${given}. La réponse était `}
          <strong>
            {problem.answer} {problem.unit}
          </strong>
          .
        </p>
        <p>{problem.explanation}</p>
      </>,
    )
  }

  return (
    <SessionFrame
      itemLabel="Problème"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : PROBLEM_KIND_LABELS[focus]}
      feedback={null}
      onQuit={onQuit}
    >
      <Elapsed key={session.index} stopped={review !== null} />
      <p className="word-problem" data-testid="word-problem">
        {problem.text}
      </p>
      {review === null ? (
        <>
          <Scratchpad itemKey={session.index} />
          {/* No auto-validation: the answer's length would give a hint. */}
          <NumericKeypad expectedLength={null} onSubmit={validate} resetKey={session.index} suffix={problem.unit} />
        </>
      ) : (
        <ReviewPanel review={review} last={session.index + 1 >= length} onNext={next} />
      )}
    </SessionFrame>
  )
}
