import { useCallback, useRef, useState } from 'react'
import { generateKey, generateTrial, LEVEL_BOUNDS, timeLimitMs, type SymbolSet } from '../domains/speed/symbolDigit'
import { SYMBOL_SET_LABELS } from '../domains/speed/labels'
import { parseFrenchNumber } from '../voice/parse'
import { VOICE_ALLOWANCE_MS } from '../voice/useSpeechAnswers'
import { SessionFrame, type ExerciseProps } from './SessionFrame'
import { useAdaptiveSession } from './useAdaptiveSession'
import { useKeyboardChoice } from './useKeyboardChoice'
import { useVoiceAnswer } from './useVoiceAnswer'
import { VoiceStatus } from './VoiceStatus'

const DIGIT_KEYS: Readonly<Record<string, number>> = Object.fromEntries(
  Array.from({ length: 9 }, (_, i) => [String(i + 1), i + 1]),
)

export function SymbolDigitSession({ startLevel, focus, length, voice, onFinish, onQuit }: ExerciseProps<SymbolSet>) {
  // One key for the whole session; the previous digit avoids immediate repeats.
  const [key] = useState(() => generateKey())
  const previous = useRef<number | null>(null)
  const generate = useCallback(
    (level: number) => {
      const t = generateTrial(key, level, Math.random, previous.current)
      previous.current = t.digit
      return { ...t, category: t.set }
    },
    [key],
  )
  const timeLimit = useCallback(
    (item: { level: number }) => timeLimitMs(item.level) + (voice ? VOICE_ALLOWANCE_MS : 0),
    [voice],
  )
  const session = useAdaptiveSession({
    domain: 'speed',
    exercise: 'symbol-digit',
    bounds: LEVEL_BOUNDS,
    length,
    startLevel,
    generate,
    onFinish,
    timeLimitMs: timeLimit,
    timeoutText: (item) => `Trop lent : ${item.symbol} = ${item.digit}`,
  })
  const trial = session.item

  function choose(digit: number) {
    session.answer(digit === trial.digit, `${trial.symbol} = ${trial.digit}`)
  }

  useKeyboardChoice(DIGIT_KEYS, choose)
  const voiceState = useVoiceAnswer({
    enabled: voice,
    parse: (text) => {
      const n = parseFrenchNumber(text)
      return n !== null && n >= 1 && n <= 9 ? n : null
    },
    onAnswer: choose,
  })

  return (
    <SessionFrame
      itemLabel="Symbole"
      index={session.index}
      length={length}
      level={session.level}
      focusLabel={focus === null ? null : (SYMBOL_SET_LABELS[focus] ?? focus)}
      feedback={session.feedback}
      timeLimit={session.timeLimit}
      onQuit={onQuit}
      status={<VoiceStatus state={voiceState} />}
    >
      <div className="symbol-key" aria-label="Clé symbole-chiffre">
        {key[trial.set].map((symbol, i) => (
          <div key={symbol}>
            <span className="symbol">{symbol}</span>
            <span>{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="problem symbol" data-testid="symbol" data-digit={trial.digit}>
        {trial.symbol}
      </p>
      <div className="digit-pad">
        {Array.from({ length: 9 }, (_, i) => (
          <button key={i} type="button" className="secondary" onClick={() => choose(i + 1)}>
            {i + 1}
          </button>
        ))}
      </div>
    </SessionFrame>
  )
}
