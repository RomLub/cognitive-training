import { accuracy, categoryStats } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { CategoryTable } from './CategoryTable'
import type { DomainUi } from './domains'
import { capitalize, formatPercent, formatSeconds } from './format'

interface Props {
  config: DomainUi
  record: SessionRecord
  onRestart: () => void
  onHome: () => void
}

export function Results({ config, record, onRestart, onHome }: Props) {
  const levelDelta = record.endLevel - record.startLevel
  return (
    <section className="results">
      <h2>Session terminée — {config.title}</h2>
      <dl className="stat-grid">
        <div>
          <dt>Précision</dt>
          <dd>{formatPercent(accuracy(record))}</dd>
        </div>
        <div>
          <dt>Temps moyen</dt>
          <dd>{formatSeconds(record.avgResponseMs)}</dd>
        </div>
        <div>
          <dt>Niveau</dt>
          <dd>
            {record.startLevel} → {record.endLevel}
            {levelDelta !== 0 && <small>{levelDelta > 0 ? ` (+${levelDelta})` : ` (${levelDelta})`}</small>}
          </dd>
        </div>
      </dl>
      {record.endLevel >= config.bounds.max && (
        <p className="max-level" role="status">
          🏁 Niveau maximal atteint ({config.bounds.max}) : cet exercice ne te met plus en difficulté. Il faudra l’étendre.
        </p>
      )}
      <h3>Par {config.categoryNoun}</h3>
      <CategoryTable
        stats={categoryStats([record])}
        labels={config.labels}
        header={capitalize(config.categoryNoun)}
        order={config.order}
      />
      <div className="actions">
        <button type="button" onClick={onRestart}>
          Nouvelle session
        </button>
        <button type="button" className="secondary" onClick={onHome}>
          Accueil
        </button>
      </div>
    </section>
  )
}
