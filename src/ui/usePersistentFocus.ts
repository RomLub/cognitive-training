import { useEffect, useRef } from 'react'

/**
 * Keeps a text field focused while it is on screen, so typing works without clicking it first
 * (and the phone keyboard stays open between items, since the field is never unmounted).
 */
export function usePersistentFocus<T extends HTMLInputElement>(active = true) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const field = ref.current
    if (!active || field === null) return
    field.focus()
    function refocus(event: FocusEvent) {
      // Let the user move to another text field on purpose; otherwise take the focus back.
      const next = event.relatedTarget
      if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement) return
      requestAnimationFrame(() => {
        if (document.contains(field)) field?.focus()
      })
    }
    field.addEventListener('blur', refocus)
    return () => field.removeEventListener('blur', refocus)
  }, [active])
  return ref
}
