import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { normalizeWord, splitWords } from '../core/text'
import { generateRound, judgeWord, LEVEL_BOUNDS, type FluencyKind, type WordVerdict } from '../domains/language/fluency'
import { FLUENCY_KIND_LABELS } from '../domains/language/labels'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { usePersistentFocus } from './usePersistentFocus'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const VERDICT_TEXT: Record<Exclude<WordVerdict, 'ok'>, string> = {
  duplicate: 'déjà dit',
  unknown: 'non reconnu',
  'wrong-letter': 'mauvaise lettre',
  'too-short': 'trop court',
}

interface Entry {
  word: string
  verdict: WordVerdict
}

/** The voice-first exercise: words can be said continuously; typing works too. */
export function FluencySession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<FluencyKind>) {
  const generate = useCallback((level: number) => {
    const r = generateRound(level, Math.random, focus)
    return { ...r, category: r.kind }
  }, [focus])
  // Accepted words of the current round, read when the round's deadline expires.
  const counted = useRef(new Set<string>())
  const session = useAdaptiveSession({
    domain: 'language',
    exercise: 'fluency',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: (item) => item.durationMs,
    // The round ends with the timer: success depends on how many words were found.
    onTimeout: (item) => {
      const n = counted.current.size
      return { correct: n >= item.target, text: `${n} mot${n > 1 ? 's' : ''} valable${n > 1 ? 's' : ''} (objectif ${item.target})` }
    },
  })
  const round = session.item
  const [entries, setEntries] = useState<Entry[]>([])
  const [input, setInput] = useState('')
  const field = usePersistentFocus()
  const [secondsLeft, setSecondsLeft] = useState(Math.round(round.durationMs / 1000))
  const [shownFor, setShownFor] = useState(round)

  // New round: clear the words (derived from the item, without an effect).
  if (shownFor !== round) {
    setShownFor(round)
    setEntries([])
    setSecondsLeft(Math.round(round.durationMs / 1000))
  }

  useEffect(() => {
    counted.current = new Set()
    const started = Date.now()
    const timer = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((round.durationMs - (Date.now() - started)) / 1000)))
    }, 250)
    return () => clearInterval(timer)
  }, [round])

  function add(word: string) {
    const verdict = judgeWord(round, word, counted.current)
    if (verdict === 'ok') counted.current.add(normalizeWord(word))
    setEntries((current) => [{ word, verdict }, ...current])
  }

  /** A whole utterance may be one multi-word entry ("pomme de terre"), otherwise several words. */
  function addText(text: string) {
    const whole = text.trim()
    if (whole === '') return
    if (judgeWord(round, whole, counted.current) === 'ok' || !/\s/.test(whole)) {
      add(whole)
      return
    }
    for (const word of splitWords(whole)) add(word)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    addText(input)
    setInput('')
  }

  const voiceState = useVoiceAnswer({ enabled: voice, parse: (text) => (text.trim() === '' ? null : text), onAnswer: addText })
  const valid = entries.filter((e) => e.verdict === 'ok').length

  return (
    <SessionFrame
      itemLabel="Manche"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (FLUENCY_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="problem fluency-prompt" data-testid="fluency-prompt">
        Cite {round.prompt}
      </p>
      <p className="instruction">
        <strong data-testid="fluency-count">{valid}</strong> / {round.target} · {secondsLeft} s
        {!voice && <span className="muted"> · active la réponse vocale pour parler au lieu d’écrire</span>}
      </p>
      <form onSubmit={handleSubmit} className="answer-form">
        <input ref={field} aria-label="Mot" autoComplete="off" value={input} onChange={(e) => setInput(e.target.value)} placeholder="un mot, puis Entrée" />
        <button type="submit" className="secondary" disabled={input.trim() === ''}>
          Ajouter
        </button>
      </form>
      <ul className="chips" aria-label="Mots donnés">
        {entries.map((e, i) => (
          <li key={`${e.word}-${i}`} className={e.verdict === 'ok' ? '' : 'rejected'}>
            {e.word}
            {e.verdict !== 'ok' && <small> · {VERDICT_TEXT[e.verdict]}</small>}
          </li>
        ))}
      </ul>
    </SessionFrame>
  )
}
