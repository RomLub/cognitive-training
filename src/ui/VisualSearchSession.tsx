import { useCallback } from 'react'
import { SEARCH_KIND_LABELS } from '../domains/attention/labels'
import { generateTrial, LEVEL_BOUNDS, type SearchKind } from '../domains/attention/visualSearch'
import { parseKeyword } from '../voice/parse'
import { VOICE_ALLOWANCE_MS } from '../voice/useSpeechAnswers'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useKeyboardChoice } from './useKeyboardChoice'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const KEYS: Readonly<Record<string, SearchKind>> = { arrowleft: 'present', f: 'present', arrowright: 'absent', j: 'absent' }
const parseAnswer = (text: string) =>
  parseKeyword(text, { present: ['present', 'presente', 'oui', 'trouve'], absent: ['absent', 'absente', 'non', 'rien'] })

export function VisualSearchSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<SearchKind>) {
  const generate = useCallback((level: number) => {
    const t = generateTrial(level, Math.random, focus)
    return { ...t, category: t.kind }
  }, [focus])
  const timeLimit = useCallback(
    (item: { timeLimitMs: number }) => item.timeLimitMs + (voice ? VOICE_ALLOWANCE_MS : 0),
    [voice],
  )
  const session = useAdaptiveSession({
    domain: 'attention',
    exercise: 'visual-search',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: timeLimit,
    timeoutText: (item) => `Trop lent : la cible était ${item.kind === 'present' ? 'présente' : 'absente'}`,
  })
  const trial = session.item

  function choose(kind: SearchKind) {
    const correct = kind === trial.kind
    session.answer(correct, `La cible était ${trial.kind === 'present' ? 'présente' : 'absente'}`)
  }

  useKeyboardChoice(KEYS, choose)
  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseAnswer, onAnswer: choose })

  return (
    <SessionFrame
      itemLabel="Grille"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (SEARCH_KIND_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction">
        Y a-t-il un <strong className="search-target">{trial.target}</strong> dans la grille ?
      </p>
      <div
        className="search-grid"
        style={{ gridTemplateColumns: `repeat(${trial.side}, 1fr)` }}
        data-testid="search-grid"
        data-kind={trial.kind}
      >
        {trial.grid.map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
      <div className="choice-grid two">
        <button type="button" className="secondary" onClick={() => choose('present')}>
          Présent <kbd>←</kbd>
        </button>
        <button type="button" className="secondary" onClick={() => choose('absent')}>
          Absent <kbd>→</kbd>
        </button>
      </div>
    </SessionFrame>
  )
}
