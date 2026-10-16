import type { CSSProperties } from 'react'
import { DOMAIN_INFO, type ExerciseUi } from './exercises'
import { instructionsFor } from './instructions'
import { Mascot } from './Mascot'

interface Props {
  config: ExerciseUi
  startLevel: number
  focusLabel: string | null
  length: number
  onStart: () => void
  onBack: () => void
}

/** Rules first, clock later: nothing runs until the user presses "C'est parti !" (or Enter). */
export function ExerciseIntro({ config, startLevel, focusLabel, length, onStart, onBack }: Props) {
  const domain = DOMAIN_INFO[config.domain]
  return (
    <section className="intro" style={{ '--domain': domain.color } as CSSProperties}>
      <div className="intro-head">
        <span className="domain-icon" aria-hidden="true">
          {domain.icon}
        </span>
        <div>
          <p className="muted intro-domain">{domain.title}</p>
          <h2>{config.title}</h2>
        </div>
      </div>

      <div className="intro-card">
        <Mascot mood="happy" size={56} />
        <ul className="intro-rules">
          {instructionsFor(config.id).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <p className="intro-meta">
        Niveau {startLevel}/{config.bounds.max} · {length} essais
        {focusLabel !== null && <> · on insiste sur : {focusLabel}</>}
      </p>

      <div className="actions intro-actions">
        <button type="button" className="big" onClick={onStart} autoFocus>
          C’est parti !
        </button>
        <button type="button" className="link" onClick={onBack}>
          Retour
        </button>
      </div>
    </section>
  )
}
