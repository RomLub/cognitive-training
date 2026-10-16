export type MascotMood = 'happy' | 'neutral' | 'sad' | 'celebrate'

const MOUTHS: Record<MascotMood, string> = {
  happy: 'M43 66 Q50 73 57 66',
  neutral: 'M44 68 L56 68',
  sad: 'M43 70 Q50 64 57 70',
  celebrate: 'M41 63 Q50 78 59 63 Z',
}

/** Neuro, the app's mascot: a round little brain whose face follows the user's answers. */
export function Mascot({ mood = 'happy', size = 72 }: { mood?: MascotMood; size?: number }) {
  return (
    <svg className={`mascot mascot-${mood}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {/* Two lobes and the stem */}
      <path
        className="mascot-body"
        d="M50 20 C34 12 16 22 16 40 C8 46 10 64 22 70 C26 82 42 86 50 80 C58 86 74 82 78 70 C90 64 92 46 84 40 C84 22 66 12 50 20 Z"
      />
      <path className="mascot-fold" d="M50 22 L50 46 M32 32 Q38 38 34 46 M68 32 Q62 38 66 46 M24 54 Q30 52 32 58 M76 54 Q70 52 68 58" />
      {/* Eyes: closed arcs when celebrating */}
      {mood === 'celebrate' ? (
        <path className="mascot-mouth" d="M34 52 Q39 46 44 52 M56 52 Q61 46 66 52" />
      ) : (
        <>
          <ellipse cx="39" cy="52" rx="6" ry="7" fill="#fff" />
          <ellipse cx="61" cy="52" rx="6" ry="7" fill="#fff" />
          <circle cx={mood === 'sad' ? 39 : 40} cy={mood === 'sad' ? 54 : 53} r="3.2" fill="#2b2645" />
          <circle cx={mood === 'sad' ? 61 : 62} cy={mood === 'sad' ? 54 : 53} r="3.2" fill="#2b2645" />
        </>
      )}
      <circle cx="29" cy="62" r="4" className="mascot-cheek" />
      <circle cx="71" cy="62" r="4" className="mascot-cheek" />
      <path className={`mascot-mouth ${mood === 'celebrate' ? 'open' : ''}`} d={MOUTHS[mood]} />
    </svg>
  )
}
