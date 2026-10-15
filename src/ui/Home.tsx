import { domainProgress } from '../core/stats'
import type { CognitiveDomain, SessionRecord } from '../core/types'
import { DOMAIN_UI, TRAINABLE_DOMAINS, type TrainableDomain } from './domains'

interface Props {
  records: readonly SessionRecord[]
  onStart: (domain: TrainableDomain) => void
  onShowProgress: (domain: TrainableDomain) => void
}

const UPCOMING: ReadonlyArray<{ domain: CognitiveDomain; label: string }> = [
  { domain: 'attention', label: 'Attention' },
  { domain: 'logic', label: 'Logique' },
  { domain: 'speed', label: 'Vitesse de traitement' },
]

export function Home({ records, onStart, onShowProgress }: Props) {
  return (
    <section>
      <div className="domain-grid">
        {TRAINABLE_DOMAINS.map((domain) => {
          const config = DOMAIN_UI[domain]
          const progress = domainProgress(domain, records)
          return (
            <article key={domain} className="domain-card active" aria-label={config.title}>
              <h2>{config.title}</h2>
              <p className="muted">
                {progress.sessions === 0
                  ? config.description
                  : `Niveau ${progress.currentLevel} · ${progress.sessions} session${progress.sessions > 1 ? 's' : ''}`}
              </p>
              <div className="actions">
                <button type="button" onClick={() => onStart(domain)}>
                  Commencer
                </button>
                <button type="button" className="secondary" onClick={() => onShowProgress(domain)}>
                  Progrès
                </button>
              </div>
            </article>
          )
        })}
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
