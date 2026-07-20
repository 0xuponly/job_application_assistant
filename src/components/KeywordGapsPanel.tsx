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
    <div className="keyword-gaps-panel">
      <h3>Keyword Gaps</h3>
      {categories.map((cat) => {
        const entries = (byCategory.get(cat) ?? []).slice().sort((a, b) => b.weight - a.weight)
        return (
          <section key={cat}>
            <h4>{CATEGORY_LABELS[cat]}</h4>
            <ul>
              {entries.map((e) => (
                <li key={`${e.phrase}-${e.source}`} data-weight={e.weight}>
                  {e.phrase}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
