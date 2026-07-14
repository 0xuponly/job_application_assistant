/**
 * Renderer-side mirror of `electron/employmentType.ts`. The full list of
 * canonical tokens + their display labels, used by the Edit dropdown
 * and the Job Detail Type card. The actual normalization happens in
 * the electron module at the persistence boundary — this file is for
 * UI surface only.
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
  FULL_TIME: 'FULL TIME',
  PART_TIME: 'PART TIME',
  CONTRACT: 'CONTRACT',
  TEMPORARY: 'TEMPORARY',
  INTERNSHIP: 'INTERNSHIP',
  PERMANENT: 'PERMANENT',
  VOLUNTEER: 'VOLUNTEER',
  FREELANCE: 'FREELANCE'
}

const EMPLOYMENT_TYPE_SET: ReadonlySet<string> = new Set(EMPLOYMENT_TYPES)

/** Render the human label for a stored token. Unknown / null values render as "—". */
export function formatEmploymentType(token: string | null | undefined): string {
  if (!token) return '—'
  if (EMPLOYMENT_TYPE_SET.has(token)) return EMPLOYMENT_TYPE_LABELS[token as EmploymentType]
  // Defensive: surface unmappable legacy values verbatim so the user can
  // spot them and pick the right token in Edit. Better than silently
  // showing the token.
  return token
}

/**
 * Canonical work_mode values. Three tokens (ON_SITE, HYBRID, REMOTE)
 * — the Edit dropdown is constrained to these and the persistence
 * boundary normalizes every other value to null. Labels are the
 * tokens themselves (already UPPER_SNAKE_CASE), so no separate
 * label map is needed.
 */
export const WORK_MODES = ['ON_SITE', 'HYBRID', 'REMOTE'] as const

export type WorkMode = (typeof WORK_MODES)[number]
