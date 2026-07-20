import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ApplyQueuePage } from './ApplyQueuePage'

vi.mock('../api', () => ({
  api: {
    queueList: vi.fn(async () => []),
    queueMarkSubmitted: vi.fn(async () => {}),
    openExternal: vi.fn(async () => {}),
    getSettings: vi.fn(async () => ({ base_cv: '' })),
  },
}))

describe('ApplyQueuePage', () => {
  it('shows the no-base-CV empty state when base_cv is empty', async () => {
    render(<ApplyQueuePage />)
    expect(await screen.findByText(/set your base cv/i)).toBeInTheDocument()
  })
})
