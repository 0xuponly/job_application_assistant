import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNotifications } from './NotificationsProvider'
import type { NotificationRow } from '../types'

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString()
}

interface RowProps {
  row: NotificationRow
  onDismiss: (id: number) => void
}

function Row({ row, onDismiss }: RowProps) {
  const [expanded, setExpanded] = useState(false)
  return (
    <li
      className="notif-row"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
        background: 'var(--bg-elevated)',
      }}
    >
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 8 }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: 'var(--text)' }}>{row.message}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {row.type} · {row.source} · {formatTime(row.created_at)}
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={(e) => { e.stopPropagation(); onDismiss(row.id) }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', whiteSpace: 'pre-wrap', color: 'var(--text)', fontSize: 13 }}>
          {row.full_message}
        </div>
      )}
    </li>
  )
}

export default function NotificationDrawer() {
  const { list, isOpen, close, dismiss, dismissAll } = useNotifications()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  if (!mounted || !isOpen) return null

  return createPortal(
    <>
      <div
        data-testid="notif-backdrop"
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
        }}
      />
      <aside
        role="dialog"
        aria-label="Notification center"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 400,
          height: '100vh',
          background: 'var(--bg)',
          borderLeft: '1px solid var(--border)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>Notification center</h2>
          <button
            type="button"
            aria-label="Clear all notifications"
            onClick={dismissAll}
            disabled={list.length === 0}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: list.length === 0 ? 'var(--text-muted)' : 'var(--text)',
              padding: '4px 10px',
              cursor: list.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: 12,
            }}
          >
            Dismiss all
          </button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {list.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32, fontSize: 14 }}>
              No notifications.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {list.map((row) => (
                <Row key={row.id} row={row} onDismiss={dismiss} />
              ))}
            </ul>
          )}
        </div>
        <footer style={{ padding: 12, borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
          {list.length === 0 ? '0 notifications' : `${list.length} notification${list.length === 1 ? '' : 's'}`}
        </footer>
      </aside>
    </>,
    document.body
  )
}
