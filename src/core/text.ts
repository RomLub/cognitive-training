const ARTICLES = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd'])

/**
 * Canonical form of a French word for tolerant comparison: lowercase, no accents, no ligature,
 * no leading article, singular (trailing s/x dropped). "Les Éléphants" → "elephant".
 */
export function normalizeWord(word: string): string {
  let w = word
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z' -]/g, '')
    .trim()
  const parts = w.split(/['\s-]+/).filter((p) => p.length > 0)
  while (parts.length > 1 && ARTICLES.has(parts[0]!)) parts.shift()
  w = parts.join('')
  if (w.length > 3 && /[sx]$/.test(w)) w = w.slice(0, -1)
  return w
}

/** Splits free text (typed or spoken) into words, keeping articles attached so they can be dropped. */
export function splitWords(text: string): string[] {
  const tokens = text.split(/[\s,;./]+/).filter((t) => t.length > 0)
  const words: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!
    // "le chat" → one word; "l'arbre" is already one token.
    if (ARTICLES.has(t.toLowerCase()) && i + 1 < tokens.length) {
      words.push(`${t} ${tokens[i + 1]!}`)
      i++
    } else {
      words.push(t)
    }
  }
  return words
}
