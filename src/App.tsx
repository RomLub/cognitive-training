import { useMemo, useState } from 'react'
import { getProgram, type ProgramId } from './core/programs'
import { progressOf, sessionsOf } from './core/stats'
import type { SessionRecord } from './core/types'
import { LocalStorageSessionRepository, type SessionRepository } from './storage/sessionRepository'
import type { Cloud } from './sync/cloud'
import { cloudFromEnv } from './sync/supabaseCloud'
import { SYNC_LABELS } from './sync/syncLabels'
import { useCloudSync } from './sync/useCloudSync'
import { AccountPanel } from './ui/AccountPanel'
import { loadSoundPreference, saveSoundPreference } from './ui/sound'
import { SoundContext } from './ui/soundContext'
import { analyzeExercise, getExercise } from './ui/exercises'
import { Home } from './ui/Home'
import { buildProgramContext } from './ui/programContext'
import { ProgramStepScreen, ProgramSummary, type ProgramRun } from './ui/ProgramScreens'
import { Progress } from './ui/Progress'
import { Results } from './ui/Results'
import { isSpeechSupported } from './voice/useSpeechAnswers'

type Screen =
  | { name: 'home' }
  | {
      name: 'session'
      exercise: string
      startLevel: number
      focus: string | null
      length: number
      key: number
      /** Set when the session is a step of a program. */
      run: ProgramRun | null
    }
  | { name: 'results'; exercise: string; record: SessionRecord }
  | { name: 'progress'; exercise: string }
  | { name: 'program-step'; run: ProgramRun }
  | { name: 'program-summary'; run: ProgramRun }
  | { name: 'account' }

/** Per-browser convenience setting; the app works without it. */
const VOICE_KEY = 'cognitive-training:voice'

function loadVoicePreference(): boolean {
  try {
    return window.localStorage.getItem(VOICE_KEY) === 'on'
  } catch {
    return false
  }
}

function saveVoicePreference(on: boolean): void {
  try {
    window.localStorage.setItem(VOICE_KEY, on ? 'on' : 'off')
  } catch (err) {
    console.error('Failed to save voice preference', err)
  }
}

function loadRecords(repo: SessionRepository): { records: SessionRecord[]; error: string | null } {
  try {
    return { records: repo.list(), error: null }
  } catch (err) {
    console.error('Failed to load sessions', err)
    return { records: [], error: err instanceof Error ? err.message : String(err) }
  }
}

interface AppProps {
  repository?: SessionRepository
  /** Shared history; defaults to the build-time Supabase config, null for local-only. */
  cloud?: Cloud | null
}

export default function App({ repository, cloud: cloudProp }: AppProps) {
  const repo = useMemo(() => repository ?? new LocalStorageSessionRepository(), [repository])
  const [cloud] = useState(() => (cloudProp === undefined ? cloudFromEnv() : cloudProp))
  const [{ records, error }, setState] = useState(() => loadRecords(repo))
  // Sessions arriving from other devices refresh the screen.
  const sync = useCloudSync(cloud, repo, () => setState(loadRecords(repo)))
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [voiceSupported] = useState(isSpeechSupported)
  const [voice, setVoice] = useState(() => voiceSupported && loadVoicePreference())
  // Refreshed whenever the home screen is shown, for the streak.
  const [now, setNow] = useState(() => new Date())
  const [sound, setSound] = useState(loadSoundPreference)

  function toggleSound() {
    setSound((on) => {
      saveSoundPreference(!on)
      return !on
    })
  }

  function toggleVoice() {
    setVoice((on) => {
      saveVoicePreference(!on)
      return !on
    })
  }

  function startSession(exercise: string, length: number, run: ProgramRun | null) {
    const config = getExercise(exercise)
    setScreen({
      name: 'session',
      exercise,
      startLevel: progressOf(sessionsOf(records, exercise)).currentLevel ?? config.bounds.min,
      focus: analyzeExercise(config, records).weakest?.category ?? null,
      length,
      key: Date.now(),
      run,
    })
  }

  function startProgram(id: ProgramId) {
    const program = getProgram(id)
    setScreen({
      name: 'program-step',
      run: { title: program.title, steps: program.steps(buildProgramContext(records)), completed: [] },
    })
  }

  function finishSession(record: SessionRecord) {
    try {
      repo.add(record)
      setState(loadRecords(repo))
      sync.syncNow()
    } catch (err) {
      console.error('Failed to save session', err)
      setState((s) => ({ ...s, error: `Session non enregistrée : ${err instanceof Error ? err.message : String(err)}` }))
    }
    if (screen.name !== 'session') throw new Error(`Session finished on screen ${screen.name}`)
    if (screen.run === null) {
      setScreen({ name: 'results', exercise: record.exercise, record })
      return
    }
    const run = { ...screen.run, completed: [...screen.run.completed, record] }
    setScreen(run.completed.length < run.steps.length ? { name: 'program-step', run } : { name: 'program-summary', run })
  }

  function continueProgram(run: ProgramRun) {
    const step = run.steps[run.completed.length]
    if (step === undefined) throw new Error('No program step left')
    startSession(step.exercise, step.length, run)
  }

  const home = () => {
    setNow(new Date())
    setScreen({ name: 'home' })
  }

  return (
    <SoundContext.Provider value={sound}>
    <main className="app">
      <header className="app-header">
        <h1>
          <button type="button" className="brand" onClick={home}>
            Cognitive Training
          </button>
        </h1>
        <button
          type="button"
          className={`icon-toggle ${sound ? 'on' : ''}`}
          aria-pressed={sound}
          aria-label={`Sons : ${sound ? 'activés' : 'désactivés'}`}
          title={`Sons : ${sound ? 'activés' : 'désactivés'}`}
          onClick={toggleSound}
        >
          {sound ? '🔊' : '🔇'}
        </button>
        {voiceSupported && (
          <button type="button" className={`voice-toggle ${voice ? 'on' : ''}`} aria-pressed={voice} onClick={toggleVoice}>
            🎤 <span className="collapsible-label">Réponse vocale : {voice ? 'activée' : 'désactivée'}</span>
          </button>
        )}
        {cloud !== null && (
          <button
            type="button"
            className={`sync-badge ${sync.status}`}
            onClick={() => setScreen({ name: 'account' })}
            title={SYNC_LABELS[sync.status]}
          >
            ☁️ <span className="collapsible-label">{sync.user === null ? 'Se connecter' : SYNC_LABELS[sync.status]}</span>
          </button>
        )}
      </header>

      {error !== null && (
        <p role="alert" className="error">
          Erreur de stockage : {error}
        </p>
      )}

      {screen.name === 'home' && (
        <Home
          records={records}
          now={now}
          onStart={(exercise) => startSession(exercise, getExercise(exercise).defaultLength, null)}
          onShowProgress={(exercise) => setScreen({ name: 'progress', exercise })}
          onStartProgram={startProgram}
        />
      )}
      {screen.name === 'session' && (() => {
        const { Session } = getExercise(screen.exercise)
        return (
          <Session
            key={screen.key}
            startLevel={screen.startLevel}
            focus={screen.focus}
            length={screen.length}
            voice={voice}
            onFinish={finishSession}
            onQuit={home}
          />
        )
      })()}
      {screen.name === 'results' && (
        <Results
          config={getExercise(screen.exercise)}
          record={screen.record}
          onRestart={() => startSession(screen.exercise, getExercise(screen.exercise).defaultLength, null)}
          onHome={home}
        />
      )}
      {screen.name === 'progress' && <Progress config={getExercise(screen.exercise)} records={records} onBack={home} />}
      {screen.name === 'program-step' && (
        <ProgramStepScreen run={screen.run} onContinue={() => continueProgram(screen.run)} onStop={home} />
      )}
      {screen.name === 'program-summary' && <ProgramSummary run={screen.run} onHome={home} />}
      {screen.name === 'account' && cloud !== null && <AccountPanel auth={cloud.auth} sync={sync} onBack={home} />}
    </main>
    </SoundContext.Provider>
  )
}
