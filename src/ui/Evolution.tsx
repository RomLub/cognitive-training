import { BASELINE_SESSIONS, type Evolution } from '../core/baseline'
import { formatPercent, formatSeconds } from './format'

function formatLevel(level: number): string {
  return level.toFixed(1).replace('.', ',')
}

interface DeltaProps {
  value: number
  /** True when a positive delta is good (level, accuracy), false when lower is better (time). */
  higherIsBetter: boolean
  format: (abs: number) => string
}

/** Signed delta with an arrow, so direction never relies on color alone. */
function Delta({ value, higherIsBetter, format }: DeltaProps) {
  if (Math.abs(value) < 1e-9) return <span className="muted">= stable</span>
  const good = value > 0 === higherIsBetter
  return (
    <span className={good ? 'delta ok' : 'delta ko'}>
      {value > 0 ? '▲ +' : '▼ −'}
      {format(Math.abs(value))}
    </span>
  )
}

export function EvolutionPanel({ evolution }: { evolution: Evolution }) {
  if (evolution.status === 'none') return <p className="muted">Ta ligne de base se construira sur tes {BASELINE_SESSIONS} premières sessions.</p>
  if (evolution.status === 'building') {
    return (
      <p className="muted">
        Ligne de base en cours : {evolution.baseline.sessions}/{BASELINE_SESSIONS} sessions. L’évolution s’affichera à la
        session suivante.
      </p>
    )
  }
  const { baseline, current } = evolution
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>Départ</th>
              <th>Aujourd’hui</th>
              <th>Évolution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Niveau</td>
              <td>{formatLevel(baseline.level)}</td>
              <td>{formatLevel(current.level)}</td>
              <td>
                <Delta value={current.level - baseline.level} higherIsBetter format={formatLevel} />
              </td>
            </tr>
            <tr>
              <td>Précision</td>
              <td>{formatPercent(baseline.accuracy)}</td>
              <td>{formatPercent(current.accuracy)}</td>
              <td>
                <Delta
                  value={Math.round((current.accuracy - baseline.accuracy) * 100)}
                  higherIsBetter
                  format={(n) => `${n} pts`}
                />
              </td>
            </tr>
            <tr>
              <td>Temps moyen</td>
              <td>{formatSeconds(baseline.avgResponseMs)}</td>
              <td>{formatSeconds(current.avgResponseMs)}</td>
              <td>
                <Delta
                  value={Math.round((current.avgResponseMs - baseline.avgResponseMs) / 100) / 10}
                  higherIsBetter={false}
                  format={(n) => `${n.toFixed(1).replace('.', ',')} s`}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Départ = tes {baseline.sessions} premières sessions ; aujourd’hui = tes {current.sessions} dernières. Le temps
        dépend du niveau : à niveau plus élevé, un temps stable est déjà un progrès.
      </p>
    </>
  )
}
