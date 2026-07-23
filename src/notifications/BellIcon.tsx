interface Props {
  size?: number
  badge?: boolean
}

export default function BellIcon({ size = 16, badge = false }: Props) {
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {badge && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            background: '#ef4444',  // matches --danger; could be a var but inline is fine for a one-off dot
            borderRadius: '50%',
            border: '2px solid var(--bg)',  // ring matches sidebar background
          }}
        />
      )}
    </span>
  )
}
