import { RECENT_WINDOW } from '../core/focus'
import { accuracy, domainProgress, MIN_ITEMS_FOR_WEAKNESS } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { CategoryTable } from './CategoryTable'
import type { DomainUi } from './domains'
import { capitalize, formatDate, formatPercent, formatSeconds } from './format'

interface Props {
  config: DomainUi
  records: readonly SessionRecord[]
  onBack: () => void
}

export function Progress({ config, records, onBack }: Props) {
  const progress = domainProgress(config.domain, records)
  const { stats, weakest } = config.analyze(records)
  const sessions = records.filter((r) => r.domain === config.domain).toReversed()

  return (
    <section className="progress-page">
      <header className="page-header">
        <h2>Progrès — {config.title}</h2>
        <button type="button" className="link" onClick={onBack}>
          ← Accueil
        </button>
      </header>

      <dl className="stat-grid">
        <div>
          <dt>Sessions</dt>
          <dd>{progress.sessions}</dd>
        </div>
        <div>
          <dt>Niveau actuel</dt>
          <dd>{progress.currentLevel ?? '—'}</dd>
        </div>
        <div>
          <dt>Meilleur niveau</dt>
          <dd>{progress.bestLevel ?? '—'}</dd>
        </div>
        <div>
          <dt>Tendance précision</dt>
          <dd>
            {progress.accuracyTrend === null
              ? '—'
              : `${progress.accuracyTrend >= 0 ? '+' : ''}${Math.round(progress.accuracyTrend * 100)} pts`}
          </dd>
        </div>
      </dl>

      <h3>
        Par {config.categoryNoun} ({RECENT_WINDOW} dernières sessions)
      </h3>
      <p className={weakest === null ? 'muted' : 'weak-callout'}>
        {weakest === null
          ? `Aucun point faible identifié pour l'instant (minimum ${MIN_ITEMS_FOR_WEAKNESS} réponses par ${config.categoryNoun}).`
          : `Point faible : ${config.labels[weakest.category] ?? weakest.category} — ${formatPercent(weakest.accuracy)} de réussite. Les prochaines sessions insistent dessus.`}
      </p>
      <CategoryTable
        stats={stats}
        labels={config.labels}
        header={capitalize(config.categoryNoun)}
        order={config.order}
        weakest={weakest?.category ?? null}
      />

      <h3>Historique</h3>
      {sessions.length === 0 ? (
        <p className="muted">Aucune session pour l'instant.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Niveau</th>
                <th>Précision</th>
                <th>Temps moyen</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.startedAt)}</td>
                  <td>
                    {r.startLevel} → {r.endLevel}
                  </td>
                  <td>{formatPercent(accuracy(r))}</td>
                  <td>{formatSeconds(r.avgResponseMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
