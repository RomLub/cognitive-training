import { PROGRAMS, type ProgramId } from '../core/programs'
import { domainProgress } from '../core/stats'
import { trainingStreak } from '../core/streak'
import type { SessionRecord } from '../core/types'
import { DOMAIN_UI, TRAINABLE_DOMAINS, type TrainableDomain } from './domains'
import { buildProgramContext } from './programContext'

interface Props {
  records: readonly SessionRecord[]
  now: Date
  onStart: (domain: TrainableDomain) => void
  onShowProgress: (domain: TrainableDomain) => void
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
        {PROGRAMS.map((program) => (
          <article key={program.id} className="domain-card program" aria-label={program.title}>
            <h3>{program.title}</h3>
            <p className="muted">
              ~{program.minutes} min · {program.description}
            </p>
            <p className="steps-preview">{program.steps(ctx).map((s) => DOMAIN_UI[s.domain].title).join(' → ')}</p>
            <div className="actions">
              <button type="button" onClick={() => onStartProgram(program.id)}>
                Démarrer
              </button>
            </div>
          </article>
        ))}
      </div>

      <h2 className="section-title">Exercices</h2>
      <div className="domain-grid">
        {TRAINABLE_DOMAINS.map((domain) => {
          const config = DOMAIN_UI[domain]
          const progress = domainProgress(domain, records)
          return (
            <article key={domain} className="domain-card active" aria-label={config.title}>
              <h3>{config.title}</h3>
              <p className="muted">
                {progress.sessions === 0
                  ? config.description
                  : `Niveau ${progress.currentLevel} · ${progress.sessions} session${progress.sessions > 1 ? 's' : ''}`}
              </p>
              <div className="actions">
                <button type="button" onClick={() => onStart(domain)}>
                  Commencer
                </button>
                <button type="button" className="secondary" onClick={() => onShowProgress(domain)}>
                  Progrès
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
