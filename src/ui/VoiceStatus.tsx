import type { VoiceAnswerState } from './useVoiceAnswer'

export function VoiceStatus({ state }: { state: VoiceAnswerState }) {
  if (!state.enabled && state.error === null) return null
  return (
    <p className="voice-status" aria-live="polite">
      {state.error !== null ? (
        <span className="ko">🎤 {state.error}</span>
      ) : state.rejected !== null ? (
        <span className="ko">🎤 Pas compris : « {state.rejected} »</span>
      ) : state.listening ? (
        <span>🎤 À l’écoute{state.lastHeard !== null ? ` · entendu : « ${state.lastHeard} »` : ''}</span>
      ) : (
        <span className="muted">🎤 Micro en attente…</span>
      )}
    </p>
  )
}
