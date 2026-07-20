import type { RuleCheck } from '../documentRules'

interface Props {
  rules: RuleCheck[]
}

const DISPLAY_NAMES: Record<RuleCheck['rule'], string> = {
  one_page: 'One page',
  paragraph_count: 'Paragraph count',
  skills_count: 'Skills count',
  keyword_coverage: 'Keyword coverage',
  leadership_one_line: 'Leadership one-line'
}

export default function RuleCheckList({ rules }: Props) {
  const visible = rules.filter((r) => !r.detail.toLowerCase().startsWith('n/a'))

  if (visible.length === 0) return null

  return (
    <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.4 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>
        Rule checks
      </div>
      {visible.map((r) => {
        const icon = r.passed ? '✅' : '❌'
        const color = r.passed ? '#22c55e' : '#ef4444'
        return (
          <div key={r.rule} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ color, fontWeight: 600, minWidth: 14 }}>{icon}</span>
            <span style={{ minWidth: 110, color }}>{DISPLAY_NAMES[r.rule]}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.detail}</span>
          </div>
        )
      })}
    </div>
  )
}
