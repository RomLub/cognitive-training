import type { LevelBounds } from '../../core/adaptive'
import { pick, randInt } from '../../core/random'
import type { Rng } from '../../core/types'

/**
 * Multi-step word problems: ages, mixtures, shared work, motion and counting. Numbers are drawn so that
 * the answer is always a whole number; higher levels unlock problems with more steps.
 */
export type ProblemKind = 'ages' | 'mixture' | 'work' | 'motion' | 'counting'

export const PROBLEM_KINDS: readonly ProblemKind[] = ['ages', 'mixture', 'work', 'motion', 'counting']

export function isProblemKind(value: string): value is ProblemKind {
  return (PROBLEM_KINDS as readonly string[]).includes(value)
}

export const LEVEL_BOUNDS: LevelBounds = { min: 1, max: 20 }
export const SESSION_LENGTH = 3
export const FOCUS_SHARE = 0.6

export interface WordProblem {
  level: number
  kind: ProblemKind
  text: string
  answer: number
  /** Unit of the answer, shown next to the input ("ans", "minutes"…). */
  unit: string
  explanation: string
}

type Draft = Omit<WordProblem, 'level' | 'kind'>

interface Variant {
  minLevel: number
  maxLevel: number
  make: (rng: Rng, level: number) => Draft | null
}

function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1)
}

function binomial(n: number, k: number): number {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}

const MULTIPLE = ['', '', 'le double', 'le triple', 'le quadruple']

const AGES: readonly Variant[] = [
  {
    minLevel: 1,
    maxLevel: 7,
    make: (rng, level) => {
      const young = randInt(rng, 5, 8 + 2 * level)
      const diff = randInt(rng, 2, 3 + level)
      const sum = 2 * young + diff
      return {
        text: `Léa a ${diff} ans de plus que son frère Hugo. À eux deux, ils ont ${sum} ans. Quel âge a Léa ?`,
        answer: young + diff,
        unit: 'ans',
        explanation: `Sans l’écart, il resterait ${sum} − ${diff} = ${sum - diff} ans à partager : Hugo a ${young} ans, Léa ${young + diff} ans.`,
      }
    },
  },
  {
    minLevel: 4,
    maxLevel: 15,
    make: (rng) => {
      const b = rng() < 0.6 ? 2 : 3
      const a = randInt(rng, b + 1, b + 3)
      const child = randInt(rng, 3, 15)
      const years = (child * (a - b)) / (b - 1)
      if (!Number.isInteger(years) || a * child > 85 || a * child < 22) return null
      return {
        text: `Aujourd’hui, Marc a ${a} fois l’âge de sa fille. Dans ${years} ans, il n’aura plus que ${MULTIPLE[b]} de son âge. Quel âge a Marc aujourd’hui ?`,
        answer: a * child,
        unit: 'ans',
        explanation: `Si la fille a f ans : ${a}f + ${years} = ${b}(f + ${years}), donc ${a - b}f = ${(b - 1) * years} et f = ${child}. Marc a ${a} × ${child} = ${a * child} ans.`,
      }
    },
  },
  {
    minLevel: 10,
    maxLevel: 20,
    make: (rng) => {
      const tom = randInt(rng, 3, 20)
      const diff = randInt(rng, 2, 10)
      const k = randInt(rng, 2, 3)
      const julie = tom + diff
      const marc = k * julie
      const sum = marc + julie + tom
      return {
        text: `Marc a ${MULTIPLE[k]} de l’âge de Julie, et Julie a ${diff} ans de plus que Tom. La somme de leurs trois âges est ${sum} ans. Quel âge a Marc ?`,
        answer: marc,
        unit: 'ans',
        explanation: `Avec t l’âge de Tom : Julie a t + ${diff}, Marc ${k}(t + ${diff}). Total : ${k + 2}t + ${(k + 1) * diff} = ${sum}, donc t = ${tom}, Julie ${julie} ans et Marc ${marc} ans.`,
      }
    },
  },
  {
    minLevel: 15,
    maxLevel: 20,
    make: (rng) => {
      const unit = randInt(rng, 3, 12)
      const me = 4 * unit
      const you = 3 * unit
      return {
        text: `Je dis à mon cousin : « J’ai le double de l’âge que tu avais quand j’avais l’âge que tu as. » La somme de nos âges est ${me + you} ans. Quel âge ai-je ?`,
        answer: me,
        unit: 'ans',
        explanation: `Avec x mon âge et y le sien : j’avais y ans il y a x − y ans ; il avait alors y − (x − y) = 2y − x. Donc x = 2(2y − x), soit 3x = 4y. Avec x + y = ${me + you} : x = ${me} ans.`,
      }
    },
  },
]

const MIXTURE: readonly Variant[] = [
  {
    minLevel: 1,
    maxLevel: 9,
    make: (rng, level) => {
      const fives = randInt(rng, 2, 6 + 2 * level)
      const twos = randInt(rng, 2, 6 + 2 * level)
      const count = fives + twos
      const total = 5 * fives + 2 * twos
      return {
        text: `Une tirelire contient ${count} pièces, toutes de 2 € ou de 5 €, pour un total de ${total} €. Combien y a-t-il de pièces de 5 € ?`,
        answer: fives,
        unit: 'pièces',
        explanation: `Si toutes valaient 2 €, on aurait ${2 * count} €. Chaque pièce de 5 € ajoute 3 € : (${total} − ${2 * count}) ÷ 3 = ${fives}.`,
      }
    },
  },
  {
    minLevel: 5,
    maxLevel: 14,
    make: (rng, level) => {
      const rabbits = randInt(rng, 3, 8 + 3 * level)
      const hens = randInt(rng, 3, 8 + 3 * level)
      return {
        text: `Dans une ferme, on compte ${rabbits + hens} têtes et ${4 * rabbits + 2 * hens} pattes, uniquement des poules et des lapins. Combien y a-t-il de lapins ?`,
        answer: rabbits,
        unit: 'lapins',
        explanation: `Si tous étaient des poules : ${2 * (rabbits + hens)} pattes. Chaque lapin en ajoute 2 : (${4 * rabbits + 2 * hens} − ${2 * (rabbits + hens)}) ÷ 2 = ${rabbits}.`,
      }
    },
  },
  {
    minLevel: 10,
    maxLevel: 20,
    make: (rng) => {
      const ratio = randInt(rng, 2, 3)
      const eights = randInt(rng, 2, 12)
      const threes = randInt(rng, 2, 20)
      const fives = ratio * eights
      const count = threes + fives + eights
      const total = 3 * threes + 5 * fives + 8 * eights
      return {
        text: `Un guichet a vendu ${count} billets à 3 €, 5 € et 8 €, pour ${total} €. Il y a ${ratio} fois plus de billets à 5 € que de billets à 8 €. Combien de billets à 3 € ont été vendus ?`,
        answer: threes,
        unit: 'billets',
        explanation: `Avec x billets à 8 € : ${ratio}x à 5 € et ${count} − ${ratio + 1}x à 3 €. Recette : 3(${count} − ${ratio + 1}x) + ${5 * ratio}x + 8x = ${total}, donc ${5 * ratio + 8 - 3 * (ratio + 1)}x = ${total - 3 * count}, x = ${eights}. Billets à 3 € : ${threes}.`,
      }
    },
  },
  {
    minLevel: 14,
    maxLevel: 20,
    make: (rng) => {
      const p = 5 * randInt(rng, 1, 6)
      const q = p + 5 * randInt(rng, 3, 8)
      const m = p + 5 * randInt(rng, 1, (q - p) / 5 - 1)
      const a = randInt(rng, 2, 30)
      const b = (a * (m - p)) / (q - m)
      if (!Number.isInteger(b) || b > 60) return null
      return {
        text: `On a ${a} litres de sirop dilué à ${p} % de sucre. Combien de litres d’un sirop à ${q} % faut-il ajouter pour obtenir un mélange à ${m} % ?`,
        answer: b,
        unit: 'litres',
        explanation: `Avec x litres ajoutés : ${p} % × ${a} + ${q} % × x = ${m} % × (${a} + x), donc ${q - m}x = ${(m - p) * a} et x = ${b}.`,
      }
    },
  },
]

const WORK: readonly Variant[] = [
  {
    minLevel: 1,
    maxLevel: 10,
    make: (rng, level) => {
      const a = randInt(rng, 1, 3 + Math.ceil(level / 2))
      const b = randInt(rng, a + 1, a + 6)
      const minutes = (60 * a * b) / (a + b)
      if (!Number.isInteger(minutes)) return null
      return {
        text: `Un robinet remplit une cuve en ${a} h, un autre en ${b} h. Ouverts ensemble, en combien de minutes la remplissent-ils ?`,
        answer: minutes,
        unit: 'minutes',
        explanation: `En une heure : 1/${a} + 1/${b} = ${a + b}/${a * b} de cuve. Il faut donc ${a * b}/${a + b} h = ${minutes} minutes.`,
      }
    },
  },
  {
    minLevel: 7,
    maxLevel: 16,
    make: (rng) => {
      const [a, b, c] = [randInt(rng, 2, 6), randInt(rng, 3, 10), randInt(rng, 4, 15)]
      const denom = b * c + a * c + a * b
      const minutes = (60 * a * b * c) / denom
      if (!Number.isInteger(minutes) || a === b || b === c || a === c) return null
      return {
        text: `Ana repeint une clôture seule en ${a} h, Ben en ${b} h et Cléo en ${c} h. À trois, combien de minutes leur faut-il ?`,
        answer: minutes,
        unit: 'minutes',
        explanation: `En une heure : 1/${a} + 1/${b} + 1/${c} = ${denom}/${a * b * c} de clôture, soit ${a * b * c}/${denom} h = ${minutes} minutes.`,
      }
    },
  },
  {
    minLevel: 12,
    maxLevel: 20,
    make: (rng) => {
      const [a, b, c] = [randInt(rng, 2, 8), randInt(rng, 2, 10), randInt(rng, 3, 12)]
      const denom = b * c + a * c - a * b
      if (denom <= 0) return null
      const minutes = (60 * a * b * c) / denom
      if (!Number.isInteger(minutes) || minutes > 1440) return null
      return {
        text: `Deux robinets remplissent un bassin, l’un en ${a} h, l’autre en ${b} h ; une fuite le viderait en ${c} h. Bassin vide, tout est ouvert : en combien de minutes est-il plein ?`,
        answer: minutes,
        unit: 'minutes',
        explanation: `En une heure : 1/${a} + 1/${b} − 1/${c} = ${denom}/${a * b * c} de bassin, soit ${a * b * c}/${denom} h = ${minutes} minutes.`,
      }
    },
  },
  {
    minLevel: 15,
    maxLevel: 20,
    make: (rng) => {
      const a = randInt(rng, 3, 12)
      const b = randInt(rng, 3, 12)
      const t = randInt(rng, 1, Math.min(a, b) - 1)
      // Fraction left after t hours together: 1 − t/a − t/b; B alone finishes it in b × that.
      const minutes = (60 * (a * b - a * t - t * b)) / a
      if (!Number.isInteger(minutes) || minutes <= 0) return null
      return {
        text: `Seule, Alice taille une haie en ${a} h ; seul, Bruno en ${b} h. Ils travaillent ensemble ${t} h, puis Alice part. Combien de minutes faut-il encore à Bruno pour finir ?`,
        answer: minutes,
        unit: 'minutes',
        explanation: `En ${t} h à deux : ${t}/${a} + ${t}/${b} de la haie. Il reste 1 − ${t}/${a} − ${t}/${b}, que Bruno fait en ${b} × ce reste = ${minutes / 60} h, soit ${minutes} minutes.`,
      }
    },
  },
]

const MOTION: readonly Variant[] = [
  {
    minLevel: 1,
    maxLevel: 10,
    make: (rng) => {
      const v1 = 10 * randInt(rng, 4, 12)
      const v2 = 10 * randInt(rng, 4, 12)
      const minutes = 10 * randInt(rng, 3, 18)
      const distance = ((v1 + v2) * minutes) / 60
      if (!Number.isInteger(distance)) return null
      return {
        text: `Deux villes sont à ${distance} km. Une voiture part de chacune au même moment, l’une à ${v1} km/h, l’autre à ${v2} km/h, l’une vers l’autre. Au bout de combien de minutes se croisent-elles ?`,
        answer: minutes,
        unit: 'minutes',
        explanation: `Elles se rapprochent de ${v1} + ${v2} = ${v1 + v2} km/h : ${distance} ÷ ${v1 + v2} h = ${minutes} minutes.`,
      }
    },
  },
  {
    minLevel: 6,
    maxLevel: 15,
    make: (rng) => {
      const v1 = 5 * randInt(rng, 2, 5)
      const v2 = 10 * randInt(rng, 4, 9)
      const t = 5 * randInt(rng, 2, 12)
      const delay = (t * (v2 - v1)) / v1
      if (!Number.isInteger(delay) || delay > 180) return null
      return {
        text: `Une cycliste part à ${v1} km/h. ${delay} minutes plus tard, une voiture part du même endroit, sur la même route, à ${v2} km/h. Combien de minutes après son départ la voiture la rattrape-t-elle ?`,
        answer: t,
        unit: 'minutes',
        explanation: `Au départ de la voiture, la cycliste a ${(v1 * delay) / 60} km d’avance. La voiture la reprend à ${v2} − ${v1} = ${v2 - v1} km/h : ${(v1 * delay) / 60} ÷ ${v2 - v1} h = ${t} minutes.`,
      }
    },
  },
  {
    minLevel: 11,
    maxLevel: 20,
    make: (rng) => {
      const v1 = 10 * randInt(rng, 2, 9)
      const v2 = 10 * randInt(rng, 2, 12)
      const mean = (2 * v1 * v2) / (v1 + v2)
      if (v1 === v2 || !Number.isInteger(mean)) return null
      return {
        text: `Un car fait l’aller à ${v1} km/h et le retour, par la même route, à ${v2} km/h. Quelle est sa vitesse moyenne sur l’aller-retour, en km/h ?`,
        answer: mean,
        unit: 'km/h',
        explanation: `Pas la moyenne des vitesses ! Pour une distance d : temps total d/${v1} + d/${v2}, vitesse moyenne 2d ÷ ce temps = 2 × ${v1} × ${v2} ÷ (${v1} + ${v2}) = ${mean} km/h.`,
      }
    },
  },
  {
    minLevel: 15,
    maxLevel: 20,
    make: (rng) => {
      const boat = randInt(rng, 8, 30)
      const current = randInt(rng, 1, Math.floor(boat / 3))
      const distance = randInt(rng, 6, 60)
      const down = (60 * distance) / (boat + current)
      const up = (60 * distance) / (boat - current)
      if (!Number.isInteger(down) || !Number.isInteger(up)) return null
      return {
        text: `Un bateau parcourt ${distance} km en ${down} minutes en descendant un fleuve, et en ${up} minutes en le remontant. Quelle est la vitesse du courant, en km/h ?`,
        answer: current,
        unit: 'km/h',
        explanation: `À la descente : ${(distance * 60) / down} km/h (bateau + courant) ; à la montée : ${(distance * 60) / up} km/h (bateau − courant). Le courant vaut la moitié de l’écart : ${current} km/h.`,
      }
    },
  },
]

const ANAGRAM_WORDS: readonly string[] = ['BANANE', 'ANANAS', 'PAPAYE', 'BALLON', 'CARAMEL', 'CERISE', 'GIRAFE', 'TOMATE', 'POMMES']

function arrangements(word: string): number {
  const counts = new Map<string, number>()
  for (const ch of word) counts.set(ch, (counts.get(ch) ?? 0) + 1)
  let r = factorial(word.length)
  for (const c of counts.values()) r /= factorial(c)
  return r
}

const COUNTING: readonly Variant[] = [
  {
    minLevel: 1,
    maxLevel: 8,
    make: (rng, level) => {
      const n = randInt(rng, 4, 6 + 2 * level)
      return {
        text: `Lors d’une réunion de ${n} personnes, chacune serre la main de toutes les autres, une seule fois. Combien de poignées de main en tout ?`,
        answer: (n * (n - 1)) / 2,
        unit: 'poignées de main',
        explanation: `Chacun serre ${n - 1} mains, mais chaque poignée est comptée deux fois : ${n} × ${n - 1} ÷ 2 = ${(n * (n - 1)) / 2}.`,
      }
    },
  },
  {
    minLevel: 4,
    maxLevel: 14,
    make: (rng, level) => {
      const w = randInt(rng, 2, Math.min(7, 2 + Math.ceil(level / 3)))
      const h = randInt(rng, 2, Math.min(6, 2 + Math.ceil(level / 3)))
      return {
        text: `Un quartier forme un quadrillage de ${w} × ${h} pâtés de maisons. Pour aller d’un coin au coin opposé en allant seulement vers la droite ou vers le haut, combien de trajets différents ?`,
        answer: binomial(w + h, w),
        unit: 'trajets',
        explanation: `Chaque trajet est une suite de ${w} pas à droite et ${h} vers le haut : on choisit la place des ${w} pas à droite parmi ${w + h}, soit C(${w + h}, ${w}) = ${binomial(w + h, w)}.`,
      }
    },
  },
  {
    minLevel: 9,
    maxLevel: 20,
    make: (rng) => {
      const k = randInt(rng, 2, 4)
      const digit = randInt(rng, 1, 9)
      return {
        text: `Combien de codes de ${k} chiffres (de 0 à 9, répétitions permises) contiennent au moins un ${digit} ?`,
        answer: 10 ** k - 9 ** k,
        unit: 'codes',
        explanation: `On compte le contraire : ${9 ** k} codes n’ont aucun ${digit} (9 choix par chiffre). Donc ${10 ** k} − ${9 ** k} = ${10 ** k - 9 ** k}.`,
      }
    },
  },
  {
    minLevel: 12,
    maxLevel: 20,
    make: (rng) => {
      const word = pick(rng, ANAGRAM_WORDS)
      return {
        text: `Combien de mots différents (ayant un sens ou non) peut-on écrire en réordonnant toutes les lettres de ${word} ?`,
        answer: arrangements(word),
        unit: 'mots',
        explanation: `${word.length}! = ${factorial(word.length)} ordres, divisés par les permutations des lettres répétées (elles ne changent pas le mot) : ${arrangements(word)}.`,
      }
    },
  },
  {
    minLevel: 15,
    maxLevel: 20,
    make: (rng) => {
      const women = randInt(rng, 3, 7)
      const men = randInt(rng, 3, 7)
      const k = randInt(rng, 3, Math.min(5, men))
      const answer = binomial(women + men, k) - binomial(men, k)
      return {
        text: `Une association compte ${women} femmes et ${men} hommes. Combien de comités de ${k} personnes comprennent au moins une femme ?`,
        answer,
        unit: 'comités',
        explanation: `Tous les comités : C(${women + men}, ${k}) = ${binomial(women + men, k)} ; ceux sans femme : C(${men}, ${k}) = ${binomial(men, k)}. Différence : ${answer}.`,
      }
    },
  },
]

const VARIANTS: Readonly<Record<ProblemKind, readonly Variant[]>> = {
  ages: AGES,
  mixture: MIXTURE,
  work: WORK,
  motion: MOTION,
  counting: COUNTING,
}

export function generateProblem(level: number, rng: Rng, focus: ProblemKind | null = null): WordProblem {
  if (level < LEVEL_BOUNDS.min || level > LEVEL_BOUNDS.max) throw new Error(`Invalid word problem level: ${level}`)
  const kind = focus !== null && rng() < FOCUS_SHARE ? focus : pick(rng, PROBLEM_KINDS)
  const variants = VARIANTS[kind].filter((v) => v.minLevel <= level && level <= v.maxLevel)
  if (variants.length === 0) throw new Error(`No ${kind} problem at level ${level}`)
  // The hardest unlocked variants come up more often.
  const weighted = variants.flatMap((v) => Array.from({ length: 1 + Math.floor(v.minLevel / 4) }, () => v))
  for (let attempt = 0; attempt < 500; attempt++) {
    const draft = pick(rng, weighted).make(rng, level)
    if (draft !== null && Number.isInteger(draft.answer) && draft.answer > 0) return { ...draft, level, kind }
  }
  throw new Error(`Could not generate a ${kind} problem at level ${level}`)
}
