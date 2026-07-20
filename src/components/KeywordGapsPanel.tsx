import { coverageFor } from '../documentRules'
import type { KeywordResult } from '../types'

type KeywordCategory = KeywordResult['keywords'][number]['category']

interface Props {
  result: KeywordResult
  documentText: string
}

const CATEGORY_LABELS: Record<KeywordCategory, string> = {
  hard: 'Hard Skills',
  soft: 'Soft Skills',
  cert: 'Certifications',
  seniority: 'Seniority Cues'
}

export function KeywordGapsPanel({ result, documentText }: Props) {
  if (result.keywords.length === 0) return null
  const byCategory = new Map<KeywordCategory, typeof result.keywords>()
  for (const entry of result.keywords) {
    const isPresent = coverageFor(documentText, [entry.phrase]) === 1
    if (isPresent) continue
    const list = byCategory.get(entry.category) ?? []
    list.push(entry)
    byCategory.set(entry.category, list)
  }
  const categories = Array.from(byCategory.keys())
  if (categories.length === 0) return null
  return (
    <>
      {categories.map((cat) => {
        const entries = (byCategory.get(cat) ?? []).slice().sort((a, b) => b.weight - a.weight)
        return (
          <section key={cat} style={{ marginBottom: 12 }}>
            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 6 }}>{CATEGORY_LABELS[cat]}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {entries.map((e) => (
                <li key={`${e.phrase}-${e.source}`} data-weight={e.weight} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '2px 0' }}>
                  {e.phrase}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
