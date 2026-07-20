// Pure, deterministic keyword extraction pipeline. No I/O, no Electron
// imports — safe to import from anywhere, including vitest and the
// renderer.

import { loadKeywordAllowlists } from './keywordAllowlists'

export type KeywordCategory = 'hard' | 'soft' | 'cert' | 'seniority'
export type KeywordSource = 'title' | 'required' | 'preferred' | 'body'

export interface KeywordEntry {
  phrase: string
  weight: number
  category: KeywordCategory
  source: KeywordSource
}

export interface KeywordResult {
  keywords: KeywordEntry[]
  refinedByLlm: boolean
}

const REQUIRED_RE = /required|must have|requirements|qualifications|what you(?:'| wi)ll need|minimum qualifications|essential/i
const PREFERRED_RE = /preferred|nice to have|bonus|plus|would be great|desired/i
// Section-noun phrases that signal "we are now back in body" — these are
// the typical headings that follow a required/preferred block.
const RESET_RE = /^(about|overview|company|role|benefits|perks|equal opportunity|what we offer|what we|who we|why|how we|mission|vision|summary|responsibilities|what you'll do|what you will do|compensation|salary)\b/i

function isHeaderLine(line: string): { required: true } | { preferred: true } | { reset: true } | null {
  const t = line.trim()
  if (t === '') return null
  // Headers are short, title-cased or all-caps lines without terminal punctuation.
  if (t.length > 60) return null
  if (/[.!?]$/.test(t)) return null
  if (REQUIRED_RE.test(t)) return { required: true }
  if (PREFERRED_RE.test(t)) return { preferred: true }
  // List-item lines (starting with -, *, •, or a digit) are not headers.
  if (/^[-*•\d]/.test(t)) return null
  // A line starting with a known section-noun phrase (About, Overview,
  // Company, Benefits, etc.) resets the bucket back to body.
  if (RESET_RE.test(t)) return { reset: true }
  return null
}

export function parseSections(description: string): {
  title: string
  required: string
  preferred: string
  body: string
} {
  const lines = description.split('\n')
  let title = ''
  let bucket: 'body' | 'required' | 'preferred' = 'body'
  const requiredLines: string[] = []
  const preferredLines: string[] = []
  const bodyLines: string[] = []
  let titleSeen = false

  for (const raw of lines) {
    const t = raw.trim()
    // The first non-empty line is always the title; never treat it as a header.
    if (!titleSeen) {
      if (t === '') continue
      title = t
      titleSeen = true
      continue
    }
    const header = isHeaderLine(raw)
    if (header) {
      if ('required' in header) bucket = 'required'
      else if ('preferred' in header) bucket = 'preferred'
      else bucket = 'body'
      continue
    }
    if (t === '') continue
    if (bucket === 'required') requiredLines.push(raw.toLowerCase())
    else if (bucket === 'preferred') preferredLines.push(raw.toLowerCase())
    else bodyLines.push(raw)
  }

  return {
    title,
    required: requiredLines.join('\n'),
    preferred: preferredLines.join('\n'),
    body: bodyLines.join('\n')
  }
}

// Stub so the file compiles before later tasks land. Will be replaced.
export function extractJobKeywordsStructured(_description: string): KeywordResult {
  return { keywords: [], refinedByLlm: false }
}

export function extractJobKeywords(description: string): string[] {
  return extractJobKeywordsStructured(description).keywords.map((k) => k.phrase)
}
