import type { VoiceAnswerState } from './useVoiceAnswer'

export function VoiceStatus({ state }: { state: VoiceAnswerState }) {
  if (!state.enabled && state.error === null) return null
  return (
    <p className="voice-status" aria-live="polite">
      {state.error !== null ? (
        <>
          <span className="ko">🎤 {state.error}</span> <ActivateButton state={state} label="Réessayer" />
        </>
      ) : state.rejected !== null ? (
        <span className="ko">🎤 Pas compris : « {state.rejected} »</span>
      ) : state.listening ? (
        <span>🎤 À l’écoute{state.lastHeard !== null ? ` · entendu : « ${state.lastHeard} »` : ''}</span>
      ) : (
        <ActivateButton state={state} label="🎤 Activer le micro" />
      )}
    </p>
  )
}

/** A tap is what iOS needs before it lets the page use the microphone. */
function ActivateButton({ state, label }: { state: VoiceAnswerState; label: string }) {
  return (
    <button type="button" className="secondary voice-activate" onClick={state.activate}>
      {label}
    </button>
  )
}
