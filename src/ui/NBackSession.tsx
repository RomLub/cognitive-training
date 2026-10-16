import { useCallback, useEffect, useRef, useState } from 'react'
import { NBACK_LABELS } from '../domains/memory/labels'
import { generateBlock, GRID_CELLS, LEVEL_BOUNDS, scoreBlock, type NBackModality } from '../domains/memory/nback'
import { parseSameDifferent } from '../voice/parse'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const LEAD_MS = 1500
/** Blank between two stimuli. */
const BLANK_MS = 300

export function NBackSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<NBackModality>) {
  const generate = useCallback((level: number) => {
    const b = generateBlock(level, Math.random, focus)
    return { ...b, category: b.modality }
  }, [focus])
  const session = useAdaptiveSession({ domain: 'memory', exercise: 'n-back', bounds: LEVEL_BOUNDS, length, startLevel, generate, onFinish })
  const block = session.item
  const [current, setCurrent] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [pressed, setPressed] = useState(false)
  const responses = useRef<boolean[]>([])
  const currentRef = useRef<number | null>(null)

  const answerRef = useRef(session.answer)
  useEffect(() => {
    answerRef.current = session.answer
  })

  // Plays the block, then scores it as one adaptive item.
  useEffect(() => {
    responses.current = []
    const timers: ReturnType<typeof setTimeout>[] = []
    block.stimuli.forEach((_, i) => {
      const at = LEAD_MS + i * block.intervalMs
      timers.push(
        setTimeout(() => {
          currentRef.current = i
          setCurrent(i)
          setVisible(true)
          setPressed(false)
        }, at),
        setTimeout(() => setVisible(false), at + block.intervalMs - BLANK_MS),
      )
    })
    timers.push(
      setTimeout(() => {
        currentRef.current = null
        setCurrent(null)
        const score = scoreBlock(block, responses.current)
        answerRef.current(
          score.passed,
          `${Math.round(score.accuracy * 100)} % · ${score.hits} trouvés, ${score.misses} manqués, ${score.falseAlarms} fausses alertes`,
        )
      }, LEAD_MS + block.stimuli.length * block.intervalMs),
    )
    return () => timers.forEach(clearTimeout)
  }, [block])

  const press = useCallback(() => {
    const i = currentRef.current
    if (i === null || responses.current[i] === true) return
    responses.current[i] = true
    setPressed(true)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === ' ' || event.key.toLowerCase() === 'j') {
        event.preventDefault()
        press()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  const voiceState = useVoiceAnswer({
    enabled: voice,
    parse: parseSameDifferent,
    onAnswer: (answer) => {
      if (answer === 'same') press()
    },
  })

  const stimulus = current !== null && visible ? block.stimuli[current]! : null

  return (
    <SessionFrame
      itemLabel="Bloc"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (NBACK_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <p className="instruction">
        <strong>{block.n}-back</strong> · {NBACK_LABELS[block.modality]} · appuie quand c’est{' '}
        {block.n === 1 ? 'le même que juste avant' : `le même qu’il y a ${block.n} coups`}
      </p>
      {block.modality === 'letters' ? (
        <p className="problem" data-testid="nback-stimulus">
          {stimulus ?? ' '}
        </p>
      ) : (
        <div className="nback-grid" data-testid="nback-stimulus" data-cell={stimulus ?? ''}>
          {Array.from({ length: GRID_CELLS }, (_, i) => (
            <span key={i} className={stimulus === String(i) ? 'lit' : ''} />
          ))}
        </div>
      )}
      <div className="choice-grid">
        <button type="button" className={pressed ? '' : 'secondary'} onClick={press} disabled={current === null}>
          Pareil <kbd>Espace</kbd>
        </button>
      </div>
      <p className="muted small center">
        Stimulus {current === null ? 0 : current + 1}/{block.stimuli.length}
      </p>
    </SessionFrame>
  )
}
