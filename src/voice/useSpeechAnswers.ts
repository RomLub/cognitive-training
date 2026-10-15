import { useEffect, useRef, useState } from 'react'

/** Minimal typing of the Web Speech API (not in TypeScript's DOM lib). */
interface SpeechAlternative {
  transcript: string
}
interface SpeechResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechAlternative
}
interface SpeechResultEvent {
  readonly resultIndex: number
  readonly results: { readonly length: number; [index: number]: SpeechResult }
}
interface SpeechErrorEvent {
  readonly error: string
}
export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechSupported(): boolean {
  return getRecognitionCtor() !== null
}

/** Extra time granted on timed exercises when answering by voice (recognition latency). */
export const VOICE_ALLOWANCE_MS = 1500

interface Options {
  /** Listen only while an answer is expected. */
  enabled: boolean
  /** Called with the recognizer's alternative transcripts for each final utterance. */
  onResult: (alternatives: string[]) => void
}

export interface SpeechState {
  listening: boolean
  error: string | null
  lastHeard: string | null
}

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  'not-allowed': 'Accès au micro refusé. Autorise-le dans le navigateur.',
  'service-not-allowed': 'Reconnaissance vocale indisponible dans ce navigateur.',
  'audio-capture': 'Aucun micro détecté.',
  network: 'Reconnaissance vocale indisponible (réseau).',
}

/** Continuous French speech recognition, restarted automatically after silences while enabled. */
export function useSpeechAnswers({ enabled, onResult }: Options): SpeechState {
  const [state, setState] = useState<SpeechState>({ listening: false, error: null, lastHeard: null })
  const onResultRef = useRef(onResult)
  useEffect(() => {
    onResultRef.current = onResult
  })

  useEffect(() => {
    if (!enabled) return
    const Ctor = getRecognitionCtor()
    if (Ctor === null) return

    let active = true
    const recognition = new Ctor()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.maxAlternatives = 5

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result === undefined || !result.isFinal) continue
        const alternatives: string[] = []
        for (let j = 0; j < result.length; j++) {
          const alt = result[j]
          if (alt !== undefined) alternatives.push(alt.transcript)
        }
        if (alternatives.length === 0) continue
        setState((s) => ({ ...s, lastHeard: alternatives[0]! }))
        onResultRef.current(alternatives)
      }
    }
    recognition.onerror = (event) => {
      // Silence and manual aborts are normal; everything else is surfaced.
      if (event.error === 'no-speech' || event.error === 'aborted') return
      console.error('Speech recognition error', event.error)
      const message = ERROR_MESSAGES[event.error] ?? `Erreur de reconnaissance vocale (${event.error}).`
      const fatal = event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture'
      if (fatal) active = false
      setState((s) => ({ ...s, error: message, listening: fatal ? false : s.listening }))
    }
    recognition.onstart = () => setState((s) => ({ ...s, listening: true, error: null }))
    recognition.onend = () => {
      if (!active) return
      try {
        recognition.start()
      } catch (err) {
        console.error('Failed to restart speech recognition', err)
        setState((s) => ({ ...s, listening: false, error: 'La reconnaissance vocale s’est arrêtée.' }))
      }
    }

    try {
      recognition.start()
    } catch (err) {
      // Only thrown when already started; the onstart/onerror handlers report the real state.
      console.error('Failed to start speech recognition', err)
    }

    return () => {
      active = false
      recognition.onstart = null
      recognition.onend = null
      recognition.onresult = null
      recognition.abort()
      setState((s) => ({ ...s, listening: false }))
    }
  }, [enabled])

  return state
}
