// Lucide-style "refresh-cw" icon. 24×24 viewBox, 1.5px stroke,
// rounded line caps. Renders a single rotating arrow that reads
// clearly at small sizes — replacing the Unicode glyph "⟳" that
// renders inconsistently across platforms.
interface Props {
  size?: number
  className?: string
}

export default function RefreshIcon({ size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M21 12a9 9 0 0 0-15-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
      <path d="M21 21v-5h-5" />
    </svg>
  )
}
