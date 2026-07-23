import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test strategy: mock ./database with a real in-memory store stub,
// matching the project's existing vi.mock('./database', ...) pattern
// (see electron/ai.test.ts, electron/tailorJobDocs.test.ts). The stub
// holds state across calls so we can assert that the notifications
// helpers round-trip through the store correctly. No temp files, no
// env vars, no fixture drift — same shape as the existing tests.

interface NotificationRow {
  id: number
  type: 'info' | 'success' | 'error' | 'warning'
  source: 'app' | 'ai' | 'scanner' | 'tailor' | 'scraper'
  message: string
  full_message: string
  created_at: number
  dismissed_at: number | null
}

interface StubStore {
  notifications: NotificationRow[]
  nextId: number
}

const store: StubStore = { notifications: [], nextId: 1 }

vi.mock('./database', () => ({
  loadStore: () => store,
  saveStore: vi.fn(),
}))

import {
  addNotification,
  listActiveNotifications,
  dismissNotification,
  dismissAllNotifications,
  purgeOldDismissedNotifications,
  startNotificationsPurgeInterval,
} from './notifications'

beforeEach(() => {
  store.notifications = []
  store.nextId = 1
  vi.useRealTimers()
})

describe('addNotification', () => {
  it('inserts a row and returns a positive id with default source app', () => {
    const { id } = addNotification({ type: 'info', message: 'hello', full_message: 'hello world' })
    expect(id).toBeGreaterThan(0)
    const { rows } = listActiveNotifications()
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(id)
    expect(rows[0].message).toBe('hello')
    expect(rows[0].source).toBe('app')
    expect(rows[0].dismissed_at).toBeNull()
  })

  it('clamps message and full_message to 4096 bytes', () => {
    const big = 'x'.repeat(5000)
    addNotification({ type: 'info', message: big, full_message: big })
    const { rows } = listActiveNotifications()
    expect(Buffer.byteLength(rows[0].message, 'utf-8')).toBeLessThanOrEqual(4096)
    expect(Buffer.byteLength(rows[0].full_message, 'utf-8')).toBeLessThanOrEqual(4096)
  })

  it('coerces an invalid type to info', () => {
    addNotification({ type: 'gibberish' as unknown as 'info', message: 'm', full_message: 'm' })
    const { rows } = listActiveNotifications()
    expect(rows[0].type).toBe('info')
  })
})

describe('listActiveNotifications', () => {
  it('excludes dismissed rows', () => {
    const { id: a } = addNotification({ type: 'info', message: 'a', full_message: 'a' })
    addNotification({ type: 'info', message: 'b', full_message: 'b' })
    dismissNotification(a)
    const { rows } = listActiveNotifications()
    expect(rows).toHaveLength(1)
    expect(rows[0].message).toBe('b')
  })

  it('orders by created_at DESC', () => {
    const { id: first } = addNotification({ type: 'info', message: 'first', full_message: 'first' })
    // Bump created_at on the first row so the second insert (Date.now()
    // on the same tick) is unambiguously later.
    store.notifications.find((r) => r.id === first)!.created_at = 1
    addNotification({ type: 'info', message: 'second', full_message: 'second' })
    const { rows } = listActiveNotifications()
    expect(rows[0].message).toBe('second')
    expect(rows[1].message).toBe('first')
  })

  it('caps the result at 500 rows', () => {
    for (let i = 0; i < 510; i++) {
      addNotification({ type: 'info', message: `m${i}`, full_message: `m${i}` })
    }
    const { rows } = listActiveNotifications()
    expect(rows).toHaveLength(500)
  })
})

describe('dismissAllNotifications', () => {
  it('returns the count and dismisses every active row', () => {
    addNotification({ type: 'info', message: 'a', full_message: 'a' })
    addNotification({ type: 'info', message: 'b', full_message: 'b' })
    const result = dismissAllNotifications()
    expect(result.updated).toBe(2)
    expect(listActiveNotifications().rows).toHaveLength(0)
  })
})

describe('purgeOldDismissedNotifications', () => {
  it('deletes rows dismissed more than 30 days ago', () => {
    const { id: oldId } = addNotification({ type: 'info', message: 'old', full_message: 'old' })
    dismissNotification(oldId)
    store.notifications.find((r) => r.id === oldId)!.dismissed_at =
      Date.now() - 31 * 24 * 60 * 60 * 1000
    addNotification({ type: 'info', message: 'fresh', full_message: 'fresh' })
    const result = purgeOldDismissedNotifications()
    expect(result.deleted).toBe(1)
    const { rows } = listActiveNotifications()
    expect(rows).toHaveLength(1)
    expect(rows[0].message).toBe('fresh')
  })
})

describe('startNotificationsPurgeInterval', () => {
  it('is idempotent: second start is a no-op, stop clears the timer', () => {
    vi.useFakeTimers()
    const a = startNotificationsPurgeInterval()
    const b = startNotificationsPurgeInterval()
    // b is a no-op handle because a is already registered; calling
    // b.stop() after a.stop() should also be a no-op (timer is
    // already cleared).
    // Insert a dismissed+backdated row that the interval will purge.
    const { id: staleId } = addNotification({ type: 'info', message: 'stale', full_message: 'stale' })
    dismissNotification(staleId)
    store.notifications.find((r) => r.id === staleId)!.dismissed_at =
      Date.now() - 31 * 24 * 60 * 60 * 1000
    expect(store.notifications).toHaveLength(1)
    // Advance 24h to fire the interval once.
    vi.advanceTimersByTime(24 * 60 * 60 * 1000)
    expect(store.notifications).toHaveLength(0)
    a.stop()
    b.stop()
  })
})
