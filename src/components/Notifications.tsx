import { useEffect, useState } from 'react'

interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
  ttl: number
}

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

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, toast.ttl)
    }
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

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
        return (
          <div
            key={t.id}
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
              animation: 'toast-slide-in 0.2s ease-out',
              whiteSpace: 'pre-line',
              pointerEvents: 'auto'
            }}
          >
            {t.message}
          </div>
        )
      })}
    </div>
  )
}