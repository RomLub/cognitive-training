import type { CategoryStats } from '../core/stats'
import { formatPercent, formatSeconds } from './format'

interface Props {
  stats: readonly CategoryStats[]
  labels: Readonly<Record<string, string>>
  order: readonly string[]
  /** Category to highlight as the current weak point. */
  weakest?: string | null
}

export function CategoryTable({ stats, labels, order, weakest = null }: Props) {
  const rows = order.flatMap((category) => stats.filter((s) => s.category === category))
  if (rows.length === 0) return <p className="muted">Pas encore de données par opération.</p>

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Opération</th>
            <th>Réponses</th>
            <th>Précision</th>
            <th>Temps moyen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.category} className={s.category === weakest ? 'weak' : undefined}>
              <td>
                {s.category} {labels[s.category] ?? ''}
              </td>
              <td>{s.items}</td>
              <td>{formatPercent(s.accuracy)}</td>
              <td>{formatSeconds(s.avgResponseMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
