import { useState, type PointerEvent } from 'react'
import type { LevelBounds } from '../core/adaptive'
import { accuracy } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { formatPercent } from './format'

interface Props {
  /** Sessions of one domain, any order. */
  records: readonly SessionRecord[]
  bounds: LevelBounds
}

const WIDTH = 640
const HEIGHT = 200
const MARGIN = { top: 12, right: 56, bottom: 24, left: 32 }
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom

/**
 * Evenly spaced y ticks including both bounds: 1-4-7-10 for 10 levels, 1-5-10-15-20 for 20.
 * Never two ticks closer than half a step, so labels cannot collide.
 */
function levelTicks(bounds: LevelBounds): number[] {
  const range = bounds.max - bounds.min
  const step = range <= 9 ? 3 : 5
  if (range % step === 0) {
    return Array.from({ length: range / step + 1 }, (_, i) => bounds.min + i * step)
  }
  const ticks = [bounds.min]
  for (let t = Math.ceil((bounds.min + 1) / step) * step; t < bounds.max; t += step) {
    if (t - bounds.min >= step / 2) ticks.push(t)
  }
  if (bounds.max - ticks.at(-1)! < step / 2) ticks.pop()
  ticks.push(bounds.max)
  return ticks
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

/** Single-series line chart of the end level per session, with a snapping crosshair and tooltip. */
export function LevelChart({ records, bounds }: Props) {
  const sessions = records.toSorted((x, y) => x.startedAt.localeCompare(y.startedAt))
  const [hover, setHover] = useState<number | null>(null)

  if (sessions.length < 2) {
    return <p className="muted">Le graphique apparaîtra après 2 sessions.</p>
  }

  const x = (i: number) => MARGIN.left + (i / (sessions.length - 1)) * PLOT_W
  const y = (level: number) => MARGIN.top + (1 - (level - bounds.min) / (bounds.max - bounds.min)) * PLOT_H
  const points = sessions.map((s, i) => ({ x: x(i), y: y(s.endLevel), session: s }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = points.at(-1)!
  const hovered = hover === null ? null : points[hover]

  function onPointerMove(event: PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
    if (rect === undefined || rect.width === 0) return
    // Snap to the nearest session along X.
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH
    const i = Math.round(((svgX - MARGIN.left) / PLOT_W) * (sessions.length - 1))
    setHover(Math.max(0, Math.min(sessions.length - 1, i)))
  }

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Niveau en fin de session sur ${sessions.length} sessions, actuellement ${last.session.endLevel}`}
      >
        {levelTicks(bounds).map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={MARGIN.left} x2={MARGIN.left + PLOT_W} y1={y(t)} y2={y(t)} />
            <text className="chart-axis" x={MARGIN.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
              {t}
            </text>
          </g>
        ))}
        <text className="chart-axis" x={MARGIN.left} y={HEIGHT - 6} textAnchor="start">
          {shortDate(sessions[0]!.startedAt)}
        </text>
        <text className="chart-axis" x={MARGIN.left + PLOT_W} y={HEIGHT - 6} textAnchor="end">
          {shortDate(last.session.startedAt)}
        </text>

        {hovered !== null && hovered !== undefined && (
          <line className="chart-crosshair" x1={hovered.x} x2={hovered.x} y1={MARGIN.top} y2={MARGIN.top + PLOT_H} />
        )}
        <path className="chart-line" d={path} />
        {points.map((p, i) => (
          <circle key={p.session.id} className={`chart-dot ${i === hover ? 'active' : ''}`} cx={p.x} cy={p.y} r={4} />
        ))}
        <text className="chart-end-label" x={last.x + 10} y={last.y} dominantBaseline="middle">
          Niv. {last.session.endLevel}
        </text>

        {/* Hit area larger than the marks: the whole plot. */}
        <rect
          x={MARGIN.left - 8}
          y={0}
          width={PLOT_W + 16}
          height={HEIGHT}
          fill="transparent"
          data-testid="chart-hit-area"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hovered !== null && hovered !== undefined && (
        <div
          className="chart-tooltip"
          role="tooltip"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
        >
          <strong>{new Date(hovered.session.startedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</strong>
          <span>
            Niveau {hovered.session.startLevel} → {hovered.session.endLevel}
          </span>
          <span>Précision {formatPercent(accuracy(hovered.session))}</span>
        </div>
      )}
    </div>
  )
}
