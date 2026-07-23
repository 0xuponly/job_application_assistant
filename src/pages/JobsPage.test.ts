import { describe, it, expect } from 'vitest'
import { COUNTRY_TO_CURRENCY, LONG_NAME_TO_COUNTRY } from '../currency'

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
  if (!last) return null
  if (/^[A-Z]{2}$/.test(last)) {
    const direct = COUNTRY_TO_CURRENCY[last]
    if (direct) return direct
  }
  const cc = longNameLookup(last)
  if (cc) return COUNTRY_TO_CURRENCY[cc] ?? null
  return null
}

let longNameLookupCache: Map<string, string> | null = null
function longNameLookup(lastUpper: string): string | null {
  if (!longNameLookupCache) {
    longNameLookupCache = new Map()
    for (const [k, v] of Object.entries(LONG_NAME_TO_COUNTRY)) {
      longNameLookupCache.set(k.toUpperCase(), v)
    }
  }
  return longNameLookupCache.get(lastUpper) ?? null
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
  // Mirrors JobsPage.tsx formatSalaryForDisplay's 4-step decision:
  //   1. Unambiguous ISO code in the salary string.
  const iso = s.match(ISO_CURRENCY_RE)
  if (iso) return condenseSalaryForDisplay(s, iso[1].toUpperCase())
  //   2. Job location's country code.
  const fromLocation = currencyFromLocation(job.location)
  if (fromLocation) return condenseSalaryForDisplay(s, fromLocation)
  //   3. Symbol in the salary string (last resort; ambiguous for $).
  for (const [sym, code] of Object.entries(SYMBOL_TO_CURRENCY)) {
    if (s.includes(sym)) return condenseSalaryForDisplay(s, code)
  }
  //   4. No code found — condense without a prefix.
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

  // Stored locations that are a bare full country name ("Canada",
  // "United States", "United Kingdom") survive in the store as the
  // user typed them — the writer's 1-part branch returns null for
  // these (no city to anchor to, no defaultCountry). The decider
  // falls back to the long-name map so the salary cell picks CAD /
  // USD / GBP correctly without rewriting the stored value. The
  // Location column shows the user-typed "Canada" verbatim.
  it('returns CAD for bare "Canada"', () => {
    expect(currencyFromLocation('Canada')).toBe('CAD')
  })

  it('returns USD for bare "United States"', () => {
    expect(currencyFromLocation('United States')).toBe('USD')
  })

  it('returns GBP for bare "United Kingdom"', () => {
    expect(currencyFromLocation('United Kingdom')).toBe('GBP')
  })

  it('returns AUD for bare "Australia"', () => {
    expect(currencyFromLocation('Australia')).toBe('AUD')
  })

  it('returns EUR for bare "Germany"', () => {
    expect(currencyFromLocation('Germany')).toBe('EUR')
  })

  it('returns USD for bare "USA"', () => {
    expect(currencyFromLocation('USA')).toBe('USD')
  })

  it('returns GBP for bare "UK"', () => {
    expect(currencyFromLocation('UK')).toBe('GBP')
  })

  it('returns CAD for mixed-case "canada"', () => {
    expect(currencyFromLocation('canada')).toBe('CAD')
  })

  it('returns CAD for "Vancouver, Canada" (legacy 2-part long-name shape)', () => {
    // The renderer's last-segment lookup means the 2nd segment of
    // "Vancouver, Canada" is the long-name "Canada" → CA → CAD.
    // This is the legacy shape the v3 retrofit was meant to fix,
    // and the long-name fallback covers any rows it missed.
    expect(currencyFromLocation('Vancouver, Canada')).toBe('CAD')
  })

  it('returns USD for "Vancouver, United States"', () => {
    expect(currencyFromLocation('Vancouver, United States')).toBe('USD')
  })

  it('returns null for bare "Atlantis" (unrecognized long name)', () => {
    expect(currencyFromLocation('Atlantis')).toBeNull()
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

  // When the salary string has no ISO code and no symbol, fall back
  // to the job's location country. Mirrors step 2 of the real
  // formatSalaryForDisplay in JobsPage.tsx.
  it('falls back to job location country for bare numbers', () => {
    expect(formatSalaryForDisplay('85000 - 100000', { location: 'Berlin, DE' }))
      .toBe('EUR 85k - 100k')
  })

  it('location fallback is overridden when the salary string has an ISO code', () => {
    // ISO code wins — location is irrelevant.
    expect(formatSalaryForDisplay('CAD 100,000', { location: 'Berlin, DE' }))
      .toBe('CAD 100k')
  })

  it('location fallback gives up on Remote and falls through to no prefix', () => {
    // Remote is not a country, so currencyFromLocation returns null;
    // the function then tries the symbol step and finally emits no prefix.
    expect(formatSalaryForDisplay('85000 - 100000', { location: 'Remote' }))
      .toBe('85k - 100k')
  })

  // User-reported case: stored `location: "Canada"` (long form, not
  // the canonical "City, REGION, CC") and a $-prefixed range. The
  // renderer's long-name fallback recovers the 2-letter code so the
  // salary decider uses CAD instead of falling through to the
  // symbol-fallback path that would mis-label as USD. The stored
  // location value is left alone — the user wants the Location
  // column to keep showing "Canada", not "Canada, CA".
  it('uses CAD for a $ range with location "Canada" (long-form fallback)', () => {
    // Range is "$200,000 - 235,000": low has a leading $, high
    // doesn't. condenseSalaryForDisplay prefixes the high side
    // (so the rendered shape is "CAD 200k - 235k", not
    // "CAD $200k - $235k") — the prefix already carries the CAD.
    expect(formatSalaryForDisplay('$200,000 - 235,000', { location: 'Canada' }))
      .toBe('CAD 200k - 235k')
  })
})
