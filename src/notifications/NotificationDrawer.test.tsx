import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationsProvider, useNotifications } from './NotificationsProvider'
import NotificationDrawer from './NotificationDrawer'

const mockApi = {
  notificationsList: vi.fn(),
  notificationsAdd: vi.fn(),
  notificationsDismiss: vi.fn(),
  notificationsDismissAll: vi.fn(),
  notificationsPurgeOldDismissed: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.notificationsList.mockResolvedValue({ rows: [] })
  mockApi.notificationsPurgeOldDismissed.mockResolvedValue({ deleted: 0 })
  // @ts-expect-error - test mock
  globalThis.window.api = mockApi
})

function OpenButton() {
  const { open } = useNotifications()
  return <button onClick={open}>open</button>
}

describe('NotificationDrawer', () => {
  it('renders the empty state when the list is empty', async () => {
    render(<NotificationsProvider><OpenButton /><NotificationDrawer /></NotificationsProvider>)
    fireEvent.click(screen.getByText('open'))
    expect(await screen.findByText(/no notifications/i)).toBeInTheDocument()
  })

  it('renders one row per item in the list', async () => {
    mockApi.notificationsList.mockResolvedValue({ rows: [
      { id: 1, type: 'info', source: 'app', message: 'alpha', full_message: 'alpha long', created_at: 1, dismissed_at: null },
      { id: 2, type: 'error', source: 'ai', message: 'beta', full_message: 'beta long', created_at: 2, dismissed_at: null },
    ]})
    render(<NotificationsProvider><OpenButton /><NotificationDrawer /></NotificationsProvider>)
    fireEvent.click(screen.getByText('open'))
    expect(await screen.findByText('alpha')).toBeInTheDocument()
    expect(await screen.findByText('beta')).toBeInTheDocument()
  })

  it('clicking the body toggles expanded and shows the full message', async () => {
    mockApi.notificationsList.mockResolvedValue({ rows: [
      { id: 1, type: 'info', source: 'app', message: 'short', full_message: 'this is the long version', created_at: 1, dismissed_at: null },
    ]})
    render(<NotificationsProvider><OpenButton /><NotificationDrawer /></NotificationsProvider>)
    fireEvent.click(screen.getByText('open'))
    const body = await screen.findByText('short')
    // The full message is hidden by default
    expect(screen.queryByText('this is the long version')).not.toBeInTheDocument()
    fireEvent.click(body)
    expect(screen.getByText('this is the long version')).toBeInTheDocument()
  })

  it('clicking X calls dismiss', async () => {
    mockApi.notificationsList.mockResolvedValue({ rows: [
      { id: 42, type: 'info', source: 'app', message: 'a', full_message: 'a', created_at: 1, dismissed_at: null },
    ]})
    mockApi.notificationsDismiss.mockResolvedValue({ ok: true })
    render(<NotificationsProvider><OpenButton /><NotificationDrawer /></NotificationsProvider>)
    fireEvent.click(screen.getByText('open'))
    const dismissBtn = await screen.findByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissBtn)
    expect(mockApi.notificationsDismiss).toHaveBeenCalledWith({ id: 42 })
  })

  it('clicking the backdrop calls close', async () => {
    render(<NotificationsProvider><OpenButton /><NotificationDrawer /></NotificationsProvider>)
    fireEvent.click(screen.getByText('open'))
    const backdrop = await screen.findByTestId('notif-backdrop')
    fireEvent.click(backdrop)
    expect(screen.queryByTestId('notif-backdrop')).not.toBeInTheDocument()
  })

  it('pressing Esc calls close', async () => {
    render(<NotificationsProvider><OpenButton /><NotificationDrawer /></NotificationsProvider>)
    fireEvent.click(screen.getByText('open'))
    expect(await screen.findByTestId('notif-backdrop')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('notif-backdrop')).not.toBeInTheDocument()
  })
})
