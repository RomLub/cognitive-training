import { useEffect, useRef } from 'react'

/**
 * Maps keys (lowercase `KeyboardEvent.key`, e.g. "arrowleft", "f", " ") to choices for the session's lifetime.
 * The handler is read through a ref so the listener never needs re-binding.
 */
export function useKeyboardChoice<T>(keys: Readonly<Record<string, T>>, onChoose: (choice: T) => void): void {
  const handler = useRef(onChoose)
  useEffect(() => {
    handler.current = onChoose
  })
  const keysRef = useRef(keys)
  useEffect(() => {
    keysRef.current = keys
  })
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      // Never steal keys from a text field.
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const choice = keysRef.current[event.key.toLowerCase()]
      if (choice === undefined) return
      event.preventDefault()
      handler.current(choice)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
