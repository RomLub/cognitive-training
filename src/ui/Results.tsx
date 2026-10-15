import { accuracy } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { formatPercent, formatSeconds } from './format'

interface Props {
  record: SessionRecord
  onRestart: () => void
  onHome: () => void
}

export function Results({ record, onRestart, onHome }: Props) {
  const levelDelta = record.endLevel - record.startLevel
  return (
    <section className="results">
      <h2>Session terminée</h2>
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
