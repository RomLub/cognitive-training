import { useCallback, useState, type FormEvent } from 'react'
import { splitWords } from '../core/text'
import { generateTrial, isSolution, letters, LEVEL_BOUNDS, timeLimitMs, type AnagramKind } from '../domains/language/anagram'
import { ANAGRAM_KIND_LABELS } from '../domains/language/labels'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

export function AnagramSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<AnagramKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({
    domain: 'language',
    exercise: 'anagrams',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: (item) => timeLimitMs(item.level),
    timeoutText: (item) => `Temps écoulé : ${item.word}`,
  })
  const trial = session.item
  const [input, setInput] = useState('')
  const [miss, setMiss] = useState<string | null>(null)

  /** A wrong guess does not end the item: the user can try again until the deadline. */
  function tryAnswer(answer: string) {
    if (isSolution(trial, answer)) {
      session.answer(true, trial.word)
      setMiss(null)
    } else {
      setMiss(answer)
    }
    setInput('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (input.trim() !== '') tryAnswer(input)
  }

  const voiceState = useVoiceAnswer({ enabled: voice, parse: (text) => splitWords(text)[0] ?? null, onAnswer: tryAnswer })

  return (
    <SessionFrame
      itemLabel="Anagramme"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (ANAGRAM_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction muted">Remets les lettres dans l’ordre · {letters(trial.word).length} lettres</p>
      <p className="problem anagram" data-testid="anagram" data-word={trial.word}>
        {trial.scrambled.split('').join(' ')}
      </p>
      <form onSubmit={handleSubmit} className="answer-form">
        <input autoFocus aria-label="Réponse" autoComplete="off" value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" disabled={input.trim() === ''}>
          Valider
        </button>
      </form>
      {miss !== null && <p className="ko center small">« {miss} » ne convient pas, essaie encore.</p>}
      <p className="muted small center">
        <button type="button" className="link" onClick={() => session.answer(false, `C’était : ${trial.word}`)}>
          Passer
        </button>
      </p>
    </SessionFrame>
  )
}
