import { domainProgress } from '../core/stats'
import type { CognitiveDomain, SessionRecord } from '../core/types'

interface Props {
  records: readonly SessionRecord[]
  onStartCalculation: () => void
  onShowProgress: () => void
}

const UPCOMING: ReadonlyArray<{ domain: CognitiveDomain; label: string }> = [
  { domain: 'memory', label: 'Mémoire de travail' },
  { domain: 'attention', label: 'Attention' },
  { domain: 'logic', label: 'Logique' },
  { domain: 'speed', label: 'Vitesse de traitement' },
]

export function Home({ records, onStartCalculation, onShowProgress }: Props) {
  const calc = domainProgress('calculation', records)
  return (
    <section>
      <div className="domain-grid">
        <article className="domain-card active">
          <h2>Calcul mental</h2>
          <p className="muted">
            {calc.sessions === 0
              ? '20 opérations, difficulté adaptative.'
              : `Niveau ${calc.currentLevel} · ${calc.sessions} session${calc.sessions > 1 ? 's' : ''}`}
          </p>
          <div className="actions">
            <button type="button" onClick={onStartCalculation}>
              Commencer
            </button>
            <button type="button" className="secondary" onClick={onShowProgress}>
              Progrès
            </button>
          </div>
        </article>
        {UPCOMING.map((d) => (
          <article key={d.domain} className="domain-card disabled" aria-disabled="true">
            <h2>{d.label}</h2>
            <p className="muted">Bientôt</p>
          </article>
        ))}
      </div>
    </section>
  )
}
