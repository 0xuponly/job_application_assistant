// Comprehensive HTML entity table. Covers the named entities that actually
// appear in scraped job-board HTML (curly quotes, dashes, bullets, etc.)
// plus the basic XML/HTML core. Numeric entities (&#NNN; / &#xHH;) are
// handled by the decoder function, not by this table.
const ENTITY_MAP: Record<string, string> = {
  // Core XML/HTML
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  // Apostrophe / quotes
  '&#39;': "'",
  '&#x27;': "'",
  '&lsquo;': '\u2018',  // '
  '&rsquo;': '\u2019',  // '
  '&ldquo;': '\u201C',  // "
  '&rdquo;': '\u201D',  // "
  '&sbquo;': '\u201A',  // ‚
  '&bdquo;': '\u201E',  // „
  '&laquo;': '\u00AB',  // «
  '&raquo;': '\u00BB',  // »
  // Dashes
  '&ndash;': '\u2013',  // –
  '&mdash;': '\u2014',  // —
  '&minus;': '\u2212',  // −
  // Spaces
  '&nbsp;': ' ',
  '&thinsp;': '\u2009',
  '&ensp;': '\u2002',
  '&emsp;': '\u2003',
  // Ellipsis
  '&hellip;': '\u2026', // …
  '&mldr;': '\u2026',
  // Bullets / markers
  '&bull;': '\u2022',   // •
  '&middot;': '\u00B7', // ·
  '&bullets;': '\u2022',
  '&bullet;': '\u2022',
  // Misc punctuation
  '&copy;': '\u00A9',   // ©
  '&reg;': '\u00AE',    // ®
  '&trade;': '\u2122',  // ™
  '&deg;': '\u00B0',    // °
  '&para;': '\u00B6',   // ¶
  '&sect;': '\u00A7',   // §
  '&times;': '\u00D7',  // ×
  '&divide;': '\u00F7', // ÷
  '&plusmn;': '\u00B1', // ±
  '&micro;': '\u00B5',  // µ
  '&euro;': '\u20AC',   // €
  '&pound;': '\u00A3',  // £
  '&cent;': '\u00A2',   // ¢
  '&yen;': '\u00A5',    // ¥
  // Arrows
  '&larr;': '\u2190',
  '&rarr;': '\u2192',
  '&uarr;': '\u2191',
  '&darr;': '\u2193',
  '&harr;': '\u2194'
}

export function decodeEntities(s: string): string {
  return s.replace(/&[#\w]+;/g, (m) => {
    // Numeric decimal entity: &#NNN;
    if (m.startsWith('&#') && !m.startsWith('&#x') && !m.startsWith('&#X')) {
      const code = parseInt(m.slice(2, -1), 10)
      if (!isNaN(code) && code > 0 && code <= 0x10FFFF) {
        try { return String.fromCodePoint(code) } catch { return m }
      }
      return m
    }
    // Hex entity: &#xHH; or &#XHH;
    if (m.startsWith('&#x') || m.startsWith('&#X')) {
      const code = parseInt(m.slice(3, -1), 16)
      if (!isNaN(code) && code > 0 && code <= 0x10FFFF) {
        try { return String.fromCodePoint(code) } catch { return m }
      }
      return m
    }
    return ENTITY_MAP[m] ?? m
  })
}

// ---------------------------------------------------------------------------
// Location formatting
// ---------------------------------------------------------------------------
// Target shape: "City, REGION, CC" (region and country as 2-letter codes).
// US states + DC, Canadian provinces/territories, and ~30 common countries are
// mapped from full names to codes. Anything we don't recognize is preserved
// as-is so we never lose data.

const US_STATES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
}

const CA_PROVINCES: Record<string, string> = {
  'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB',
  'new brunswick': 'NB', 'newfoundland and labrador': 'NL', 'nova scotia': 'NS',
  'ontario': 'ON', 'prince edward island': 'PE', 'quebec': 'QC',
  'saskatchewan': 'SK', 'northwest territories': 'NT', 'nunavut': 'NU',
  'yukon': 'YT'
}

const COUNTRIES: Record<string, string> = {
  'united states': 'US', 'united states of america': 'US', 'usa': 'US', 'us': 'US', 'america': 'US',
  'canada': 'CA',
  'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB', 'northern ireland': 'GB',
  'germany': 'DE', 'france': 'FR', 'spain': 'ES', 'italy': 'IT', 'netherlands': 'NL',
  'ireland': 'IE', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK', 'finland': 'FI',
  'switzerland': 'CH', 'austria': 'AT', 'belgium': 'BE', 'portugal': 'PT', 'poland': 'PL',
  'czech republic': 'CZ', 'czechia': 'CZ', 'romania': 'RO', 'hungary': 'HU', 'greece': 'GR',
  'australia': 'AU', 'new zealand': 'NZ',
  'india': 'IN', 'china': 'CN', 'japan': 'JP', 'south korea': 'KR', 'korea': 'KR',
  'singapore': 'SG', 'hong kong': 'HK', 'taiwan': 'TW',
  'brazil': 'BR', 'mexico': 'MX', 'argentina': 'AR', 'chile': 'CL', 'colombia': 'CO',
  'israel': 'IL', 'united arab emirates': 'AE', 'uae': 'AE',
  'south africa': 'ZA', 'nigeria': 'NG', 'egypt': 'EG', 'kenya': 'KE',
  'turkey': 'TR', 'russia': 'RU', 'ukraine': 'UA'
}

const REGION_MAP: Record<string, string> = { ...US_STATES, ...CA_PROVINCES }

const REMOTE_TOKENS = new Set([
  'remote', 'anywhere', 'worldwide', 'global', 'wfh', 'work from home',
  'distributed', 'fully remote', '100% remote'
])

function normalizeToken(t: string): string {
  return t.trim().replace(/\s+/g, ' ').replace(/\.$/, '')
}

function canonicalizeRegion(token: string): string | null {
  const cleaned = normalizeToken(token)
  if (!cleaned) return null
  const upper = cleaned.toUpperCase()
  if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) return upper
  const key = cleaned.toLowerCase()
  if (REGION_MAP[key]) return REGION_MAP[key]
  return null
}

function canonicalizeCountry(token: string): string | null {
  const cleaned = normalizeToken(token)
  if (!cleaned) return null
  const upper = cleaned.toUpperCase()
  if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) return upper
  const key = cleaned.toLowerCase()
  if (COUNTRIES[key]) return COUNTRIES[key]
  return null
}

function formatSingleLocation(raw: string, defaultCountry: string): string {
  const cleaned = normalizeToken(raw)
  if (!cleaned) return ''

  // Preserve known remote/anywhere tokens verbatim.
  if (REMOTE_TOKENS.has(cleaned.toLowerCase())) return cleaned

  // Split on common separators.
  const parts = cleaned
    .split(/[,;|]/)
    .map(normalizeToken)
    .filter(Boolean)

  if (parts.length === 0) return cleaned
  // If the city half is a remote token (e.g. "Remote, CA, US"), drop the
  // location suffix — remote is country-agnostic.
  if (REMOTE_TOKENS.has(parts[0].toLowerCase())) return parts[0]
  if (parts.length === 1) {
    const city = parts[0]
    const cc = canonicalizeCountry(defaultCountry)
    return cc ? `${city}, ${cc}` : city
  }

  if (parts.length === 2) {
    const [city, regionOrCountry] = parts

    // 2-part inputs NEVER get the default country appended — the user has
    // already specified a second piece (region OR country), so respect it.
    // 2-letter tokens are disambiguated against US_STATES + CA_PROVINCES +
    // COUNTRIES; the "CA" collision (California vs Canada) prefers country.
    const upper = regionOrCountry.toUpperCase()
    if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) {
      const isCountryCode = !!COUNTRIES[regionOrCountry.toLowerCase()]
      const isRegionCode = !!REGION_MAP[regionOrCountry.toLowerCase()]
      if (isCountryCode || isRegionCode) {
        return `${city}, ${upper}`
      }
      // Unknown 2-letter token: pass through unchanged.
      return `${city}, ${regionOrCountry}`
    }

    // Full-name second token: region or country, never append default.
    const region = canonicalizeRegion(regionOrCountry)
    if (region) return `${city}, ${region}`
    const country = canonicalizeCountry(regionOrCountry)
    if (country) return `${city}, ${country}`
    return `${city}, ${regionOrCountry}`
  }


  // 3+ parts: City, Region, Country[, extras...]
  const [city, regionTok, countryTok] = parts
  const region = canonicalizeRegion(regionTok)
  const country = canonicalizeCountry(countryTok) || canonicalizeCountry(defaultCountry)
  if (region && country) return `${city}, ${region}, ${country}`
  if (country) return `${city}, ${country}`
  if (region) return `${city}, ${region}`
  return cleaned
}

/**
 * Normalize a freeform location string to "City, REGION, CC" when possible.
 * Multi-location strings (joined by `;`) are normalized per piece.
 * Returns null if the input is empty or unparseable.
 */
export function formatLocation(raw: string | null | undefined, defaultCountry?: string | null): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const dc = (defaultCountry || '').trim()

  if (trimmed.includes(';')) {
    const pieces = trimmed
      .split(';')
      .map((p) => formatSingleLocation(p, dc))
      .filter(Boolean)
    if (pieces.length === 0) return null
    return pieces.join('; ')
  }

  return formatSingleLocation(trimmed, dc) || null
}

// ---------------------------------------------------------------------------
// Title / company normalization
// ---------------------------------------------------------------------------
// Both run at the persistence boundary (createJob / updateJob) so the rest
// of the codebase can treat these fields as display-ready. Scrapers are
// free to pass whatever they scraped; we clean it up here.
//
// Rules:
//   normalizeTitle — Title Case. Small prepositions/articles/conjunctions
//     (of, and, the, etc.) are lowercase unless they're the first word.
//     Tokens with internal uppercase (iOS, GitHub, McDonalds) are preserved
//     verbatim. Pure-digit / mixed-alphanumeric tokens (v2, SQL2008) are
//     preserved verbatim.
//
//   normalizeCompany — Sentence case. The first letter of every word is
//     capitalized; everything else is lowercase. Trailing punctuation is
//     stripped. Tokens with internal uppercase are preserved. Acronyms
//     in the company name (IBM, KPMG, etc.) are NOT special-cased — they
//     become "Ibm", "Kpmg". If a user wants the display form to keep
//     acronyms, that's a future ask.

const SMALL_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of',
  'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with'
])

/**
 * Returns true for tokens that should be passed through unchanged because
 * they have intentional casing or non-letter content. Catches:
 *   - genuine mixed case: "iOS", "GitHub", "McDonalds" (has both upper
 *     and lower letters)
 *   - tokens without any letters: "3M", "v2", "SQL2008" (digits, symbols)
 *
 * All-caps tokens ("SENIOR", "ACME") and all-lower tokens ("senior",
 * "acme") are NOT preserved — they go through the case path so they get
 * normalized.
 */
function shouldPreserveToken(word: string): boolean {
  const hasLower = /[a-z]/.test(word)
  const hasUpper = /[A-Z]/.test(word)
  if (hasLower && hasUpper) return true
  if (!hasLower && !hasUpper) return true
  return false
}

function titleCaseWord(word: string, isFirst: boolean): string {
  if (!word) return word
  if (shouldPreserveToken(word)) return word
  const lower = word.toLowerCase()
  if (isFirst) return lower.charAt(0).toUpperCase() + lower.slice(1)
  if (SMALL_WORDS.has(lower)) return lower
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/**
 * Normalize a job title to Title Case. Lowercases the whole string, then
 * capitalizes the first letter of every word except small prepositions /
 * articles / conjunctions ("of", "and", "the", etc.). Preserves
 * mixed-case tokens (iOS, GitHub, McDonalds) and alphanumeric tokens
 * (v2, SQL2008) verbatim. Collapses internal whitespace and trims.
 * Returns null for empty input.
 *
 * Examples:
 *   "software developer"          -> "Software Developer"
 *   "SENIOR SOFTWARE DEVELOPER"   -> "Senior Software Developer"
 *   "manager of engineering"      -> "Manager of Engineering"
 *   "iOS engineer"                -> "iOS Engineer"
 *   "engineer v2"                 -> "Engineer v2"
 */
export function normalizeTitle(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  const tokens = trimmed.split(' ')
  return tokens
    .map((t, i) => titleCaseWord(t, i === 0))
    .join(' ')
}

/**
 * Normalize a company name to Sentence case. The first letter of every
 * word is capitalized; everything else is lowercase. Trailing punctuation
 * is stripped. Mixed-case tokens (GitHub, McDonalds) and alphanumeric
 * tokens (3M) are preserved. Returns null for empty input.
 *
 * Examples:
 *   "SUM'S GROCERY CHECK OUT LTD." -> "Sum's Grocery Check Out Ltd"
 *   "ACME corp"                    -> "Acme Corp"
 *   "github"                       -> "Github"
 *   "GitHub"                       -> "GitHub"  (already mixed-case)
 *   "3M"                           -> "3M"
 */
export function normalizeCompany(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[.,;:]+$/g, '').trim()
  if (!cleaned) return null
  const tokens = cleaned.split(' ')
  return tokens
    .map((t, i) => titleCaseWord(t, i === 0))
    .join(' ')
}
