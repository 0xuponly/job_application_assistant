// Loads the committed allowlist bundle. Validates the schema at module load
// so consumers can rely on every key being present. The phrase_boost list
// is projected into per-category Sets so the same phrase can resolve to
// either hard or soft depending on which list the phrase appears in first.

import bundle from './data/keywordAllowlists.json'

export type KeywordCategory = 'hard' | 'soft' | 'cert' | 'seniority'

interface RawBundle {
  hard: string[]
  soft: string[]
  cert: string[]
  seniority: string[]
  phrase_boost: string[]
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

function validate(raw: unknown): RawBundle {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('keywordAllowlists: bundle is not an object')
  }
  const r = raw as Record<string, unknown>
  for (const key of ['hard', 'soft', 'cert', 'seniority', 'phrase_boost'] as const) {
    if (!isStringArray(r[key])) {
      throw new Error(`keywordAllowlists: missing or invalid key "${key}"`)
    }
  }
  return r as unknown as RawBundle
}

const validated = validate(bundle)

const norm = (s: string): string => s.toLowerCase().trim()

export interface KeywordAllowlists {
  hard: Set<string>
  soft: Set<string>
  cert: Set<string>
  seniority: Set<string>
  phraseBoost: Set<string>
  phraseBoostByCategory: Map<string, KeywordCategory>
}

let cached: KeywordAllowlists | null = null

export function loadKeywordAllowlists(): KeywordAllowlists {
  if (cached) return cached
  const phraseBoostByCategory = new Map<string, KeywordCategory>()
  for (const p of validated.phrase_boost) {
    const n = norm(p)
    if (validated.hard.some((h) => norm(h) === n)) {
      phraseBoostByCategory.set(n, 'hard')
      continue
    }
    if (validated.soft.some((s) => norm(s) === n)) {
      phraseBoostByCategory.set(n, 'soft')
      continue
    }
    phraseBoostByCategory.set(n, 'hard')
  }
  cached = {
    hard: new Set(validated.hard.map(norm)),
    soft: new Set(validated.soft.map(norm)),
    cert: new Set(validated.cert.map(norm)),
    seniority: new Set(validated.seniority.map(norm)),
    phraseBoost: new Set(validated.phrase_boost.map(norm)),
    phraseBoostByCategory
  }
  return cached
}
