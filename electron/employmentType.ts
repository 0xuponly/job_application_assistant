/**
 * Canonical employment_type values.
 *
 * All jobs store one of these 8 tokens in the database. Free-form text
 * (e.g. "Full-Time Job", "Casual", "Permanent, Full Time") is mapped to
 * the matching token at the scraper and persistence boundaries. UI
 * surfaces (Edit dropdown, Job Detail Type card) render the token with
 * the human label from `EMPLOYMENT_TYPE_LABELS`.
 *
 * Keep this list in sync with `EMPLOYMENT_TYPE_LABELS` below and with
 * the `<select>` options in JobDetail.tsx.
 */
export const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
  'PERMANENT',
  'VOLUNTEER',
  'FREELANCE'
] as const

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  TEMPORARY: 'Temporary',
  INTERNSHIP: 'Internship',
  PERMANENT: 'Permanent',
  VOLUNTEER: 'Volunteer',
  FREELANCE: 'Freelance'
}

const EMPLOYMENT_TYPE_SET: ReadonlySet<string> = new Set(EMPLOYMENT_TYPES)

/**
 * Map a free-form string (scraper output, legacy DB value, user edit)
 * to a canonical employment_type token. Returns null when the input
 * doesn't match any known value.
 *
 * Matching is case-insensitive and ignores common separators (spaces,
 * hyphens, underscores). Phrases like "Full-Time Job", "Full time",
 * "full-time" all map to FULL_TIME.
 */
export function normalizeEmploymentType(raw: string | null | undefined): EmploymentType | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null

  // Already a canonical token? Return as-is (case-sensitive check first
  // so legitimate stored values pass through untouched).
  if (EMPLOYMENT_TYPE_SET.has(trimmed)) {
    return trimmed as EmploymentType
  }

  // Collapse separators, lowercase, strip trailing job/suffix words like
  // "Job", "Position", "Role" so "Full-Time Job" and "Contract Position"
  // both match their core token.
  const lower = trimmed
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const stripped = lower
    .replace(/\b(job|position|role|work|opening|opportunity)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const candidates = [stripped, lower]
  for (const c of candidates) {
    if (!c) continue
    // Two-word: full/part time
    if (/\b(full)\s*(time)\b/.test(c)) return 'FULL_TIME'
    if (/\b(part)\s*(time)\b/.test(c)) return 'PART_TIME'
    // Single-word tokens
    if (c.includes('contract')) return 'CONTRACT'
    if (c.includes('temporary') || c.includes('temp ')) return 'TEMPORARY'
    if (c.includes('intern')) return 'INTERNSHIP'
    if (c.includes('permanent')) return 'PERMANENT'
    if (c.includes('volunteer')) return 'VOLUNTEER'
    if (c.includes('freelance')) return 'FREELANCE'
  }
  return null
}

/** Render the human label for a stored token. Unknown values pass through verbatim. */
export function formatEmploymentType(token: string | null | undefined): string {
  if (!token) return '—'
  if (token in EMPLOYMENT_TYPE_LABELS) return EMPLOYMENT_TYPE_LABELS[token as EmploymentType]
  return token
}
