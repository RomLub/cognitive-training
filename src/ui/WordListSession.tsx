import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { normalizeWord, splitWords } from '../core/text'
import { LIST_KIND_LABELS } from '../domains/episodic/labels'
import { generateList, LEVEL_BOUNDS, scoreRecall, type ListKind } from '../domains/episodic/wordList'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { usePersistentFocus } from './usePersistentFocus'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

type Phase = 'study' | 'delay' | 'recall'

const LEAD_MS = 1000
const GAP_MS = 250

export function WordListSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<ListKind>) {
  const generate = useCallback((level: number) => {
    const t = generateList(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'episodic', exercise: 'word-list', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const { item: trial, restartTimer } = session
  const [phase, setPhase] = useState<Phase>('study')
  const [shown, setShown] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [recalled, setRecalled] = useState<string[]>([])
  const [input, setInput] = useState('')
  const field = usePersistentFocus(phase === 'recall')

  // Study: one word at a time; then the delay with a countdown; then recall.
  useEffect(() => {
    const slot = trial.showMs + GAP_MS
    const studyEnd = LEAD_MS + trial.words.length * slot
    const timers = trial.words.flatMap((word, i) => [
      setTimeout(() => setShown(word), LEAD_MS + i * slot),
      setTimeout(() => setShown(null), LEAD_MS + i * slot + trial.showMs),
    ])
    const startRecall = () => {
      restartTimer()
      setPhase('recall')
    }
    if (trial.delayMs === 0) {
      timers.push(setTimeout(startRecall, studyEnd))
    } else {
      timers.push(
        setTimeout(() => {
          setPhase('delay')
          setSecondsLeft(Math.round(trial.delayMs / 1000))
        }, studyEnd),
      )
      for (let s = 1; s <= trial.delayMs / 1000; s++) {
        timers.push(setTimeout(() => setSecondsLeft(Math.round(trial.delayMs / 1000) - s), studyEnd + s * 1000))
      }
      timers.push(setTimeout(startRecall, studyEnd + trial.delayMs))
    }
    return () => timers.forEach(clearTimeout)
  }, [trial, restartTimer])

  function addWords(words: readonly string[]) {
    setRecalled((current) => {
      const keys = new Set(current.map(normalizeWord))
      const added = words.filter((w) => {
        const key = normalizeWord(w)
        if (key.length === 0 || keys.has(key)) return false
        keys.add(key)
        return true
      })
      return [...current, ...added]
    })
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    addWords(splitWords(input))
    setInput('')
  }

  function finish() {
    const score = scoreRecall(trial, [...recalled, ...splitWords(input)])
    const missed = score.missed.length === 0 ? '' : ` · oubliés : ${score.missed.join(', ')}`
    session.answer(score.passed, `${score.found.length}/${trial.words.length} mots retrouvés${missed}`)
    setRecalled([])
    setInput('')
    setPhase('study')
  }

  const voiceState = useVoiceAnswer({
    enabled: voice && phase === 'recall',
    parse: (text) => {
      const words = splitWords(text)
      return words.length === 0 ? null : words
    },
    onAnswer: addWords,
  })

  return (
    <SessionFrame
      itemLabel="Liste"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (LIST_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      {phase === 'study' && (
        <>
          <p className="instruction muted">Retiens un maximum de mots · {trial.words.length} mots</p>
          <p className="problem word" data-testid="study-word">
            {shown ?? ' '}
          </p>
        </>
      )}
      {phase === 'delay' && (
        <div className="delay-box" data-testid="delay">
          <p>Pause avant le rappel : {secondsLeft} s</p>
          <p className="muted">En attendant, compte à rebours de 3 en 3 à partir de 100, dans ta tête.</p>
        </div>
      )}
      {phase === 'recall' && (
        <>
          <p className="instruction">
            Écris tous les mots dont tu te souviens, dans n’importe quel ordre ({trial.required} pour réussir).
          </p>
          <form onSubmit={handleAdd} className="answer-form">
            <input
              ref={field}
              aria-label="Mot"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="un mot, puis Entrée"
            />
            <button type="submit" className="secondary" disabled={input.trim() === ''}>
              Ajouter
            </button>
          </form>
          <ul className="chips" aria-label="Mots rappelés">
            {recalled.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <div className="actions center-actions">
            <button type="button" onClick={finish}>
              J’ai fini ({recalled.length})
            </button>
          </div>
        </>
      )}
    </SessionFrame>
  )
}
