import type { CSSProperties } from 'react'
import { PROGRAMS, type ProgramId } from '../core/programs'
import { progressOf, sessionsOf } from '../core/stats'
import { trainingStreak } from '../core/streak'
import type { SessionRecord } from '../core/types'
import { DAILY_GOAL_XP, xpSummary } from '../core/xp'
import { ACTIVE_DOMAINS, DOMAIN_INFO, EXERCISES, getExercise } from './exercises'
import { Mascot } from './Mascot'
import { buildProgramContext } from './programContext'

interface Props {
  records: readonly SessionRecord[]
  now: Date
  onStart: (exercise: string) => void
  onShowProgress: (exercise: string) => void
  onStartProgram: (id: ProgramId) => void
}

function greeting(now: Date): string {
  const hour = now.getHours()
  if (hour < 5) return 'Encore debout ?'
  if (hour < 12) return 'Bonjour !'
  if (hour < 18) return 'Bon après-midi !'
  return 'Bonsoir !'
}

/** What Neuro says, from the day's progress. */
function coachLine(today: number, goalReached: boolean, streakDays: number, trainedToday: boolean): string {
  if (goalReached) return 'Objectif du jour atteint. Tout ce que tu fais en plus, c’est du bonus.'
  if (today > 0) return `Encore ${DAILY_GOAL_XP - today} XP pour l’objectif du jour.`
  if (streakDays > 0 && !trainedToday) return `Ta série de ${streakDays} jour${streakDays > 1 ? 's' : ''} t’attend : une séance pour la prolonger.`
  return 'Une petite séance pour bien démarrer ?'
}

export function Home({ records, now, onStart, onShowProgress, onStartProgram }: Props) {
  const streak = trainingStreak(records, now)
  const xp = xpSummary(records, now)
  const ctx = buildProgramContext(records)
  const [daily, ...otherPrograms] = PROGRAMS
  const dailySteps = daily!.steps(ctx)

  return (
    <section className="home">
      <div className="hero">
        <Mascot mood={xp.goalReached ? 'celebrate' : 'happy'} size={84} />
        <div className="hero-text">
          <h2>{greeting(now)}</h2>
          <p>{coachLine(xp.today, xp.goalReached, streak.days, streak.trainedToday)}</p>
          <div
            className="goal-track"
            role="progressbar"
            aria-label="Objectif du jour"
            aria-valuemin={0}
            aria-valuemax={DAILY_GOAL_XP}
            aria-valuenow={Math.min(xp.today, DAILY_GOAL_XP)}
          >
            <div className="goal-fill" style={{ width: `${xp.goalProgress * 100}%` }} />
            <span className="goal-label">
              {Math.min(xp.today, DAILY_GOAL_XP)} / {DAILY_GOAL_XP} XP aujourd’hui
            </span>
          </div>
        </div>
        <div className="hero-stats">
          <span className={`stat-chip flame ${streak.trainedToday ? 'lit' : ''}`} title="Jours d’affilée">
            🔥 {streak.days}
          </span>
          <span className="stat-chip xp" title="XP au total">
            ⚡ {xp.total}
          </span>
        </div>
      </div>

      <p className="streak">
        {streak.days === 0
          ? 'Aucune série en cours : une séance aujourd’hui pour la lancer.'
          : `🔥 Série : ${streak.days} jour${streak.days > 1 ? 's' : ''}`}
        {streak.trainedToday && ` · ${streak.sessionsToday} session${streak.sessionsToday > 1 ? 's' : ''} aujourd’hui`}
      </p>

      <h2 className="section-title">Programmes</h2>
      <article className="daily-card" aria-label={daily!.title}>
        <div>
          <h3>{daily!.title}</h3>
          <p className="steps-preview">{dailySteps.map((s) => getExercise(s.exercise).title).join(' → ')}</p>
        </div>
        <button type="button" className="big" onClick={() => onStartProgram(daily!.id)}>
          Démarrer
        </button>
      </article>

      <div className="program-row">
        {otherPrograms.map((program) => {
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
      {ACTIVE_DOMAINS.map((domain) => {
        const info = DOMAIN_INFO[domain]
        return (
          <section
            key={domain}
            className="domain-section"
            aria-label={info.title}
            style={{ '--domain': info.color } as CSSProperties}
          >
            <h3 className="domain-title">
              <span className="domain-icon" aria-hidden="true">
                {info.icon}
              </span>
              {info.title}
            </h3>
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
        )
      })}
    </section>
  )
}
