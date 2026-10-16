import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Number of digits of the expected answer: reaching it validates automatically. null = validate with ✓ / Enter. */
  expectedLength: number | null
  onSubmit: (value: string) => void
  /** Changing it clears the entry (a new item). */
  resetKey: unknown
  maxLength?: number
  /** Unit shown after the answer, e.g. "€". */
  suffix?: string
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const

/**
 * Always-visible digit pad: no field to tap, no phone keyboard popping up. The physical keyboard works too
 * (digits, Backspace, Enter) without clicking anywhere. Validates on its own once the answer has the expected length.
 */
export function NumericKeypad({ expectedLength, onSubmit, resetKey, maxLength = 24, suffix }: Props) {
  const [entry, setEntry] = useState('')
  const [entryFor, setEntryFor] = useState(resetKey)
  // Source of truth for key handling: two keys before a re-render must both count.
  const entryRef = useRef('')

  if (entryFor !== resetKey) {
    setEntryFor(resetKey)
    setEntry('')
  }
  useEffect(() => {
    entryRef.current = ''
  }, [resetKey])

  function handleKey(key: string) {
    const current = entryRef.current
    if (key === 'del') {
      entryRef.current = current.slice(0, -1)
      setEntry(entryRef.current)
      return
    }
    if (key === 'ok') {
      if (current !== '') onSubmit(current)
      return
    }
    if (!/^\d$/.test(key) || current.length >= maxLength) return
    const next = current + key
    entryRef.current = next
    setEntry(next)
    if (expectedLength !== null && next.length === expectedLength) onSubmit(next)
  }

  // The window listener reads the latest handler through a ref, updated after each render.
  const press = useRef(handleKey)
  useEffect(() => {
    press.current = handleKey
  })

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const key = event.key === 'Backspace' ? 'del' : event.key === 'Enter' ? 'ok' : event.key
      if (key !== 'del' && key !== 'ok' && !/^\d$/.test(key)) return
      event.preventDefault()
      press.current(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const slots = expectedLength !== null && expectedLength <= 8 ? expectedLength : null

  return (
    <div className="keypad-zone">
      <output className="answer-display" aria-label="Réponse" aria-live="polite" data-testid="answer-display">
        {slots === null ? (
          <span className={`answer-free ${entry === '' ? 'empty' : ''}`}>{entry === '' ? '?' : entry}</span>
        ) : (
          Array.from({ length: slots }, (_, i) => (
            <span key={i} className={`answer-slot ${i < entry.length ? 'filled' : ''} ${i === entry.length ? 'next' : ''}`}>
              {entry[i] ?? ''}
            </span>
          ))
        )}
        {suffix !== undefined && <span className="answer-suffix">{suffix}</span>}
      </output>
      <div className="keypad" role="group" aria-label="Pavé numérique">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`key key-${key === 'del' ? 'del' : key === 'ok' ? 'ok' : 'digit'}`}
            aria-label={key === 'del' ? 'Effacer' : key === 'ok' ? 'Valider' : key}
            disabled={key === 'ok' && entry === ''}
            onClick={() => handleKey(key)}
          >
            {key === 'del' ? '⌫' : key === 'ok' ? '✓' : key}
          </button>
        ))}
      </div>
    </div>
  )
}
