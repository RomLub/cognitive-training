import { useMemo, useState } from 'react'
import { domainProgress } from './core/stats'
import type { SessionRecord } from './core/types'
import { analyzeOperators } from './domains/calculation/focus'
import { LEVEL_BOUNDS as CALC_BOUNDS, type Operator } from './domains/calculation/levels'
import { analyzeSpanModes } from './domains/memory/focus'
import { LEVEL_BOUNDS as MEMORY_BOUNDS, type SpanMode } from './domains/memory/span'
import { LocalStorageSessionRepository, type SessionRepository } from './storage/sessionRepository'
import { CalculationSession } from './ui/CalculationSession'
import { DOMAIN_UI, isTrainableDomain, type TrainableDomain } from './ui/domains'
import { Home } from './ui/Home'
import { MemorySession } from './ui/MemorySession'
import { Progress } from './ui/Progress'
import { Results } from './ui/Results'

type Screen =
  | { name: 'home' }
  | { name: 'calculation'; startLevel: number; focus: Operator | null; key: number }
  | { name: 'memory'; startLevel: number; focus: SpanMode | null; key: number }
  | { name: 'results'; domain: TrainableDomain; record: SessionRecord }
  | { name: 'progress'; domain: TrainableDomain }

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

  function startSession(domain: TrainableDomain) {
    const key = Date.now()
    switch (domain) {
      case 'calculation':
        setScreen({
          name: 'calculation',
          startLevel: domainProgress('calculation', records).currentLevel ?? CALC_BOUNDS.min,
          focus: analyzeOperators(records).weakest?.category ?? null,
          key,
        })
        return
      case 'memory':
        setScreen({
          name: 'memory',
          startLevel: domainProgress('memory', records).currentLevel ?? MEMORY_BOUNDS.min,
          focus: analyzeSpanModes(records).weakest?.category ?? null,
          key,
        })
        return
    }
  }

  function finishSession(record: SessionRecord) {
    if (!isTrainableDomain(record.domain)) throw new Error(`Session finished for untrainable domain: ${record.domain}`)
    try {
      repo.add(record)
      setState(loadRecords(repo))
    } catch (err) {
      console.error('Failed to save session', err)
      setState((s) => ({ ...s, error: `Session non enregistrée : ${err instanceof Error ? err.message : String(err)}` }))
    }
    setScreen({ name: 'results', domain: record.domain, record })
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
        <Home records={records} onStart={startSession} onShowProgress={(domain) => setScreen({ name: 'progress', domain })} />
      )}
      {screen.name === 'calculation' && (
        <CalculationSession key={screen.key} startLevel={screen.startLevel} focus={screen.focus} onFinish={finishSession} onQuit={home} />
      )}
      {screen.name === 'memory' && (
        <MemorySession key={screen.key} startLevel={screen.startLevel} focus={screen.focus} onFinish={finishSession} onQuit={home} />
      )}
      {screen.name === 'results' && (
        <Results
          config={DOMAIN_UI[screen.domain]}
          record={screen.record}
          onRestart={() => startSession(screen.domain)}
          onHome={home}
        />
      )}
      {screen.name === 'progress' && <Progress config={DOMAIN_UI[screen.domain]} records={records} onBack={home} />}
    </main>
  )
}
