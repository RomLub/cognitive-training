import { useState, type FormEvent } from 'react'
import { parseAnswer } from '../domains/calculation/session'

interface Props {
  onSubmit: (value: number) => void
  placeholder?: string
  /** Text after the field, e.g. "€". */
  suffix?: string
}

/** Integer answer field; remount it (key) for each new item to clear it. */
export function NumberAnswerForm({ onSubmit, placeholder, suffix }: Props) {
  const [input, setInput] = useState('')
  const value = parseAnswer(input)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (value !== null) onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="answer-form">
      <input
        autoFocus
        aria-label="Réponse"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {suffix !== undefined && <span className="answer-suffix">{suffix}</span>}
      <button type="submit" disabled={value === null}>
        Valider
      </button>
    </form>
  )
}
