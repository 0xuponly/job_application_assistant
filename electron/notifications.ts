import type { NotificationRow, NotificationType, NotificationSource } from './types'
import { loadStore, saveStore } from './database'

const MAX_FIELD_BYTES = 4096
const ACTIVE_CAP = 500
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000

const VALID_TYPES: readonly NotificationType[] = ['info', 'success', 'error', 'warning']

// Clamp by byte length, not char length. If exceeded, truncate to
// MAX_FIELD_BYTES bytes (re-decode to avoid splitting a multi-byte
// char). Used for both `message` and `full_message`.
function clampBytes(s: string): string {
  if (Buffer.byteLength(s, 'utf-8') <= MAX_FIELD_BYTES) return s
  return Buffer.from(s, 'utf-8').subarray(0, MAX_FIELD_BYTES).toString('utf-8')
}

// Coerce an unknown type string to a known NotificationType. An
// unknown / misspelled value falls back to 'info' so a renderer bug
// can never put a row in an unrenderable state.
function coerceType(t: string): NotificationType {
  return (VALID_TYPES as readonly string[]).includes(t) ? (t as NotificationType) : 'info'
}

export function addNotification(input: {
  type: string
  source?: NotificationSource
  message: string
  full_message: string
}): { id: number } {
  const store = loadStore()
  const id = store.nextId++
  const row: NotificationRow = {
    id,
    type: coerceType(input.type),
    source: input.source ?? 'app',
    message: clampBytes(input.message),
    full_message: clampBytes(input.full_message),
    created_at: Date.now(),
    dismissed_at: null,
  }
  store.notifications.push(row)
  saveStore(store)
  return { id }
}

export function listActiveNotifications(): { rows: NotificationRow[] } {
  const store = loadStore()
  const rows = store.notifications
    .filter((r) => r.dismissed_at === null)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, ACTIVE_CAP)
  return { rows }
}

export function dismissNotification(id: number): { ok: true } {
  const store = loadStore()
  const row = store.notifications.find((r) => r.id === id)
  if (row && row.dismissed_at === null) {
    row.dismissed_at = Date.now()
    saveStore(store)
  }
  return { ok: true }
}

export function dismissAllNotifications(): { updated: number } {
  const store = loadStore()
  let updated = 0
  const now = Date.now()
  for (const r of store.notifications) {
    if (r.dismissed_at === null) {
      r.dismissed_at = now
      updated++
    }
  }
  if (updated > 0) saveStore(store)
  return { updated }
}

export function purgeOldDismissedNotifications(): { deleted: number } {
  const store = loadStore()
  const cutoff = Date.now() - THIRTY_DAYS_MS
  const before = store.notifications.length
  store.notifications = store.notifications.filter(
    (r) => r.dismissed_at === null || r.dismissed_at >= cutoff
  )
  const deleted = before - store.notifications.length
  if (deleted > 0) saveStore(store)
  return { deleted }
}

// Module-level handle so calling startNotificationsPurgeInterval
// twice does not double-register. The single timer ticks every 24h
// and prunes rows dismissed more than 30 days ago.
let purgeTimer: ReturnType<typeof setInterval> | null = null

export function startNotificationsPurgeInterval(): { stop: () => void } {
  if (purgeTimer) {
    return { stop: () => { /* no-op: timer is already cleared */ } }
  }
  purgeTimer = setInterval(() => {
    try {
      purgeOldDismissedNotifications()
    } catch {
      // Swallow: the renderer's notification center is the source of
      // truth for what the user sees; a failed purge just means old
      // rows stick around until the next tick.
    }
  }, PURGE_INTERVAL_MS)
  return {
    stop: () => {
      if (purgeTimer) {
        clearInterval(purgeTimer)
        purgeTimer = null
      }
    },
  }
}
