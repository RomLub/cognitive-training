import { useContext, useEffect } from 'react'
import { Mascot, type MascotMood } from './Mascot'
import { sounds } from './sound'
import { SoundContext } from './soundContext'

const CONFETTI_COLORS = ['#7b5cfa', '#2ec4a0', '#ffc233', '#ff5d6c', '#3d8bff', '#ff8a3d']

function verdict(accuracy: number): { mood: MascotMood; line: string } {
  if (accuracy >= 0.9) return { mood: 'celebrate', line: 'Impressionnant !' }
  if (accuracy >= 0.7) return { mood: 'happy', line: 'Belle session !' }
  if (accuracy >= 0.5) return { mood: 'neutral', line: 'Pas mal, ça progresse.' }
  return { mood: 'sad', line: 'Session difficile : le niveau s’ajuste pour la prochaine fois.' }
}

/** End-of-session header: mascot, XP won and, for good sessions, a short burst of confetti. */
export function Celebration({ title, accuracy, xp }: { title: string; accuracy: number; xp: number }) {
  const soundOn = useContext(SoundContext)
  const { mood, line } = verdict(accuracy)

  useEffect(() => {
    if (soundOn) sounds.finish()
  }, [soundOn])

  return (
    <div className="celebration">
      {accuracy >= 0.7 && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 6) * 70}ms`,
              }}
            />
          ))}
        </div>
      )}
      <Mascot mood={mood} size={96} />
      <h2>{title}</h2>
      <p className="celebration-line">{line}</p>
      <p className="xp-won" aria-label={`${xp} points d’expérience gagnés`}>
        +{xp} XP
      </p>
    </div>
  )
}
