import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import type { SessionRecord } from '../core/types'
import type { SessionRepository } from '../storage/sessionRepository'
import { NumericKeypad } from './NumericKeypad'

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

const press = (key: string) => fireEvent.keyDown(window, { key })
const display = () => screen.getByTestId('answer-display').textContent

describe('NumericKeypad', () => {
  afterEach(cleanup)

  it('validates by itself once the expected number of digits is typed', () => {
    const onSubmit = vi.fn()
    render(<NumericKeypad expectedLength={3} onSubmit={onSubmit} resetKey={1} />)
    press('4')
    press('2')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(display()).toBe('42')
    press('7')
    expect(onSubmit).toHaveBeenCalledWith('427')
  })

  it('erases with Backspace and validates early with Enter', () => {
    const onSubmit = vi.fn()
    render(<NumericKeypad expectedLength={4} onSubmit={onSubmit} resetKey={1} />)
    press('1')
    press('9')
    press('Backspace')
    press('8')
    press('Enter')
    expect(onSubmit).toHaveBeenCalledWith('18')
  })

  it('works with the on-screen keys and ignores Enter when empty', () => {
    const onSubmit = vi.fn()
    render(<NumericKeypad expectedLength={null} onSubmit={onSubmit} resetKey={1} />)
    expect(screen.getByRole('button', { name: 'Valider' })).toHaveProperty('disabled', true)
    press('Enter')
    fireEvent.click(screen.getByRole('button', { name: '5' }))
    fireEvent.click(screen.getByRole('button', { name: '0' }))
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('50')
  })

  it('clears the entry for a new item', () => {
    const { rerender } = render(<NumericKeypad expectedLength={3} onSubmit={() => {}} resetKey={1} />)
    press('3')
    rerender(<NumericKeypad expectedLength={3} onSubmit={() => {}} resetKey={2} />)
    expect(display()).toBe('')
    press('9')
    expect(display()).toBe('9')
  })

  it('leaves keys alone while a text field is focused', () => {
    const onSubmit = vi.fn()
    render(
      <>
        <input aria-label="Autre" />
        <NumericKeypad expectedLength={1} onSubmit={onSubmit} resetKey={1} />
      </>,
    )
    fireEvent.keyDown(screen.getByLabelText('Autre'), { key: '4' })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('session screen', () => {
  afterEach(cleanup)

  function solve(): number {
    const [, a, op, b] = /^(\d+) (\S) (\d+)$/.exec(document.querySelector('.problem')!.textContent!)!
    return { '+': +a! + +b!, '-': +a! - +b!, '×': +a! * +b!, '÷': +a! / +b! }[op as '+']
  }

  it('shows a combo after consecutive right answers and resets it on a mistake', () => {
    render(<App repository={new MemoryRepository()} />)
    fireEvent.click(within(screen.getByRole('article', { name: 'Opérations' })).getByRole('button', { name: 'Commencer' }))
    for (const key of String(solve())) press(key)
    expect(screen.queryByTitle('Bonnes réponses d’affilée')).toBeNull()
    for (const key of String(solve())) press(key)
    expect(screen.getByTitle('Bonnes réponses d’affilée').textContent).toBe('🔥 2')
    press('0')
    press('Enter')
    expect(screen.getByTestId('feedback').dataset.result).toBe('ko')
    expect(screen.queryByTitle('Bonnes réponses d’affilée')).toBeNull()
  })

  it('keeps the focus on word fields so typing works without clicking', () => {
    render(<App repository={new MemoryRepository()} />)
    fireEvent.click(within(screen.getByRole('article', { name: 'Anagrammes' })).getByRole('button', { name: 'Commencer' }))
    expect(document.activeElement).toBe(screen.getByLabelText('Réponse'))
  })
})
