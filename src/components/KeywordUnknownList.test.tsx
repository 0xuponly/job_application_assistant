import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeywordUnknownList } from './KeywordUnknownList'

describe('KeywordUnknownList', () => {
  it('renders nothing when unknownPhrases is empty', () => {
    const { container } = render(<KeywordUnknownList unknownPhrases={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when unknownPhrases is not an array (defensive)', () => {
    const { container } = render(<KeywordUnknownList unknownPhrases={undefined as any} />)
    expect(container.firstChild).toBeNull()
  })

  it('lists the unknown phrases', () => {
    render(<KeywordUnknownList unknownPhrases={['temporal', 'pulumi', 'duckdb']} />)
    expect(screen.getByText('temporal')).toBeInTheDocument()
    expect(screen.getByText('pulumi')).toBeInTheDocument()
    expect(screen.getByText('duckdb')).toBeInTheDocument()
  })

  it('has a "Copy as JSON" button that calls navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })
    render(<KeywordUnknownList unknownPhrases={['temporal', 'pulumi']} />)
    const button = screen.getByRole('button', { name: /copy as json/i })
    fireEvent.click(button)
    expect(writeText).toHaveBeenCalledWith(JSON.stringify(['temporal', 'pulumi'], null, 2))
  })
})
