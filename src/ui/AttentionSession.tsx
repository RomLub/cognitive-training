import { useCallback, useEffect, useRef } from 'react'
import { COLOR_KEYS, COLOR_NAMES, STROOP_KIND_LABELS } from '../domains/attention/labels'
import {
  colorsForLevel,
  generateTrial,
  LEVEL_BOUNDS,
  SWITCH_FROM_LEVEL,
  timeLimitMs,
  type InkColor,
  type StroopKind,
  type StroopTrial,
} from '../domains/attention/stroop'
import { parseKeyword } from '../voice/parse'
import { VOICE_ALLOWANCE_MS } from '../voice/useSpeechAnswers'
import { capitalize } from './format'
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
  purple: ['violet', 'violette', 'violets', 'violettes', 'mauve'],
  brown: ['marron', 'marrons', 'brun', 'brune', 'bruns'],
}

const parseColor = (text: string) => parseKeyword(text, COLOR_SPELLINGS)

/** What the right answer was, in words, for feedback. */
function expected(trial: StroopTrial): string {
  const name = COLOR_NAMES[trial.target].toLowerCase()
  return trial.rule === 'word' ? `il fallait lire le mot : ${name}` : `l’encre était ${name}`
}

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
    timeoutText: (item) => `Trop lent : ${expected(item)}`,
  })
  const trial = session.item
  const colors = colorsForLevel(trial.level)
  const switching = trial.level >= SWITCH_FROM_LEVEL

  function choose(color: InkColor) {
    if (!colors.includes(color)) return
    const correct = color === trial.target
    session.answer(correct, correct ? COLOR_NAMES[trial.target] : capitalize(expected(trial)))
  }

  const voiceState = useVoiceAnswer({ enabled: voice, parse: parseColor, onAnswer: choose })

  // Keyboard shortcuts: R, B, V, J (+ I, M from level 16). The listener reads the latest `choose` through a ref.
  const chooseRef = useRef(choose)
  useEffect(() => {
    chooseRef.current = choose
  })
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const color = (Object.keys(COLOR_KEYS) as InkColor[]).find((c) => COLOR_KEYS[c] === event.key.toLowerCase())
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
      <p className="instruction muted">
        {switching
          ? 'Suis la consigne : ENCRE = couleur de l’encre, MOT = lire le mot.'
          : 'Donne la couleur de l’encre, pas le mot.'}
      </p>
      {switching && (
        <p className={`stroop-cue ${trial.rule}`} data-testid="stroop-cue">
          {trial.rule === 'ink' ? 'ENCRE' : 'MOT'}
        </p>
      )}
      <p
        className={`problem stroop-word ink-${trial.ink}`}
        aria-label={`Mot ${COLOR_NAMES[trial.word]} écrit en ${COLOR_NAMES[trial.ink]}`}
      >
        {COLOR_NAMES[trial.word].toUpperCase()}
      </p>
      <div className={`choice-grid ${colors.length === 6 ? 'three-cols' : ''}`}>
        {colors.map((color) => (
          <button key={color} type="button" className="secondary" onClick={() => choose(color)}>
            {COLOR_NAMES[color]} <kbd>{COLOR_KEYS[color].toUpperCase()}</kbd>
          </button>
        ))}
      </div>
    </SessionFrame>
  )
}
