import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { SessionRecord } from './core/types'
import { SESSION_LENGTH as CALC_SESSION_LENGTH } from './domains/calculation/session'
import { SESSION_LENGTH as MEMORY_SESSION_LENGTH } from './domains/memory/span'
import type { SessionRepository } from './storage/sessionRepository'

class MemoryRepository implements SessionRepository {
  records: SessionRecord[] = []
  list(): SessionRecord[] {
    return [...this.records]
  }
  add(record: SessionRecord): void {
    this.records.push(record)
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

function weakCalcRecord(): SessionRecord {
  return {
    id: 'prev', domain: 'calculation', startedAt: '2026-10-14T10:00:00.000Z',
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

    clickInCard('Calcul mental', 'Commencer')
    const input = screen.getByLabelText('Réponse')
    for (let i = 0; i < CALC_SESSION_LENGTH; i++) {
      fireEvent.change(input, { target: { value: String(solveDisplayedProblem()) } })
      fireEvent.submit(input.closest('form')!)
    }

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
    clickInCard('Calcul mental', 'Progrès')
    expect(screen.getByText(/Point faible : Division — 50 %/)).toBeTruthy()
  })

  it('focuses the next session on the weakest operation', () => {
    const repo = new MemoryRepository()
    repo.records.push(weakCalcRecord())
    render(<App repository={repo} />)
    clickInCard('Calcul mental', 'Commencer')
    expect(screen.getByText('Focus : Division')).toBeTruthy()
  })

  it('shows no focus without a weak point', () => {
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Calcul mental', 'Commencer')
    expect(screen.queryByText(/Focus :/)).toBeNull()
  })

  it('resumes at the last reached level', () => {
    const repo = new MemoryRepository()
    repo.records.push({
      id: 'prev', domain: 'calculation', startedAt: '2026-10-14T10:00:00.000Z',
      startLevel: 3, endLevel: 6, items: 20, correct: 18, avgResponseMs: 3000,
    })
    render(<App repository={repo} />)
    clickInCard('Calcul mental', 'Commencer')
    expect(screen.getByText('Niveau 6')).toBeTruthy()
  })

  it('shows a storage error instead of crashing', () => {
    const broken: SessionRepository = {
      list: () => { throw new Error('boom') },
      add: () => {},
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

  /** Advances time until the answer field appears, recording each digit as it is flashed. */
  function watchSequence(): number[] {
    const seen: number[] = []
    let previous = ''
    for (let t = 0; t < 60_000 && screen.queryByLabelText('Réponse') === null; t += 50) {
      act(() => vi.advanceTimersByTime(50))
      const text = screen.queryByTestId('digit')?.textContent?.trim() ?? ''
      if (/^\d$/.test(text) && text !== previous) seen.push(Number(text))
      previous = text
    }
    return seen
  }

  it('flashes digits, checks recall in the right order, saves and shows results', () => {
    vi.useFakeTimers()
    const repo = new MemoryRepository()
    render(<App repository={repo} />)
    clickInCard('Mémoire de travail', 'Commencer')

    for (let i = 0; i < MEMORY_SESSION_LENGTH; i++) {
      const backward = document.querySelector('.span-mode')?.classList.contains('backward') ?? false
      const digits = watchSequence()
      expect(digits.length).toBeGreaterThanOrEqual(2)
      const answer = (backward ? digits.toReversed() : digits).join('')
      const input = screen.getByLabelText('Réponse')
      fireEvent.change(input, { target: { value: answer } })
      fireEvent.submit(input.closest('form')!)
    }

    expect(screen.getByText(/Session terminée — Mémoire de travail/)).toBeTruthy()
    expect(screen.getByText('Par mode')).toBeTruthy()
    const saved = repo.records[0]!
    expect(saved.domain).toBe('memory')
    expect(saved.correct).toBe(MEMORY_SESSION_LENGTH)
    expect(saved.endLevel).toBeGreaterThan(saved.startLevel)
  })

  it('counts a wrong recall as an error and shows the expected sequence', () => {
    vi.useFakeTimers()
    render(<App repository={new MemoryRepository()} />)
    clickInCard('Mémoire de travail', 'Commencer')
    watchSequence()
    const input = screen.getByLabelText('Réponse')
    fireEvent.change(input, { target: { value: '0' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText(/✗ Attendu :/)).toBeTruthy()
  })

  it('focuses on the weakest recall mode', () => {
    const repo = new MemoryRepository()
    repo.records.push({
      id: 'm', domain: 'memory', startedAt: '2026-10-14T10:00:00.000Z',
      startLevel: 3, endLevel: 3, items: 12, correct: 8, avgResponseMs: 4000,
      breakdown: {
        forward: { items: 8, correct: 8, totalResponseMs: 1 },
        backward: { items: 8, correct: 4, totalResponseMs: 1 },
      },
    })
    render(<App repository={repo} />)
    clickInCard('Mémoire de travail', 'Commencer')
    expect(screen.getByText('Focus : Ordre inverse')).toBeTruthy()
    expect(screen.getByText('Niveau 3')).toBeTruthy()
  })

  it('keeps domains separate on the progress pages', () => {
    const repo = new MemoryRepository()
    repo.records.push(weakCalcRecord())
    render(<App repository={repo} />)
    clickInCard('Mémoire de travail', 'Progrès')
    expect(screen.getByText('Aucune session pour l\'instant.')).toBeTruthy()
  })
})
