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

  it('copy icon does not double-dismiss and still copies', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true
    })

    const { getByText, getByLabelText } = render(<Notifications />)
    act(() => { notify('payload text') })

    const copyBtn = getByLabelText('Copy toast text to clipboard')
    fireEvent.click(copyBtn)

    expect(writeText).toHaveBeenCalledWith('payload text')
    // Copy path auto-dismisses after 1.5s. Wait for it.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(getByText('payload text')).toBeTruthy() // still in DOM during fade
        setTimeout(() => {
          expect(document.body.textContent).not.toContain('payload text')
          resolve()
        }, 300)
      }, 1700)
    })
  })

  it('action button fires the action and dismisses', () => {
    const onClick = vi.fn()
    const { getByTitle } = render(<Notifications />)
    act(() => {
      notify({ message: 'click me', action: { label: 'Open', onClick } })
    })

    fireEvent.click(getByTitle('Open'))

    expect(onClick).toHaveBeenCalledTimes(1)
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(document.body.textContent).not.toContain('click me')
        resolve()
      }, 300)
    })
  })

  it('TTL still auto-dismisses when no click happens', () => {
    const { getByText } = render(<Notifications />)
    act(() => { notify('still here') })

    expect(getByText('still here')).toBeTruthy()
    // Default info TTL is 4000ms; wait 4500ms + 300ms fade.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(document.body.textContent).not.toContain('still here')
        resolve()
      }, 4800)
    })
  })
})
