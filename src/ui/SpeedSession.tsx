import { useCallback, useEffect, useRef } from 'react'
import { generateTrial, LEVEL_BOUNDS, timeLimitMs, type PairKind } from '../domains/speed/compare'
import { PAIR_KIND_LABELS } from '../domains/speed/labels'
import { parseSameDifferent } from '../voice/parse'
import { VOICE_ALLOWANCE_MS } from '../voice/useSpeechAnswers'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

/** Keyboard: left arrow / F = identical, right arrow / J = different. */
const KEY_TO_KIND: Readonly<Record<string, PairKind>> = {
  arrowleft: 'same',
  f: 'same',
  arrowright: 'different',
  j: 'different',
}

export function SpeedSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<PairKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const timeLimit = useCallback(
    (item: { level: number }) => timeLimitMs(item.level) + (voice ? VOICE_ALLOWANCE_MS : 0),
    [voice],
  )
  const session = useAdaptiveSession({
    domain: 'speed',
    exercise: 'pair-compare',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: timeLimit,
    timeoutText: (item) => `Trop lent : ${PAIR_KIND_LABELS[item.kind].toLowerCase()}`,
  })
  const trial = session.item

  function choose(kind: PairKind) {
    const correct = kind === trial.kind
    session.answer(correct, correct ? PAIR_KIND_LABELS[trial.kind] : `C’était : ${PAIR_KIND_LABELS[trial.kind].toLowerCase()}`)
  }

  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseSameDifferent, onAnswer: choose })

  const chooseRef = useRef(choose)
  useEffect(() => {
    chooseRef.current = choose
  })
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const kind = KEY_TO_KIND[event.key.toLowerCase()]
      if (kind === undefined) return
      event.preventDefault()
      chooseRef.current(kind)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SessionFrame
      itemLabel="Paire"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : PAIR_KIND_LABELS[focus]}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction muted">Les deux séries sont-elles identiques ?</p>
      <div className="pair" aria-live="polite">
        <span data-testid="pair-left">{trial.left}</span>
        <span data-testid="pair-right">{trial.right}</span>
      </div>
      <div className="choice-grid two">
        <button type="button" className="secondary" onClick={() => choose('same')}>
          Identiques <kbd>←</kbd>
        </button>
        <button type="button" className="secondary" onClick={() => choose('different')}>
          Différents <kbd>→</kbd>
        </button>
      </div>
    </SessionFrame>
  )
}
