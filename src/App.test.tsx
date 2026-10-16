import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { SessionRecord } from './core/types'
import { SESSION_LENGTH as CALC_SESSION_LENGTH } from './domains/calculation/session'
import { SESSION_LENGTH as MEMORY_SESSION_LENGTH } from './domains/memory/span'
import { SESSION_LENGTH as ATTENTION_SESSION_LENGTH } from './domains/attention/stroop'
import { SESSION_LENGTH as LOGIC_SESSION_LENGTH } from './domains/logic/series'
import { SESSION_LENGTH as SPEED_SESSION_LENGTH } from './domains/speed/compare'
import type { SessionRepository } from './storage/sessionRepository'

/** Last feedback as "✓ detail" / "✗ detail" (result from data-result, detail without the random praise title). */
function lastFeedback(): string {
  const el = screen.queryByTestId('feedback')
  if (el === null) return ''
  const detail = el.querySelector('.feedback-text > span')?.textContent ?? ''
  return `${el.dataset.result === 'ok' ? '✓' : '✗'} ${detail}`
}

/** Types an answer on the keypad through the physical keyboard (auto-validates at full length), then Enter. */
function typeAnswer(value: string | number) {
  for (const key of String(value)) fireEvent.keyDown(window, { key })
  fireEvent.keyDown(window, { key: 'Enter' })
}

class MemoryRepository implements SessionRepository {
  records: SessionRecord[] = []
  list(): SessionRecord[] {
    return [...this.records]
  }
  add(record: SessionRecord): void {
    this.records.push(record)
  }
  addMany(records: readonly SessionRecord[]): void {
    for (const r of records) if (!this.records.some((x) => x.id === r.id)) this.records.push(r)
  }
}

/** Clicks a button inside the home card of a domain. */
function clickInCard(cardTitle: string, button: 'Commencer' | 'Progrès') {
  const card = screen.getByRole('article', { name: cardTitle })
  fireEvent.click(within(card).getByRole('button', { name: button }))
}

/** Reads "a op b" from the screen and computes the expected answer. */
function solveDisplayedProblem(): number {
  const text = document.querySelector('.problem')?.textContent ?? ''
  const match = /^(\d+) ([+\-×÷]) (\d+)$/.exec(text)
  if (match === null) throw new Error(`Unexpected problem text: "${text}"`)
  const a = Number(match[1])
  const b = Number(match[3])
  switch (match[2]) {
    case '+': return a + b
    case '-': return a - b
    case '×': return a * b
    default: return a / b
  }
}

/** Advances fake time until the answer field appears, recording each digit as it is flashed. */
function watchSequence(): number[] {
  const seen: number[] = []
  let previous = ''
  for (let t = 0; t < 60_000 && screen.queryByTestId('answer-display') === null; t += 50) {
    act(() => vi.advanceTimersByTime(50))
    const text = screen.queryByTestId('digit')?.textContent?.trim() ?? ''
    if (/^\d$/.test(text) && text !== previous) seen.push(Number(text))
    previous = text
  }
  return seen
}

const INK_TO_NAME: Record<string, string> = {
  red: 'Rouge', blue: 'Bleu', green: 'Vert', yellow: 'Jaune', purple: 'Violet', brown: 'Marron',
}

function inkOnScreen(): string {
  return [...document.querySelector('.stroop-word')!.classList].find((c) => c.startsWith('ink-'))!.slice(4)
}

/** Answers the item on screen correctly, whatever the exercise (logic excepted: it answers 0). */
function answerCurrentItem() {
  if (screen.queryByTestId('study-word') !== null) {
    // Word list: note each word during study (and the delay), then recall them all.
    const seen = new Set<string>()
    for (let t = 0; t < 120_000 && screen.queryByLabelText('Mot') === null; t += 100) {
      act(() => vi.advanceTimersByTime(100))
      const word = screen.queryByTestId('study-word')?.textContent?.trim() ?? ''
      if (word.length > 1) seen.add(word)
    }
    const input = screen.getByLabelText('Mot')
    for (const word of seen) {
      fireEvent.change(input, { target: { value: word } })
      fireEvent.submit(input.closest('form')!)
    }
    fireEvent.click(screen.getByRole('button', { name: /J’ai fini/ }))
    return
  }
  if (document.querySelector('.span-mode') !== null) {
    const backward = document.querySelector('.span-mode')!.classList.contains('backward')
    const digits = watchSequence()
    typeAnswer((backward ? digits.toReversed() : digits).join(''))
    return
  }
  if (document.querySelector('.stroop-word') !== null) {
    const readWord = screen.queryByTestId('stroop-cue')?.textContent === 'MOT'
    const word = document.querySelector('.stroop-word')!.textContent!
    const name = readWord ? word.charAt(0) + word.slice(1).toLowerCase() : INK_TO_NAME[inkOnScreen()]
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }))
    return
  }
  if (document.querySelector('.pair') !== null) {
    const same = screen.getByTestId('pair-left').textContent === screen.getByTestId('pair-right').textContent
    fireEvent.click(screen.getByRole('button', { name: same ? /^Identiques/ : /^Différents/ }))
    return
  }
  typeAnswer(document.querySelector('.series') !== null ? 0 : solveDisplayedProblem())
}

function weakCalcRecord(): SessionRecord {
  return {
    id: 'prev', domain: 'calculation', exercise: 'arithmetic', startedAt: '2026-10-14T10:00:00.000Z',
    startLevel: 5, endLevel: 5, items: 20, correct: 15, avgResponseMs: 3000,
    breakdown: {
      '+': { items: 10, correct: 10, totalResponseMs: 20000 },
      '÷': { items: 10, correct: 5, totalResponseMs: 40000 },
    },
  }
}

describe('App calculation flow', () => {
  afterEach(cleanup)

  it('runs a full session of correct answers, saves it and shows results', () => {
    const repo = new MemoryRepository()
    render(<App repository={repo} />)

    clickInCard('Opérations', 'Commencer')
    for (let i = 0; i < CALC_SESSION_LENGTH; i++) typeAnswer(solveDisplayedProblem())

    expect(screen.getByText(/Session terminée/)).toBeTruthy()
    // Overall precision plus one row per operation practised.
    expect(screen.getAllByText('100 %').length).toBeGreaterThanOrEqual(2)
    expect(repo.records).toHaveLength(1)
    const saved = repo.records[0]!
    expect(saved.domain).toBe('calculation')
    expect(saved.correct).toBe(CALC_SESSION_LENGTH)
    expect(saved.endLevel).toBeGreaterThan(saved.startLevel)
    const breakdownItems = Object.values(saved.breakdown ?? {}).reduce((sum, t) => sum + t.items, 0)
    expect(breakdownItems).toBe(CALC_SESSION_LENGTH)
    expect(screen.getByText('Par opération')).toBeTruthy()
  })

  it('flags the weakest operation on the progress page', () => {
    const repo = new MemoryRepository()
    repo.records.push(weakCalcRecord())
    render(<App repository={repo} />)
    clickInCard('Opérations', 'Progrès')
    expect(screen.getByText(/Point faible : Division — 50 %/)).toBeTruthy()
  })

  it('focuses the next session on the weakest operation', () => {
    const repo = new MemoryRepository()
    repo.records.push(weakCalcRecord())
    render(<App repository={repo} />)
    clickInCard('Opérations', 'Commencer')
    expect(screen.getByText('Focus : Division')).toBeTruthy()
  })

  it('shows no focus without a weak point', () => {
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Opérations', 'Commencer')
    expect(screen.queryByText(/Focus :/)).toBeNull()
  })

  it('resumes at the last reached level', () => {
    const repo = new MemoryRepository()
    repo.records.push({
      id: 'prev', domain: 'calculation', exercise: 'arithmetic', startedAt: '2026-10-14T10:00:00.000Z',
      startLevel: 3, endLevel: 6, items: 20, correct: 18, avgResponseMs: 3000,
    })
    render(<App repository={repo} />)
    clickInCard('Opérations', 'Commencer')
    expect(screen.getByText('Niveau 6')).toBeTruthy()
  })

  it('shows a storage error instead of crashing', () => {
    const broken: SessionRepository = {
      list: () => { throw new Error('boom') },
      add: () => {},
      addMany: () => {},
    }
    render(<App repository={broken} />)
    expect(screen.getByRole('alert').textContent).toContain('boom')
  })
})

describe('App working memory flow', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('flashes digits, checks recall in the right order, saves and shows results', () => {
    vi.useFakeTimers()
    const repo = new MemoryRepository()
    render(<App repository={repo} />)
    clickInCard('Empan de chiffres', 'Commencer')

    for (let i = 0; i < MEMORY_SESSION_LENGTH; i++) {
      const backward = document.querySelector('.span-mode')?.classList.contains('backward') ?? false
      const digits = watchSequence()
      expect(digits.length).toBeGreaterThanOrEqual(2)
      const answer = (backward ? digits.toReversed() : digits).join('')
      typeAnswer(answer)
    }

    expect(screen.getByText(/Session terminée — Empan de chiffres/)).toBeTruthy()
    expect(screen.getByText('Par mode')).toBeTruthy()
    const saved = repo.records[0]!
    expect(saved.domain).toBe('memory')
    expect(saved.correct).toBe(MEMORY_SESSION_LENGTH)
    expect(saved.endLevel).toBeGreaterThan(saved.startLevel)
  })

  it('counts a wrong recall as an error and shows the expected sequence', () => {
    vi.useFakeTimers()
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Empan de chiffres', 'Commencer')
    watchSequence()
    typeAnswer('0')
    expect(lastFeedback()).toMatch(/✗ Attendu :/)
  })

  it('focuses on the weakest recall mode', () => {
    const repo = new MemoryRepository()
    repo.records.push({
      id: 'm', domain: 'memory', exercise: 'digit-span', startedAt: '2026-10-14T10:00:00.000Z',
      startLevel: 3, endLevel: 3, items: 12, correct: 8, avgResponseMs: 4000,
      breakdown: {
        forward: { items: 8, correct: 8, totalResponseMs: 1 },
        backward: { items: 8, correct: 4, totalResponseMs: 1 },
      },
    })
    render(<App repository={repo} />)
    clickInCard('Empan de chiffres', 'Commencer')
    expect(screen.getByText('Focus : Ordre inverse')).toBeTruthy()
    expect(screen.getByText('Niveau 3')).toBeTruthy()
  })

  it('keeps domains separate on the progress pages', () => {
    const repo = new MemoryRepository()
    repo.records.push(weakCalcRecord())
    render(<App repository={repo} />)
    clickInCard('Empan de chiffres', 'Progrès')
    expect(screen.getByText('Aucune session pour l\'instant.')).toBeTruthy()
  })
})

describe('App attention, logic and speed', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('attention: naming the ink color is correct, a full session is saved', () => {
    const repo = new MemoryRepository()
    render(<App repository={repo} />)
    clickInCard('Stroop', 'Commencer')
    expect(screen.getByText('Donne la couleur de l’encre, pas le mot.')).toBeTruthy()
    for (let i = 0; i < ATTENTION_SESSION_LENGTH; i++) answerCurrentItem()
    expect(screen.getByText(/Session terminée — Stroop/)).toBeTruthy()
    expect(repo.records[0]!.correct).toBe(ATTENTION_SESSION_LENGTH)
  })

  it('attention: answering the word instead of the ink is wrong', () => {
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Stroop', 'Commencer')
    // Find an incongruent trial (word ≠ ink) and answer the word.
    for (let guard = 0; guard < 50; guard++) {
      const word = document.querySelector('.stroop-word')!.textContent!.toLowerCase()
      if (word !== INK_TO_NAME[inkOnScreen()]!.toLowerCase()) {
        fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${word.charAt(0).toUpperCase()}${word.slice(1)}`) }))
        expect(lastFeedback()).toMatch(/✗ L’encre était/)
        return
      }
      answerCurrentItem()
    }
    throw new Error('No incongruent trial in 50 items')
  })

  it('attention: keyboard shortcuts answer', () => {
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Stroop', 'Commencer')
    const key = ({ red: 'r', blue: 'b', green: 'v', yellow: 'j' } as Record<string, string>)[inkOnScreen()]!
    fireEvent.keyDown(window, { key })
    expect(lastFeedback()).toMatch(/^✓/)
  })

  it('attention: the deadline counts a missing answer as an error', () => {
    vi.useFakeTimers()
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Stroop', 'Commencer')
    expect(screen.getByText('Essai 1/24')).toBeTruthy()
    act(() => vi.advanceTimersByTime(3100))
    expect(lastFeedback()).toMatch(/✗ Trop lent/)
    expect(screen.getByText('Essai 2/24')).toBeTruthy()
  })

  it('logic: shows the series, explains the rule after answering, saves the session', () => {
    const repo = new MemoryRepository()
    render(<App repository={repo} />)
    clickInCard('Suites de nombres', 'Commencer')
    expect(document.querySelector('.series')!.textContent).toMatch(/^(\d+, )+\?$/)
    answerCurrentItem()
    expect(lastFeedback()).toMatch(/[✓✗] \d+ — /)
    for (let i = 1; i < LOGIC_SESSION_LENGTH; i++) answerCurrentItem()
    expect(screen.getByText(/Session terminée — Suites de nombres/)).toBeTruthy()
    expect(repo.records[0]!.items).toBe(LOGIC_SESSION_LENGTH)
  })

  it('speed: judging pairs correctly, with arrow keys too', () => {
    const repo = new MemoryRepository()
    render(<App repository={repo} />)
    clickInCard('Comparaison de séries', 'Commencer')
    const same = screen.getByTestId('pair-left').textContent === screen.getByTestId('pair-right').textContent
    fireEvent.keyDown(window, { key: same ? 'ArrowLeft' : 'ArrowRight' })
    for (let i = 1; i < SPEED_SESSION_LENGTH; i++) answerCurrentItem()
    expect(screen.getByText(/Session terminée — Comparaison de séries/)).toBeTruthy()
    expect(repo.records[0]!.correct).toBe(SPEED_SESSION_LENGTH)
  })
})

describe('App programs and streak', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('runs the Express program step by step and shows a summary', () => {
    vi.useFakeTimers()
    const repo = new MemoryRepository()
    render(<App repository={repo} />)
    const card = screen.getByRole('article', { name: 'Express' })
    // No history: calculation first, then the first untrained domains (memory, episodic memory).
    expect(within(card).getByText('Opérations → Empan de chiffres → Liste de mots')).toBeTruthy()
    fireEvent.click(within(card).getByRole('button', { name: 'Démarrer' }))

    expect(screen.getByText(/Étape 1\/3/)).toBeTruthy()
    for (let step = 0; step < 3; step++) {
      fireEvent.click(screen.getByRole('button', { name: step === 0 ? 'Commencer' : 'Continuer' }))
      for (let guard = 0; guard < 100 && document.querySelector('.session') !== null; guard++) answerCurrentItem()
    }

    expect(screen.getByText('Programme terminé — Express')).toBeTruthy()
    expect(repo.records.map((r) => r.exercise)).toEqual(['arithmetic', 'digit-span', 'word-list'])
    expect(repo.records.map((r) => r.items)).toEqual([10, 6, 1])
    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(screen.getByText(/Série : 1 jour · 3 sessions aujourd’hui/)).toBeTruthy()
  })

  it('can stop a program between steps', () => {
    render(<App repository={new MemoryRepository()} />)
    fireEvent.click(within(screen.getByRole('article', { name: 'Séance du jour' })).getByRole('button', { name: 'Démarrer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Arrêter le programme' }))
    expect(screen.getByText('Programmes')).toBeTruthy()
  })
})

/** Fake Web Speech API: records instances so tests can emit transcripts. */
class FakeRecognition {
  static instances: FakeRecognition[] = []
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  aborted = false
  start() {
    FakeRecognition.instances.push(this)
    this.onstart?.()
  }
  abort() {
    this.aborted = true
  }
  say(...alternatives: string[]) {
    const result = Object.assign(alternatives.map((transcript) => ({ transcript })), { isFinal: true })
    act(() => this.onresult?.({ resultIndex: 0, results: { length: 1, 0: result } }))
  }
}

function activeRecognition(): FakeRecognition {
  const live = FakeRecognition.instances.filter((r) => !r.aborted)
  if (live.length !== 1) throw new Error(`Expected one live recognizer, found ${live.length}`)
  return live[0]!
}

describe('App voice answers', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    FakeRecognition.instances = []
    localStorage.clear()
  })

  it('hides the voice toggle when the browser has no speech recognition', () => {
    render(<App repository={new MemoryRepository()} />)
    expect(screen.queryByRole('button', { name: /Réponse vocale/ })).toBeNull()
  })

  it('answers calculation by voice and remembers the setting', () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
    render(<App repository={new MemoryRepository()} />)
    fireEvent.click(screen.getByRole('button', { name: /Réponse vocale : désactivée/ }))
    expect(localStorage.getItem('cognitive-training:voice')).toBe('on')

    clickInCard('Opérations', 'Commencer')
    const recognition = activeRecognition()
    expect(recognition.lang).toBe('fr-FR')
    expect(screen.getByText(/À l’écoute/)).toBeTruthy()

    recognition.say('bonjour', String(solveDisplayedProblem()))
    expect(lastFeedback()).toMatch(/^✓/)
    expect(screen.getByText('Question 2/20')).toBeTruthy()

    recognition.say('je ne sais pas')
    expect(screen.getByText(/Pas compris : « je ne sais pas »/)).toBeTruthy()
    expect(screen.getByText('Question 2/20')).toBeTruthy()
  })

  it('answers the Stroop task by saying the color', () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
    localStorage.setItem('cognitive-training:voice', 'on')
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Stroop', 'Commencer')
    activeRecognition().say(INK_TO_NAME[inkOnScreen()]!.toLowerCase())
    expect(lastFeedback()).toMatch(/^✓/)
  })

  it('reports a refused microphone', () => {
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
    localStorage.setItem('cognitive-training:voice', 'on')
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Opérations', 'Commencer')
    act(() => activeRecognition().onerror?.({ error: 'not-allowed' }))
    expect(screen.getByText(/Accès au micro refusé/)).toBeTruthy()
  })
})

describe('App difficulty ceiling, evolution and chart', () => {
  afterEach(cleanup)

  function attentionRecord(endLevel: number): SessionRecord {
    return {
      id: `a${endLevel}`, domain: 'attention', exercise: 'stroop', startedAt: '2026-10-14T10:00:00.000Z',
      startLevel: endLevel, endLevel, items: 24, correct: 22, avgResponseMs: 900,
    }
  }

  it('attention from level 11 shows the cue and accepts reading the word when asked', () => {
    const repo = new MemoryRepository()
    repo.records.push(attentionRecord(13))
    render(<App repository={repo} />)
    clickInCard('Stroop', 'Commencer')
    expect(screen.getByText('Niveau 13')).toBeTruthy()
    expect(screen.getByText(/Suis la consigne/)).toBeTruthy()
    // Answer correctly until a MOT trial shows up, then check it was accepted.
    for (let guard = 0; guard < 23; guard++) {
      const isWord = screen.getByTestId('stroop-cue').textContent === 'MOT'
      answerCurrentItem()
      if (isWord) {
        expect(lastFeedback()).toMatch(/^✓/)
        return
      }
    }
    throw new Error('No MOT trial in 23 items')
  })

  it('flags a session ending at the maximum level', () => {
    const repo = new MemoryRepository()
    repo.records.push({
      id: 'top', domain: 'calculation', exercise: 'arithmetic', startedAt: '2026-10-14T10:00:00.000Z',
      startLevel: 10, endLevel: 10, items: 20, correct: 20, avgResponseMs: 3000,
    })
    render(<App repository={repo} />)
    clickInCard('Opérations', 'Commencer')
    for (let i = 0; i < CALC_SESSION_LENGTH; i++) answerCurrentItem()
    expect(screen.getByText(/Niveau maximal atteint \(10\)/)).toBeTruthy()
  })

  it('does not flag a session below the maximum', () => {
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Opérations', 'Commencer')
    for (let i = 0; i < CALC_SESSION_LENGTH; i++) answerCurrentItem()
    expect(screen.queryByText(/Niveau maximal atteint/)).toBeNull()
  })

  function calcHistory(levels: number[]): SessionRecord[] {
    return levels.map((endLevel, i) => ({
      id: `c${i}`, domain: 'calculation', exercise: 'arithmetic', startedAt: `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
      startLevel: 1, endLevel, items: 20, correct: 10 + i, avgResponseMs: 4000 - i * 100,
    }))
  }

  it('shows the baseline being built, then the evolution since the start', () => {
    const repo = new MemoryRepository()
    repo.records.push(...calcHistory([2, 3]))
    const { unmount } = render(<App repository={repo} />)
    clickInCard('Opérations', 'Progrès')
    expect(screen.getByText(/Ligne de base en cours : 2\/3/)).toBeTruthy()
    unmount()

    const repo2 = new MemoryRepository()
    repo2.records.push(...calcHistory([2, 3, 4, 6, 7, 8]))
    render(<App repository={repo2} />)
    clickInCard('Opérations', 'Progrès')
    // Baseline level (2+3+4)/3 = 3,0 ; recent (6+7+8)/3 = 7,0.
    expect(screen.getByText('▲ +4,0')).toBeTruthy()
    expect(screen.getByText(/Départ = tes 3 premières sessions/)).toBeTruthy()
  })

  it('draws the level chart with one point per session and a hover tooltip', () => {
    const repo = new MemoryRepository()
    repo.records.push(...calcHistory([2, 3, 5]))
    render(<App repository={repo} />)
    clickInCard('Opérations', 'Progrès')
    const chart = screen.getByRole('img', { name: /Niveau en fin de session sur 3 sessions, actuellement 5/ })
    expect(chart.querySelectorAll('circle')).toHaveLength(3)

    const svg = chart as unknown as SVGSVGElement
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 200, right: 640, bottom: 200, x: 0, y: 0, toJSON: () => ({}) })
    // Pointer at the far right snaps to the last session.
    fireEvent.pointerMove(screen.getByTestId('chart-hit-area'), { clientX: 600, clientY: 50 })
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.textContent).toContain('Niveau 1 → 5')
    fireEvent.pointerLeave(screen.getByTestId('chart-hit-area'))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('explains the chart needs 2 sessions', () => {
    const repo = new MemoryRepository()
    repo.records.push(...calcHistory([2]))
    render(<App repository={repo} />)
    clickInCard('Opérations', 'Progrès')
    expect(screen.getByText('Le graphique apparaîtra après 2 sessions.')).toBeTruthy()
  })
})
