import { useMemo, useState } from 'react'
import { domainProgress } from './core/stats'
import type { SessionRecord } from './core/types'
import { MIN_LEVEL } from './domains/calculation/levels'
import { LocalStorageSessionRepository, type SessionRepository } from './storage/sessionRepository'
import { CalculationSession } from './ui/CalculationSession'
import { Home } from './ui/Home'
import { Progress } from './ui/Progress'
import { Results } from './ui/Results'

type Screen =
  | { name: 'home' }
  | { name: 'calculation'; startLevel: number; key: number }
  | { name: 'results'; record: SessionRecord }
  | { name: 'progress' }

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

  function startCalculation() {
    const startLevel = domainProgress('calculation', records).currentLevel ?? MIN_LEVEL
    setScreen({ name: 'calculation', startLevel, key: Date.now() })
  }

  function finishSession(record: SessionRecord) {
    try {
      repo.add(record)
      setState(loadRecords(repo))
    } catch (err) {
      console.error('Failed to save session', err)
      setState((s) => ({ ...s, error: `Session non enregistrée : ${err instanceof Error ? err.message : String(err)}` }))
    }
    setScreen({ name: 'results', record })
  }

  const home = () => setScreen({ name: 'home' })

  return (
    <main className="app">
      <header className="app-header">
        <h1>
          <button type="button" className="brand" onClick={home}>
            Cognitive Training
          </button>
        </h1>
      </header>

      {error !== null && (
        <p role="alert" className="error">
          Erreur de stockage : {error}
        </p>
      )}

      {screen.name === 'home' && (
        <Home records={records} onStartCalculation={startCalculation} onShowProgress={() => setScreen({ name: 'progress' })} />
      )}
      {screen.name === 'calculation' && (
        <CalculationSession key={screen.key} startLevel={screen.startLevel} onFinish={finishSession} onQuit={home} />
      )}
      {screen.name === 'results' && <Results record={screen.record} onRestart={startCalculation} onHome={home} />}
      {screen.name === 'progress' && <Progress records={records} onBack={home} />}
    </main>
  )
}
