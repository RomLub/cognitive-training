import { useCallback } from 'react'
import { SYLLOGISM_KIND_LABELS } from '../domains/logic/labels'
import { generateTrial, LEVEL_BOUNDS, type SyllogismKind } from '../domains/logic/syllogism'
import { parseKeyword } from '../voice/parse'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useKeyboardChoice } from './useKeyboardChoice'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const KEYS: Readonly<Record<string, SyllogismKind>> = { arrowleft: 'valid', v: 'valid', arrowright: 'invalid', n: 'invalid' }
const parseVerdict = (text: string) =>
  parseKeyword(text, { valid: ['valide', 'vrai', 'oui', 'correct'], invalid: ['invalide', 'faux', 'non', 'incorrect'] })

export function SyllogismSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<SyllogismKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'logic', exercise: 'syllogisms', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const trial = session.item

  function choose(verdict: SyllogismKind) {
    const correct = verdict === trial.kind
    session.answer(
      correct,
      trial.kind === 'valid' ? 'La conclusion découle forcément des prémisses' : 'La conclusion ne découle pas forcément des prémisses',
    )
  }

  useKeyboardChoice(KEYS, choose)
  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseVerdict, onAnswer: choose })

  return (
    <SessionFrame
      itemLabel="Raisonnement"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (SYLLOGISM_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction muted">Les mots sont inventés. Si les phrases sont vraies, la conclusion l’est-elle forcément ?</p>
      <div className="syllogism" data-testid="syllogism" data-kind={trial.kind}>
        {trial.premises.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="conclusion">Donc : {trial.conclusion}</p>
      </div>
      <div className="choice-grid two">
        <button type="button" className="secondary" onClick={() => choose('valid')}>
          Valide <kbd>←</kbd>
        </button>
        <button type="button" className="secondary" onClick={() => choose('invalid')}>
          Non valide <kbd>→</kbd>
        </button>
      </div>
    </SessionFrame>
  )
}
