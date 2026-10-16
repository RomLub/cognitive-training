import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { splitWords } from '../core/text'
import { ASSOCIATION_KIND_LABELS } from '../domains/episodic/labels'
import { generatePairs, isRightPartner, LEVEL_BOUNDS, type AssociationKind } from '../domains/episodic/pairs'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const LEAD_MS = 1000
const GAP_MS = 300

export function PairsSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<AssociationKind>) {
  const generate = useCallback((level: number) => {
    const t = generatePairs(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'episodic', exercise: 'word-pairs', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const { item: trial, restartTimer } = session
  const [shownPair, setShownPair] = useState<number | null>(null)
  const [testing, setTesting] = useState(false)
  // Position in testOrder, and the answers given so far (true = right partner).
  const [step, setStep] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    const slot = trial.showMs + GAP_MS
    const timers = trial.pairs.flatMap((_, i) => [
      setTimeout(() => setShownPair(i), LEAD_MS + i * slot),
      setTimeout(() => setShownPair(null), LEAD_MS + i * slot + trial.showMs),
    ])
    timers.push(
      setTimeout(() => {
        restartTimer()
        setTesting(true)
      }, LEAD_MS + trial.pairs.length * slot + 500),
    )
    return () => timers.forEach(clearTimeout)
  }, [trial, restartTimer])

  function submit(answer: string) {
    const pairIndex = trial.testOrder[step]!
    const nextResults = [...results, isRightPartner(trial, pairIndex, answer)]
    setInput('')
    if (nextResults.length < trial.pairs.length) {
      setResults(nextResults)
      setStep(step + 1)
      return
    }
    const right = nextResults.filter(Boolean).length
    const wrong = trial.testOrder.filter((_, k) => !nextResults[k]).map((i) => trial.pairs[i]!.join(' – '))
    session.answer(
      right >= trial.required,
      `${right}/${trial.pairs.length} associations${wrong.length === 0 ? '' : ` · à revoir : ${wrong.join(', ')}`}`,
    )
    setResults([])
    setStep(0)
    setTesting(false)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit(input)
  }

  const voiceState = useVoiceAnswer({
    enabled: voice && testing,
    parse: (text) => splitWords(text)[0] ?? null,
    onAnswer: submit,
  })

  const pair = shownPair === null ? null : trial.pairs[shownPair]!
  const cue = testing ? trial.pairs[trial.testOrder[step]!]![0] : null

  return (
    <SessionFrame
      itemLabel="Série"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (ASSOCIATION_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      {!testing ? (
        <>
          <p className="instruction muted">Mémorise les associations · {trial.pairs.length} paires</p>
          <p className="problem word" data-testid="study-pair">
            {pair === null ? ' ' : `${pair[0]} – ${pair[1]}`}
          </p>
        </>
      ) : (
        <>
          <p className="instruction muted">
            Quel mot allait avec… ({step + 1}/{trial.pairs.length})
          </p>
          <p className="problem word" data-testid="cue">
            {cue} – ?
          </p>
          <form onSubmit={handleSubmit} className="answer-form">
            <input autoFocus aria-label="Réponse" autoComplete="off" value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" disabled={input.trim() === ''}>
              Valider
            </button>
          </form>
          <p className="muted small center">
            <button type="button" className="link" onClick={() => submit('')}>
              Je ne sais pas
            </button>
          </p>
        </>
      )}
    </SessionFrame>
  )
}
