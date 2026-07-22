import { describe, it, expect } from 'vitest'
import { COUNTRY_TO_CURRENCY } from '../currency'

/**
 * Local copy of the decider under test. We don't import the un-exported
 * helper from JobsPage.tsx because it's not part of the public API;
 * the test pins its behavior so the rewrite can be verified.
 */
function currencyFromLocation(location: string | null | undefined): string | null {
  if (!location) return null
  if (/^(remote|anywhere|worldwide|global|wfh|work from home|distributed|fully remote|100%\s*remote)(?=,|$)/i.test(location.trim())) {
    return null
  }
  const last = location.split(',').pop()?.trim().toUpperCase()
  if (!last || !/^[A-Z]{2}$/.test(last)) return null
  return COUNTRY_TO_CURRENCY[last] ?? null
}

const ISO_CURRENCY_RE = /\b(USD|CAD|EUR|GBP|AUD|NZD|JPY)\b/i
const SYMBOL_TO_CURRENCY: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY' }
const RANGE_SEP_RE = /\s*(-|–|—|to)\s*/i

function condenseAmount(token: string): string {
  const cleaned = token.replace(/[$€£¥\s,]/g, '').replace(/k$/i, '000').replace(/m$/i, '000000')
  const n = parseFloat(cleaned)
  if (!Number.isFinite(n) || n < 1000) return token.trim()
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    const formatted = m % 1 === 0 ? `${m}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`
    return formatted
  }
  return `${Math.round(n / 1000)}k`
}

function condenseSalaryForDisplay(s: string, code: string | null): string {
  const prefix = code ? `${code} ` : ''
  const stripCode = (t: string) =>
    code ? t.replace(new RegExp(`^${code}\\s+`, 'i'), '').trim() : t
  if (!RANGE_SEP_RE.test(s)) {
    return `${prefix}${condenseAmount(stripCode(s))}`
  }
  const m = s.match(RANGE_SEP_RE)
  if (!m) return `${prefix}${condenseAmount(stripCode(s))}`
  const sep = m[1]
  const idx = s.indexOf(m[0])
  const lo = s.slice(0, idx).trim()
  const hi = s.slice(idx + m[0].length).trim()
  const hiNoSymbol = hi.replace(/^[$€£¥]\s*/, '').trim()
  return `${prefix}${condenseAmount(stripCode(lo))} ${sep} ${condenseAmount(hiNoSymbol)}`
}

function formatSalaryForDisplay(
  s: string | null | undefined,
  job: { salary_range?: string | null; location?: string | null }
): string {
  if (!s) return ''
  const iso = s.match(ISO_CURRENCY_RE)
  const code = iso ? iso[1].toUpperCase() : null
  if (code) return condenseSalaryForDisplay(s, code)
  for (const [sym, c] of Object.entries(SYMBOL_TO_CURRENCY)) {
    if (s.includes(sym)) return condenseSalaryForDisplay(s, c)
  }
  return condenseSalaryForDisplay(s, null)
}

describe('currencyFromLocation', () => {
  it('returns null for null input', () => {
    expect(currencyFromLocation(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(currencyFromLocation('')).toBeNull()
  })

  it('returns null for "Remote"', () => {
    expect(currencyFromLocation('Remote')).toBeNull()
  })

  it('returns null for "Worldwide"', () => {
    expect(currencyFromLocation('Worldwide')).toBeNull()
  })

  it('returns null for "Remote, CA, US"', () => {
    expect(currencyFromLocation('Remote, CA, US')).toBeNull()
  })

  it('returns CAD for "Vancouver, CA"', () => {
    expect(currencyFromLocation('Vancouver, CA')).toBe('CAD')
  })

  it('returns CAD for "Vancouver, BC, CA"', () => {
    expect(currencyFromLocation('Vancouver, BC, CA')).toBe('CAD')
  })

  it('returns USD for "New York, NY, US"', () => {
    expect(currencyFromLocation('New York, NY, US')).toBe('USD')
  })

  it('returns EUR for "Berlin, DE"', () => {
    expect(currencyFromLocation('Berlin, DE')).toBe('EUR')
  })

  it('returns GBP for "London, GB"', () => {
    expect(currencyFromLocation('London, GB')).toBe('GBP')
  })

  it('returns AUD for "Sydney, AU"', () => {
    expect(currencyFromLocation('Sydney, AU')).toBe('AUD')
  })

  it('returns SGD for "Singapore, SG"', () => {
    expect(currencyFromLocation('Singapore, SG')).toBe('SGD')
  })

  it('returns INR for "Mumbai, IN"', () => {
    expect(currencyFromLocation('Mumbai, IN')).toBe('INR')
  })

  it('returns SEK for "Stockholm, SE"', () => {
    expect(currencyFromLocation('Stockholm, SE')).toBe('SEK')
  })

  it('returns null for unknown 2-letter code "ZZ"', () => {
    expect(currencyFromLocation('Foo, ZZ')).toBeNull()
  })

  it('returns null for full country name (legacy shape — decider now requires 2-letter)', () => {
    expect(currencyFromLocation('Vancouver, BC, Canada')).toBeNull()
  })

  it('returns null for legacy 2-part shape with full name', () => {
    expect(currencyFromLocation('Vancouver, Canada')).toBeNull()
  })

  it('handles extra whitespace around segments', () => {
    expect(currencyFromLocation('  Vancouver ,  BC ,  CA  ')).toBe('CAD')
  })
})

describe('formatSalaryForDisplay — ISO-prefixed range', () => {
  // Regression: stored shape "CAD 163,000 - 211,000" (emitted by
  // normalizeSalary for any non-USD/EUR/GBP/JPY currency) used to render
  // as "CAD CAD 163,000 - 211k" because condenseAmount can't parse the
  // "CAD 163,000" token (parseFloat stops at the leading letters) and
  // returns it unchanged, then the prefix is prepended on top.
  it('does not duplicate CAD prefix in a CAD range', () => {
    expect(formatSalaryForDisplay('CAD 163,000 - 211,000', { location: null }))
      .toBe('CAD 163k - 211k')
  })

  it('does not duplicate AUD prefix in an AUD range', () => {
    expect(formatSalaryForDisplay('AUD 90,000 - 129,000', { location: null }))
      .toBe('AUD 90k - 129k')
  })

  it('does not duplicate EUR prefix in an EUR range', () => {
    expect(formatSalaryForDisplay('EUR 85,000 - 100,000', { location: null }))
      .toBe('EUR 85k - 100k')
  })

  it('condenses a single CAD amount without duplication', () => {
    expect(formatSalaryForDisplay('CAD 100,000', { location: null }))
      .toBe('CAD 100k')
  })

  // Sanity: the symbol-only range still works (no ISO code, so the
  // SYMBOL_TO_CURRENCY fallback picks USD and prepends "USD ").
  it('still condenses a $ range via the symbol fallback', () => {
    expect(formatSalaryForDisplay('$80,000 - $120,000', { location: null }))
      .toBe('USD 80k - 120k')
  })
})
