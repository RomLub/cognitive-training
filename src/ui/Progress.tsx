import { evolutionOf } from '../core/baseline'
import { RECENT_WINDOW } from '../core/focus'
import { accuracy, MIN_ITEMS_FOR_WEAKNESS, progressOf, sessionsOf } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { CategoryTable } from './CategoryTable'
import { analyzeExercise, DOMAIN_INFO, type ExerciseUi } from './exercises'
import { EvolutionPanel } from './Evolution'
import { capitalize, formatDate, formatPercent, formatSeconds } from './format'
import { LevelChart } from './LevelChart'

interface Props {
  config: ExerciseUi
  records: readonly SessionRecord[]
  onBack: () => void
}

export function Progress({ config, records, onBack }: Props) {
  const history = sessionsOf(records, config.id)
  const progress = progressOf(history)
  const { stats, weakest } = analyzeExercise(config, records)
  const sessions = history.toReversed()

  return (
    <section className="progress-page">
      <header className="page-header">
        <h2>
          Progrès — {config.title} <span className="muted small">{DOMAIN_INFO[config.domain].title}</span>
        </h2>
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

      <h3>Niveau en fin de session</h3>
      <LevelChart records={sessions} bounds={config.bounds} />

      <h3>Depuis le début</h3>
      <EvolutionPanel evolution={evolutionOf(history)} />

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
