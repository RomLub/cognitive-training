import type { ProgramStep } from '../core/programs'
import { accuracy } from '../core/stats'
import type { SessionRecord } from '../core/types'
import { getExercise } from './exercises'
import { sessionXp } from '../core/xp'
import { Celebration } from './Celebration'
import { formatPercent, formatSeconds } from './format'
import { instructionsFor } from './instructions'

export interface ProgramRun {
  title: string
  steps: ProgramStep[]
  completed: SessionRecord[]
}

function StepList({ run }: { run: ProgramRun }) {
  return (
    <ol className="step-list">
      {run.steps.map((step, i) => {
        const done = run.completed[i]
        const state = done !== undefined ? 'done' : i === run.completed.length ? 'current' : 'todo'
        return (
          <li key={i} className={state}>
            {getExercise(step.exercise).title} · {step.length} essais
            {done !== undefined && <span className="muted"> — {formatPercent(accuracy(done))}</span>}
          </li>
        )
      })}
    </ol>
  )
}

/** Between steps: shows where the user is and lets them take a breather before the next exercise. */
export function ProgramStepScreen({ run, onContinue, onStop }: { run: ProgramRun; onContinue: () => void; onStop: () => void }) {
  const next = run.steps[run.completed.length]
  if (next === undefined) throw new Error('ProgramStepScreen rendered with no step left')
  const config = getExercise(next.exercise)
  return (
    <section className="program-step">
      <h2>{run.title}</h2>
      <StepList run={run} />
      <div className="next-step">
        <p>
          Étape {run.completed.length + 1}/{run.steps.length} : <strong>{config.title}</strong>
        </p>
        <ul className="intro-rules">
          {instructionsFor(config.id).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div className="actions">
        <button type="button" onClick={onContinue} autoFocus>
          {run.completed.length === 0 ? 'Commencer' : 'Continuer'}
        </button>
        <button type="button" className="secondary" onClick={onStop}>
          Arrêter le programme
        </button>
      </div>
    </section>
  )
}

export function ProgramSummary({ run, onHome }: { run: ProgramRun; onHome: () => void }) {
  const items = run.completed.reduce((s, r) => s + r.items, 0)
  const correct = run.completed.reduce((s, r) => s + r.correct, 0)
  return (
    <section className="results">
      <Celebration
        title={`Programme terminé — ${run.title}`}
        accuracy={items === 0 ? 0 : correct / items}
        xp={run.completed.reduce((s, r) => s + sessionXp(r), 0)}
      />
      <dl className="stat-grid">
        <div>
          <dt>Précision globale</dt>
          <dd>{formatPercent(items === 0 ? 0 : correct / items)}</dd>
        </div>
        <div>
          <dt>Exercices</dt>
          <dd>{run.completed.length}</dd>
        </div>
      </dl>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Exercice</th>
              <th>Précision</th>
              <th>Temps moyen</th>
              <th>Niveau</th>
            </tr>
          </thead>
          <tbody>
            {run.completed.map((r) => (
              <tr key={r.id}>
                <td>{getExercise(r.exercise).title}</td>
                <td>{formatPercent(accuracy(r))}</td>
                <td>{formatSeconds(r.avgResponseMs)}</td>
                <td>
                  {r.startLevel} → {r.endLevel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="actions">
        <button type="button" onClick={onHome} autoFocus>
          Accueil
        </button>
      </div>
    </section>
  )
}
