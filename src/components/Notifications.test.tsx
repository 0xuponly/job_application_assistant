import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'
import Notifications, { notify } from './Notifications'

describe('Notifications toast click-to-dismiss', () => {
  beforeEach(() => {
    // Use real timers; the 250ms fade + 4000ms TTL are fine for a vitest run.
    vi.useRealTimers()
  })

  it('dismisses a toast when its body is clicked', () => {
    const { getByText, queryByText } = render(<Notifications />)
    act(() => { notify('hello world') })

    const body = getByText('hello world')
    fireEvent.click(body)

    // After the 250ms fade the toast is removed from state.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(queryByText('hello world')).toBeNull()
        resolve()
      }, 300)
    })
  })
})
