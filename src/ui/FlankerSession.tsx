import { useCallback } from 'react'
import { generateTrial, LEVEL_BOUNDS, timeLimitMs, type Direction, type FlankerKind } from '../domains/attention/flanker'
import { FLANKER_KIND_LABELS } from '../domains/attention/labels'
import { parseKeyword } from '../voice/parse'
import { VOICE_ALLOWANCE_MS } from '../voice/useSpeechAnswers'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useKeyboardChoice } from './useKeyboardChoice'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const KEYS: Readonly<Record<string, Direction>> = { arrowleft: 'left', f: 'left', arrowright: 'right', j: 'right' }
const LABEL: Record<Direction, string> = { left: 'gauche', right: 'droite' }
const parseDirection = (text: string) => parseKeyword(text, { left: ['gauche'], right: ['droite', 'droit'] })

export function FlankerSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<FlankerKind>) {
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
    exercise: 'flanker',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: timeLimit,
    timeoutText: (item) => `Trop lent : la flèche du milieu allait à ${LABEL[item.target]}`,
  })
  const trial = session.item

  function choose(direction: Direction) {
    const correct = direction === trial.target
    session.answer(correct, correct ? `À ${LABEL[trial.target]}` : `La flèche du milieu allait à ${LABEL[trial.target]}`)
  }

  useKeyboardChoice(KEYS, choose)
  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseDirection, onAnswer: choose })

  return (
    <SessionFrame
      itemLabel="Essai"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (FLANKER_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction muted">Direction de la flèche du milieu ?</p>
      <p className="problem flanker" data-testid="flanker-arrows" data-target={trial.target}>
        {trial.arrows}
      </p>
      <div className="choice-grid two">
        <button type="button" className="secondary" onClick={() => choose('left')}>
          Gauche <kbd>←</kbd>
        </button>
        <button type="button" className="secondary" onClick={() => choose('right')}>
          Droite <kbd>→</kbd>
        </button>
      </div>
    </SessionFrame>
  )
}
