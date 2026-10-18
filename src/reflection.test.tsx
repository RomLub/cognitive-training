import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { seededRng } from './core/random'
import type { SessionRecord } from './core/types'
import { sessionXp } from './core/xp'
import * as knights from './domains/reflection/knights'
import * as grid from './domains/reflection/logicGrid'
import * as problems from './domains/reflection/wordProblems'
import type { SessionRepository } from './storage/sessionRepository'

class MemoryRepository implements SessionRepository {
  records: SessionRecord[] = []
  list() {
    return [...this.records]
  }
  add(record: SessionRecord) {
    this.records.push(record)
  }
  addMany(records: readonly SessionRecord[]) {
    this.records.push(...records)
  }
}

/**
 * The app draws its problems from Math.random. Stubbing it with a seeded generator and replaying the same
 * sequence on a twin lets the test know each problem's solution without reading it from the page.
 */
function seedRandom(seed: number) {
  vi.spyOn(Math, 'random').mockImplementation(seededRng(seed))
  return seededRng(seed)
}

function start(cardTitle: string, repo = new MemoryRepository()) {
  render(<App repository={repo} />)
  fireEvent.click(within(screen.getByRole('article', { name: cardTitle })).getByRole('button', { name: 'Commencer' }))
  fireEvent.click(screen.getByRole('button', { name: 'C’est parti !' }))
  return repo
}

function currentLevel(): number {
  return Number(/Niveau (\d+)/.exec(screen.getByText(/^Niveau \d+$/).textContent!)![1])
}

function review() {
  return screen.getByTestId('review')
}

describe('Réflexion exercises', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('solves a logic grid, reads the correction, then moves on', () => {
    const twin = seedRandom(11)
    start('Énigmes logiques')
    const puzzle = grid.generatePuzzle(currentLevel(), twin)
    expect(screen.getByTestId('clues').querySelectorAll('li')).toHaveLength(puzzle.clues.length)

    const validate = screen.getByRole('button', { name: 'Valider la grille' })
    expect(validate).toHaveProperty('disabled', true)
    puzzle.attributes.forEach((a, ai) =>
      puzzle.names.forEach((name, p) =>
        fireEvent.change(screen.getByLabelText(`${a.title} de ${name}`), { target: { value: String(puzzle.solution[ai]![p]) } }),
      ),
    )
    fireEvent.click(validate)
    expect(review().dataset.result).toBe('ok')
    fireEvent.click(screen.getByRole('button', { name: 'Problème suivant' }))
    expect(screen.getByText('Énigme 2/3')).toBeTruthy()
  })

  it('frees a value picked twice in the same column', () => {
    seedRandom(3)
    start('Énigmes logiques')
    const [first] = screen.getAllByLabelText(/^(Animal|Boisson|Couleur|Sport) de/)
    const column = first!.getAttribute('aria-label')!.split(' de ')[0]!
    const sameColumn = screen.getAllByLabelText(new RegExp(`^${column} de`)) as HTMLSelectElement[]
    fireEvent.change(sameColumn[0]!, { target: { value: '0' } })
    fireEvent.change(sameColumn[1]!, { target: { value: '0' } })
    expect(sameColumn[0]!.value).toBe('')
    expect(sameColumn[1]!.value).toBe('0')
  })

  it('finds the liars, and shows who said what after a mistake', () => {
    const twin = seedRandom(5)
    start('Menteurs & sincères')
    const puzzle = knights.generatePuzzle(currentLevel(), twin)
    puzzle.names.forEach((name, i) => {
      // Wrong on purpose for the first inhabitant.
      const sincere = i === 0 ? !puzzle.solution[i]! : puzzle.solution[i]!
      fireEvent.click(within(screen.getByRole('group', { name })).getByRole('button', { name: knights.typeLabel(sincere, i) }))
    })
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(review().dataset.result).toBe('ko')
    expect(within(review()).getByText(puzzle.names[0]!).closest('li')!.className).toBe('ko')
  })

  it('takes no deadline: the problem waits as long as needed', () => {
    vi.useFakeTimers()
    const twin = seedRandom(8)
    start('Problèmes à étapes')
    const problem = problems.generateProblem(currentLevel(), twin)
    act(() => vi.advanceTimersByTime(15 * 60_000))
    expect(screen.queryByTestId('review')).toBeNull()
    expect(screen.getByLabelText('Temps de réflexion').textContent).toContain('15:00')
    expect(screen.getByTestId('word-problem').textContent).toBe(problem.text)
  })

  it('runs a whole word-problem session and rewards each solved problem', () => {
    const twin = seedRandom(21)
    const repo = start('Problèmes à étapes')
    for (let i = 0; i < problems.SESSION_LENGTH; i++) {
      const problem = problems.generateProblem(currentLevel(), twin)
      for (const key of String(problem.answer)) fireEvent.keyDown(window, { key })
      // No auto-validation on length: Enter is needed.
      expect(screen.queryByTestId('review')).toBeNull()
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(review().dataset.result).toBe('ok')
      expect(within(review()).getByText(problem.explanation)).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: i === problems.SESSION_LENGTH - 1 ? 'Voir le bilan' : 'Problème suivant' }))
    }
    expect(screen.getByText(/Session terminée — Problèmes à étapes/)).toBeTruthy()
    const record = repo.records[0]!
    expect(record).toMatchObject({ domain: 'reflection', exercise: 'word-problems', items: 3, correct: 3 })
    // 3 × 15 XP per solved problem + 3 XP for the level gained after three in a row.
    expect(sessionXp(record)).toBe(48)
  })

  it('has its own program and stays out of the quick ones', () => {
    render(<App repository={new MemoryRepository()} />)
    expect(screen.getByRole('article', { name: 'Réflexion profonde' })).toBeTruthy()
    fireEvent.click(within(screen.getByRole('article', { name: 'Séance du jour' })).getByRole('button', { name: 'Démarrer' }))
    const rules = document.body.textContent ?? ''
    expect(rules).not.toMatch(/Énigmes logiques|Menteurs|Problèmes à étapes/)
  })
})
