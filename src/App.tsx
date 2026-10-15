import { useMemo, useState } from 'react'
import { getProgram, type ProgramId } from './core/programs'
import { domainProgress } from './core/stats'
import type { SessionRecord } from './core/types'
import { LocalStorageSessionRepository, type SessionRepository } from './storage/sessionRepository'
import { DOMAIN_UI, type TrainableDomain } from './ui/domains'
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
      domain: TrainableDomain
      startLevel: number
      focus: string | null
      length: number
      key: number
      /** Set when the session is a step of a program. */
      run: ProgramRun | null
    }
  | { name: 'results'; domain: TrainableDomain; record: SessionRecord }
  | { name: 'progress'; domain: TrainableDomain }
  | { name: 'program-step'; run: ProgramRun }
  | { name: 'program-summary'; run: ProgramRun }

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

export default function App({ repository }: { repository?: SessionRepository }) {
  const repo = useMemo(() => repository ?? new LocalStorageSessionRepository(), [repository])
  const [{ records, error }, setState] = useState(() => loadRecords(repo))
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [voiceSupported] = useState(isSpeechSupported)
  const [voice, setVoice] = useState(() => voiceSupported && loadVoicePreference())
  // Refreshed whenever the home screen is shown, for the streak.
  const [now, setNow] = useState(() => new Date())

  function toggleVoice() {
    setVoice((on) => {
      saveVoicePreference(!on)
      return !on
    })
  }

  function startSession(domain: TrainableDomain, length: number, run: ProgramRun | null) {
    const config = DOMAIN_UI[domain]
    setScreen({
      name: 'session',
      domain,
      startLevel: domainProgress(domain, records).currentLevel ?? config.bounds.min,
      focus: config.analyze(records).weakest?.category ?? null,
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
    } catch (err) {
      console.error('Failed to save session', err)
      setState((s) => ({ ...s, error: `Session non enregistrée : ${err instanceof Error ? err.message : String(err)}` }))
    }
    if (screen.name !== 'session') throw new Error(`Session finished on screen ${screen.name}`)
    if (screen.run === null) {
      setScreen({ name: 'results', domain: record.domain, record })
      return
    }
    const run = { ...screen.run, completed: [...screen.run.completed, record] }
    setScreen(run.completed.length < run.steps.length ? { name: 'program-step', run } : { name: 'program-summary', run })
  }

  function continueProgram(run: ProgramRun) {
    const step = run.steps[run.completed.length]
    if (step === undefined) throw new Error('No program step left')
    startSession(step.domain, step.length, run)
  }

  const home = () => {
    setNow(new Date())
    setScreen({ name: 'home' })
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>
          <button type="button" className="brand" onClick={home}>
            Cognitive Training
          </button>
        </h1>
        {voiceSupported && (
          <button type="button" className={`voice-toggle ${voice ? 'on' : ''}`} aria-pressed={voice} onClick={toggleVoice}>
            🎤 Réponse vocale : {voice ? 'activée' : 'désactivée'}
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
          onStart={(domain) => startSession(domain, DOMAIN_UI[domain].defaultLength, null)}
          onShowProgress={(domain) => setScreen({ name: 'progress', domain })}
          onStartProgram={startProgram}
        />
      )}
      {screen.name === 'session' && (() => {
        const { Session } = DOMAIN_UI[screen.domain]
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
          config={DOMAIN_UI[screen.domain]}
          record={screen.record}
          onRestart={() => startSession(screen.domain, DOMAIN_UI[screen.domain].defaultLength, null)}
          onHome={home}
        />
      )}
      {screen.name === 'progress' && <Progress config={DOMAIN_UI[screen.domain]} records={records} onBack={home} />}
      {screen.name === 'program-step' && (
        <ProgramStepScreen run={screen.run} onContinue={() => continueProgram(screen.run)} onStop={home} />
      )}
      {screen.name === 'program-summary' && <ProgramSummary run={screen.run} onHome={home} />}
    </main>
  )
}
