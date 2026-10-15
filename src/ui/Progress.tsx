import { accuracy, domainProgress } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { formatDate, formatPercent, formatSeconds } from './format'

interface Props {
  records: readonly SessionRecord[]
  onBack: () => void
}

export function Progress({ records, onBack }: Props) {
  const calc = domainProgress('calculation', records)
  const sessions = records.filter((r) => r.domain === 'calculation').toReversed()

  return (
    <section className="progress-page">
      <header className="page-header">
        <h2>Progrès — Calcul mental</h2>
        <button type="button" className="link" onClick={onBack}>
          ← Accueil
        </button>
      </header>

      <dl className="stat-grid">
        <div>
          <dt>Sessions</dt>
          <dd>{calc.sessions}</dd>
        </div>
        <div>
          <dt>Niveau actuel</dt>
          <dd>{calc.currentLevel ?? '—'}</dd>
        </div>
        <div>
          <dt>Meilleur niveau</dt>
          <dd>{calc.bestLevel ?? '—'}</dd>
        </div>
        <div>
          <dt>Tendance précision</dt>
          <dd>{calc.accuracyTrend === null ? '—' : `${calc.accuracyTrend >= 0 ? '+' : ''}${Math.round(calc.accuracyTrend * 100)} pts`}</dd>
        </div>
      </dl>

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
