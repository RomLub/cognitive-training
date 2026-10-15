import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'
import type { SessionRecord } from './core/types'
import { SESSION_LENGTH } from './domains/calculation/session'
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

describe('App calculation flow', () => {
  afterEach(cleanup)

  it('runs a full session of correct answers, saves it and shows results', () => {
    const repo = new MemoryRepository()
    render(<App repository={repo} />)

    fireEvent.click(screen.getByRole('button', { name: 'Commencer' }))
    const input = screen.getByLabelText('Réponse')
    for (let i = 0; i < SESSION_LENGTH; i++) {
      fireEvent.change(input, { target: { value: String(solveDisplayedProblem()) } })
      fireEvent.submit(input.closest('form')!)
    }

    expect(screen.getByText('Session terminée')).toBeTruthy()
    expect(screen.getByText('100 %')).toBeTruthy()
    expect(repo.records).toHaveLength(1)
    const saved = repo.records[0]!
    expect(saved.correct).toBe(SESSION_LENGTH)
    expect(saved.endLevel).toBeGreaterThan(saved.startLevel)
  })

  it('resumes at the last reached level', () => {
    const repo = new MemoryRepository()
    repo.records.push({
      id: 'prev', domain: 'calculation', startedAt: '2026-10-14T10:00:00.000Z',
      startLevel: 3, endLevel: 6, items: 20, correct: 18, avgResponseMs: 3000,
    })
    render(<App repository={repo} />)
    fireEvent.click(screen.getByRole('button', { name: 'Commencer' }))
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
