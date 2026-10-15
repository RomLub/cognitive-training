import { accuracy, categoryStats, domainProgress, MIN_ITEMS_FOR_WEAKNESS, recentSessions, weakestCategory } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { OPERATOR_LABELS, OPERATOR_ORDER } from '../domains/calculation/labels'
import type { Operator } from '../domains/calculation/levels'
import { CategoryTable } from './CategoryTable'
import { formatDate, formatPercent, formatSeconds } from './format'

/** Per-operation stats only look at recent sessions so the weak point reflects the current state. */
const RECENT_WINDOW = 10

interface Props {
  records: readonly SessionRecord[]
  onBack: () => void
}

export function Progress({ records, onBack }: Props) {
  const calc = domainProgress('calculation', records)
  const opStats = categoryStats(recentSessions('calculation', records, RECENT_WINDOW))
  const weakest = weakestCategory(opStats)
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

      <h3>Par opération ({RECENT_WINDOW} dernières sessions)</h3>
      <p className={weakest === null ? 'muted' : 'weak-callout'}>
        {weakest === null
          ? `Aucun point faible identifié pour l'instant (minimum ${MIN_ITEMS_FOR_WEAKNESS} réponses par opération).`
          : `Point faible : ${OPERATOR_LABELS[weakest.category as Operator] ?? weakest.category} — ${formatPercent(weakest.accuracy)} de réussite.`}
      </p>
      <CategoryTable stats={opStats} labels={OPERATOR_LABELS} order={OPERATOR_ORDER} weakest={weakest?.category ?? null} />

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
