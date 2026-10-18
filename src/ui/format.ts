export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "3:07" for 187 s. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
