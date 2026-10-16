import { PROGRAMS, type ProgramId } from '../core/programs'
import { progressOf, sessionsOf } from '../core/stats'
import { trainingStreak } from '../core/streak'
import type { SessionRecord } from '../core/types'
import { ACTIVE_DOMAINS, DOMAIN_INFO, EXERCISES, getExercise } from './exercises'
import { buildProgramContext } from './programContext'

interface Props {
  records: readonly SessionRecord[]
  now: Date
  onStart: (exercise: string) => void
  onShowProgress: (exercise: string) => void
  onStartProgram: (id: ProgramId) => void
}

export function Home({ records, now, onStart, onShowProgress, onStartProgram }: Props) {
  const streak = trainingStreak(records, now)
  const ctx = buildProgramContext(records)

  return (
    <section>
      <p className="streak">
        {streak.days === 0
          ? 'Aucune série en cours : une séance aujourd’hui pour la lancer.'
          : `🔥 Série : ${streak.days} jour${streak.days > 1 ? 's' : ''}`}
        {streak.trainedToday && ` · ${streak.sessionsToday} session${streak.sessionsToday > 1 ? 's' : ''} aujourd’hui`}
        {streak.days > 0 && !streak.trainedToday && ' · entraîne-toi aujourd’hui pour la prolonger'}
      </p>

      <h2 className="section-title">Programmes</h2>
      <div className="domain-grid">
        {PROGRAMS.map((program) => {
          const steps = program.steps(ctx)
          return (
            <article key={program.id} className="domain-card program" aria-label={program.title}>
              <h3>{program.title}</h3>
              <p className="muted">
                ~{program.minutes} min · {program.description}
              </p>
              <p className="steps-preview">
                {steps.length === 0 ? 'Tu as déjà tout essayé.' : steps.map((s) => getExercise(s.exercise).title).join(' → ')}
              </p>
              <div className="actions">
                <button type="button" onClick={() => onStartProgram(program.id)} disabled={steps.length === 0}>
                  Démarrer
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <h2 className="section-title">Exercices</h2>
      {ACTIVE_DOMAINS.map((domain) => (
        <section key={domain} className="domain-section" aria-label={DOMAIN_INFO[domain].title}>
          <h3 className="domain-title">{DOMAIN_INFO[domain].title}</h3>
          <div className="domain-grid">
            {EXERCISES.filter((e) => e.domain === domain).map((exercise) => {
              const progress = progressOf(sessionsOf(records, exercise.id))
              return (
                <article key={exercise.id} className="domain-card active" aria-label={exercise.title}>
                  <h4>{exercise.title}</h4>
                  <p className="muted">
                    {progress.sessions === 0
                      ? exercise.description
                      : `Niveau ${progress.currentLevel}/${exercise.bounds.max} · ${progress.sessions} session${progress.sessions > 1 ? 's' : ''}`}
                  </p>
                  <div className="actions">
                    <button type="button" onClick={() => onStart(exercise.id)}>
                      Commencer
                    </button>
                    <button type="button" className="secondary" onClick={() => onShowProgress(exercise.id)}>
                      Progrès
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </section>
  )
}
