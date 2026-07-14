import { useEffect, useState } from 'react'

interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
  ttl: number
}

const FADE_OUT_MS = 250

let nextId = 0
let listeners: ((toast: Toast) => void)[] = []

export function notify(message: string, type: Toast['type'] = 'info', ttl?: number): void {
  const toast: Toast = {
    id: nextId++,
    message,
    type,
    ttl: ttl ?? (type === 'error' ? 8000 : 4000)
  }
  for (const l of listeners) l(toast)
}

export default function Notifications() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dismissing, setDismissing] = useState<Set<number>>(new Set())

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => startDismiss(toast.id), toast.ttl)
    }
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  function startDismiss(id: number) {
    setDismissing((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      setDismissing((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, FADE_OUT_MS)
  }

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none'
    }}>
      {toasts.map((t) => {
        const borderColor = t.type === 'error' ? 'var(--danger)' : t.type === 'success' ? '#22c55e' : 'var(--accent)'
        const isDismissing = dismissing.has(t.id)
        return (
          <div
            key={t.id}
            onClick={() => startDismiss(t.id)}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              background: 'transparent',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              color: t.type === 'error' || t.type === 'success' ? '#fff' : 'var(--text)',
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              maxWidth: t.message.includes('\n') ? 480 : 360,
              border: `1px solid ${borderColor}`,
              animation: isDismissing
                ? 'toast-fade-out 0.25s ease-in forwards'
                : 'toast-slide-in 0.2s ease-out',
              whiteSpace: 'pre-line',
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
          >
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
