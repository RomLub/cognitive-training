import { useCallback, useEffect, useRef } from 'react'
import { COLOR_KEYS, COLOR_NAMES, STROOP_KIND_LABELS } from '../domains/attention/labels'
import { COLORS, generateTrial, LEVEL_BOUNDS, timeLimitMs, type InkColor, type StroopKind } from '../domains/attention/stroop'
import { parseKeyword } from '../voice/parse'
import { VOICE_ALLOWANCE_MS } from '../voice/useSpeechAnswers'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

/** Spoken color names, including frequent homophones returned by recognizers ("verre" for "vert"). */
const COLOR_SPELLINGS: Readonly<Record<InkColor, readonly string[]>> = {
  red: ['rouge', 'rouges'],
  blue: ['bleu', 'bleue', 'bleus', 'bleues'],
  green: ['vert', 'verte', 'verts', 'vertes', 'verre', 'vers', 'ver'],
  yellow: ['jaune', 'jaunes'],
}

const parseColor = (text: string) => parseKeyword(text, COLOR_SPELLINGS)

export function AttentionSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<StroopKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const timeLimit = useCallback(
    (item: { level: number }) => timeLimitMs(item.level) + (voice ? VOICE_ALLOWANCE_MS : 0),
    [voice],
  )
  const session = useAdaptiveSession({
    domain: 'attention',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: timeLimit,
    timeoutText: (item) => `Trop lent : l’encre était ${COLOR_NAMES[item.ink].toLowerCase()}`,
  })
  const trial = session.item

  function choose(color: InkColor) {
    const correct = color === trial.ink
    session.answer(correct, correct ? COLOR_NAMES[trial.ink] : `L’encre était ${COLOR_NAMES[trial.ink].toLowerCase()}`)
  }

  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseColor, onAnswer: choose })

  // Keyboard shortcuts: R, B, V, J. The listener reads the latest `choose` through a ref.
  const chooseRef = useRef(choose)
  useEffect(() => {
    chooseRef.current = choose
  })
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const color = COLORS.find((c) => COLOR_KEYS[c] === event.key.toLowerCase())
      if (color !== undefined) chooseRef.current(color)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SessionFrame
      itemLabel="Essai"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : STROOP_KIND_LABELS[focus]}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction muted">Donne la couleur de l’encre, pas le mot.</p>
      <p className={`problem stroop-word ink-${trial.ink}`} aria-label={`Mot ${COLOR_NAMES[trial.word]} écrit en ${COLOR_NAMES[trial.ink]}`}>
        {COLOR_NAMES[trial.word].toUpperCase()}
      </p>
      <div className="choice-grid">
        {COLORS.map((color) => (
          <button key={color} type="button" className="secondary" onClick={() => choose(color)}>
            {COLOR_NAMES[color]} <kbd>{COLOR_KEYS[color].toUpperCase()}</kbd>
          </button>
        ))}
      </div>
    </SessionFrame>
  )
}
