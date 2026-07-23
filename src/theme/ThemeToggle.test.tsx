import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeProvider'
import ThemeToggle from './ThemeToggle'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

function Harness() {
  useTheme()
  return <ThemeToggle />
}

describe('ThemeToggle', () => {
  it('renders sun icon and "switch to light" label when dark', () => {
    render(<ThemeProvider><Harness /></ThemeProvider>)
    const btn = screen.getByRole('button', { name: /switch to light theme/i })
    expect(btn).toBeInTheDocument()
  })

  it('clicking calls toggle and updates label', () => {
    render(<ThemeProvider><Harness /></ThemeProvider>)
    const btn = screen.getByRole('button', { name: /switch to light theme/i })
    fireEvent.click(btn)
    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument()
  })
})
