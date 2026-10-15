export const SESSION_LENGTH = 20

/** Parses the user's typed answer; returns null when it is not a plain integer. */
export function parseAnswer(input: string): number | null {
  const trimmed = input.trim().replace(/\s/g, '')
  if (!/^-?\d+$/.test(trimmed)) return null
  return Number.parseInt(trimmed, 10)
}
