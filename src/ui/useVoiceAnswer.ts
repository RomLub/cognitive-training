import { useState } from 'react'
import { firstParsed } from '../voice/parse'
import { useSpeechAnswers, type SpeechState } from '../voice/useSpeechAnswers'

export interface VoiceAnswerState extends SpeechState {
  enabled: boolean
  /** Last transcript that could not be turned into an answer. */
  rejected: string | null
}

/** Listens while enabled, parses each utterance and forwards understood answers. */
export function useVoiceAnswer<T>(options: {
  enabled: boolean
  parse: (text: string) => T | null
  onAnswer: (answer: T) => void
}): VoiceAnswerState {
  const { enabled, parse, onAnswer } = options
  const [rejected, setRejected] = useState<string | null>(null)
  const speech = useSpeechAnswers({
    enabled,
    onResult: (alternatives) => {
      const parsed = firstParsed(alternatives, parse)
      if (parsed === null) {
        setRejected(alternatives[0] ?? '')
        return
      }
      setRejected(null)
      onAnswer(parsed)
    },
  })
  return { ...speech, enabled, rejected }
}
