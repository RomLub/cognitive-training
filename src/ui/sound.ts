/**
 * Short feedback sounds synthesized with the Web Audio API (no audio files to download or cache).
 * The on/off choice is a per-device convenience stored in localStorage.
 */
const SOUND_KEY = 'cognitive-training:sound'

export function loadSoundPreference(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    return true
  }
}

export function saveSoundPreference(on: boolean): void {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
  } catch (err) {
    console.error('Failed to save sound preference', err)
  }
}

let context: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null
  context ??= new window.AudioContext()
  return context
}

/** Plays notes (frequency in Hz) one after another. */
function notes(frequencies: readonly number[], { step = 0.09, duration = 0.16, type = 'sine' as OscillatorType, volume = 0.12 } = {}) {
  const ctx = audio()
  if (ctx === null) return
  if (ctx.state === 'suspended') void ctx.resume()
  frequencies.forEach((frequency, i) => {
    const start = ctx.currentTime + i * step
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  })
}

export const sounds = {
  correct: () => notes([784, 1175]),
  wrong: () => notes([220, 185], { step: 0.11, duration: 0.18, type: 'triangle', volume: 0.1 }),
  finish: () => notes([523, 659, 784, 1047], { step: 0.11, duration: 0.24 }),
}
