import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { SessionRecord } from './core/types'
import { applyStep, type ChainStep } from './domains/calculation/chain'
import type { SessionRepository } from './storage/sessionRepository'
import { EXERCISES } from './ui/exercises'

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

function start(title: string, repo = new MemoryRepository()) {
  render(<App repository={repo} />)
  const card = screen.getByRole('article', { name: title })
  fireEvent.click(within(card).getByRole('button', { name: 'Commencer' }))
  return repo
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms))
}

/** Last feedback as "✓ detail" / "✗ detail" (result from data-result, detail without the random praise title). */
function lastFeedback(): string {
  const el = screen.queryByTestId('feedback')
  if (el === null) return ''
  const detail = el.querySelector('.feedback-text > span')?.textContent ?? ''
  return `${el.dataset.result === 'ok' ? '✓' : '✗'} ${detail}`
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('every exercise', () => {
  it.each(EXERCISES.map((e) => [e.title, e] as const))('%s opens, runs for a while and can be quit', (title) => {
    start(title)
    expect(screen.getByText(/Niveau 1/)).toBeTruthy()
    advance(20_000)
    expect(screen.getByRole('button', { name: 'Abandonner' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }))
    expect(screen.getByText('Programmes')).toBeTruthy()
  })

  it('has a unique id and at least one category', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length)
    for (const e of EXERCISES) expect(e.order.length).toBeGreaterThan(0)
  })
})

describe('calculation exercises', () => {
  it('chain calculation: keeping the running total gives the right answer', () => {
    start('Calcul en chaîne')
    const shown: string[] = []
    let previous = ''
    for (let t = 0; t < 30_000 && screen.queryByTestId('answer-display') === null; t += 50) {
      advance(50)
      const text = screen.queryByTestId('chain-display')?.textContent?.trim() ?? ''
      if (text !== '' && text !== previous) shown.push(text)
      previous = text
    }
    const [startText, ...stepTexts] = shown
    const steps: ChainStep[] = stepTexts.map((s) => {
      const [op, value] = s.split(' ')
      return { op: (op === '−' ? '-' : op) as ChainStep['op'], value: Number(value) }
    })
    const total = steps.reduce(applyStep, Number(startText))
    typeAnswer(total)
    expect(lastFeedback()).toMatch(/^✓/)
  })

  it('estimation: the deadline counts as an error', () => {
    start('Estimation')
    advance(7100)
    expect(lastFeedback()).toMatch(/✗ Trop lent/)
  })
})

describe('memory exercises', () => {
  it('n-back: never pressing fails the block (70 % only)', () => {
    start('N-back')
    advance(1500 + 21 * 2500 + 100)
    expect(lastFeedback()).toMatch(/^✗ 70 %/)
  })

  it('Corsi: tapping the flashed blocks in order is correct', () => {
    start('Blocs de Corsi')
    const flashed: number[] = []
    let previous = -1
    for (let t = 0; t < 10_000 && screen.getByRole('button', { name: 'Bloc 1' }).hasAttribute('disabled'); t += 50) {
      advance(50)
      const lit = [...document.querySelectorAll('.corsi-block')].findIndex((b) => b.classList.contains('lit'))
      if (lit !== -1 && lit !== previous) flashed.push(lit)
      previous = lit
    }
    for (const b of flashed) fireEvent.click(screen.getByRole('button', { name: `Bloc ${b + 1}` }))
    expect(lastFeedback()).toBe('✓ Séquence exacte')
  })

  it('word pairs: giving every partner is correct', () => {
    start('Paires de mots')
    const pairs = new Map<string, string>()
    for (let t = 0; t < 30_000 && screen.queryByTestId('cue') === null; t += 100) {
      advance(100)
      const [cue, target] = (screen.queryByTestId('study-pair')?.textContent ?? '').split(' – ')
      if (cue !== undefined && target !== undefined) pairs.set(cue.trim(), target.trim())
    }
    for (let i = 0; i < pairs.size; i++) {
      const cue = screen.getByTestId('cue').textContent!.replace(' – ?', '').trim()
      fireEvent.change(screen.getByLabelText('Réponse'), { target: { value: pairs.get(cue) } })
    }
    expect(lastFeedback()).toMatch(/^✓ 3\/3 associations/)
  })
})

describe('attention exercises', () => {
  it('go/no-go: holding back on the 3 is right, pressing on it is wrong', () => {
    start('Go / No-Go')
    for (let guard = 0; guard < 200; guard++) {
      const digit = screen.getByTestId('gonogo-digit').textContent
      if (digit === '3') {
        advance(1600)
        expect(lastFeedback()).toMatch(/✓ Bien retenu/)
        return
      }
      fireEvent.keyDown(window, { key: ' ' })
      expect(lastFeedback()).toBe('✓ OK')
    }
    throw new Error('No no-go trial in 200 items')
  })

  it('flanker: the central arrow decides', () => {
    start('Flanker')
    const target = screen.getByTestId('flanker-arrows').getAttribute('data-target')
    fireEvent.keyDown(window, { key: target === 'left' ? 'ArrowLeft' : 'ArrowRight' })
    expect(lastFeedback()).toMatch(/^✓/)
  })

  it('visual search: answering presence correctly', () => {
    start('Recherche visuelle')
    const kind = screen.getByTestId('search-grid').getAttribute('data-kind')
    fireEvent.click(screen.getByRole('button', { name: kind === 'present' ? /^Présent/ : /^Absent/ }))
    expect(lastFeedback()).toMatch(/^✓/)
  })
})

describe('executive exercises', () => {
  it('trail making: clicking the circles in order completes the trail', () => {
    start('Trail Making')
    const labels = [...document.querySelectorAll('.trail-node')].map((n) => n.textContent!)
    const order = labels.includes('A')
      ? labels.toSorted((a, b) => {
          const rank = (l: string) => (/\d/.test(l) ? (Number(l) - 1) * 2 : (l.charCodeAt(0) - 65) * 2 + 1)
          return rank(a) - rank(b)
        })
      : labels.toSorted((a, b) => Number(a) - Number(b))
    for (const label of order) fireEvent.click(screen.getByRole('button', { name: label }))
    expect(lastFeedback()).toBe('✓ Parcours sans faute')
  })

  it('trail making: a wrong circle is counted as an error', () => {
    start('Trail Making')
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByText(/1 erreur/)).toBeTruthy()
  })

  it('tower of London: moving balls updates the move count', () => {
    start('Tour de Londres')
    expect(screen.getByText(/coups joués : 0/)).toBeTruthy()
    const pegs = [1, 2, 3].map((i) => screen.getByRole('button', { name: `Tige ${i}` }))
    // Find a legal move: take from a non-empty peg, drop on another.
    for (const from of pegs) {
      if (from.querySelectorAll('.ball').length === 0) continue
      for (const to of pegs) {
        if (to === from) continue
        fireEvent.click(from)
        fireEvent.click(to)
        if (screen.queryByText(/coups joués : 1/) !== null || lastFeedback() !== '') return
      }
    }
    throw new Error('No legal move found')
  })
})

describe('reasoning, speed, language and visuospatial exercises', () => {
  it('matrices: the right figure is accepted', () => {
    start('Matrices')
    const answer = Number(screen.getByTestId('matrix').getAttribute('data-answer'))
    fireEvent.click(screen.getByRole('button', { name: `Figure ${answer + 1}` }))
    expect(lastFeedback()).toBe('✓ Bonne figure')
  })

  it('syllogisms: judging validity', () => {
    start('Syllogismes')
    const kind = screen.getByTestId('syllogism').getAttribute('data-kind')
    fireEvent.keyDown(window, { key: kind === 'valid' ? 'ArrowLeft' : 'ArrowRight' })
    expect(lastFeedback()).toMatch(/^✓/)
  })

  it('symbol-digit: typing the digit of the symbol', () => {
    start('Code symbole-chiffre')
    const digit = screen.getByTestId('symbol').getAttribute('data-digit')!
    fireEvent.keyDown(window, { key: digit })
    expect(lastFeedback()).toMatch(/^✓/)
  })

  it('anagrams: a wrong guess keeps the item, the word solves it', () => {
    start('Anagrammes')
    const word = screen.getByTestId('anagram').getAttribute('data-word')!
    const input = screen.getByLabelText('Réponse')
    fireEvent.change(input, { target: { value: 'zzzz' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText(/ne convient pas/)).toBeTruthy()
    fireEvent.change(input, { target: { value: word } })
    fireEvent.submit(input.closest('form')!)
    expect(lastFeedback()).toMatch(/^✓/)
  })

  it('fluency: counts valid words and scores the round when time is up', () => {
    start('Fluence verbale')
    const prompt = screen.getByTestId('fluency-prompt').textContent!
    const input = screen.getByLabelText('Mot')
    const say = (w: string) => {
      fireEvent.change(input, { target: { value: w } })
      fireEvent.submit(input.closest('form')!)
    }
    const letter = /par (\w)$/.exec(prompt)?.[1]
    const words = letter !== undefined ? [`${letter}aaa`, `${letter}bbb`, `${letter}aaa`] : ['chat', 'chien', 'chat']
    if (letter === undefined && !/animaux/.test(prompt)) return // other categories: covered by unit tests
    words.forEach(say)
    expect(screen.getByTestId('fluency-count').textContent).toBe('2')
    expect(screen.getByText(/déjà dit/)).toBeTruthy()
    advance(60_100)
    expect(lastFeedback()).toMatch(/^✗ 2 mots valables/)
  })

  it('mental rotation: same shape vs mirror', () => {
    start('Rotation mentale')
    const kind = screen.getByTestId('rotation').getAttribute('data-kind')
    fireEvent.keyDown(window, { key: kind === 'same' ? 'ArrowLeft' : 'ArrowRight' })
    expect(lastFeedback()).toMatch(/^✓/)
  })
})

describe('history migration', () => {
  it('shows legacy calculation sessions on the Operations card', () => {
    const repo = new MemoryRepository()
    repo.records.push({
      id: 'old', domain: 'calculation', exercise: 'arithmetic', startedAt: '2026-10-14T10:00:00.000Z',
      startLevel: 1, endLevel: 7, items: 20, correct: 20, avgResponseMs: 3000,
    })
    render(<App repository={repo} />)
    expect(within(screen.getByRole('article', { name: 'Opérations' })).getByText(/Niveau 7\/10/)).toBeTruthy()
    expect(within(screen.getByRole('article', { name: 'Calcul en chaîne' })).queryByText(/Niveau/)).toBeNull()
  })
})
