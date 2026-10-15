import { describe, expect, it } from 'vitest'
import { parseAnswer } from './session'

describe('parseAnswer', () => {
  it('accepts integers with surrounding or grouping spaces', () => {
    expect(parseAnswer('42')).toBe(42)
    expect(parseAnswer(' 1 024 ')).toBe(1024)
    expect(parseAnswer('-7')).toBe(-7)
  })

  it('rejects non-integers', () => {
    expect(parseAnswer('')).toBeNull()
    expect(parseAnswer('4.2')).toBeNull()
    expect(parseAnswer('abc')).toBeNull()
    expect(parseAnswer('1e3')).toBeNull()
  })
})
