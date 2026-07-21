import { useState } from 'react'

interface Props {
  unknownPhrases: string[]
}

/**
 * Surfaces LLM-extracted phrases that are not in any allowlist. These were
 * accepted with a 0.8x weight downweight; the user can review them and
 * decide whether to add to keywordAllowlists.json in a follow-up PR.
 *
 * Renders nothing when the list is empty or not an array (defensive read
 * for hot-reload with an old schema).
 */
export function KeywordUnknownList({ unknownPhrases }: Props) {
  const [copied, setCopied] = useState(false)

  if (!Array.isArray(unknownPhrases) || unknownPhrases.length === 0) {
    return null
  }

  const handleCopy = async () => {
    const json = JSON.stringify(unknownPhrases, null, 2)
    await navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="keyword-unknown-list" aria-label="Unknown keywords">
      <h3>Consider adding to allowlist</h3>
      <p>
        These phrases were extracted by the LLM but are not in any allowlist.
        They were accepted with a 0.8x weight downweight.
      </p>
      <ul>
        {unknownPhrases.map((phrase) => (
          <li key={phrase}>{phrase}</li>
        ))}
      </ul>
      <button type="button" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy as JSON'}
      </button>
    </section>
  )
}
