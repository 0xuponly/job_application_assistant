import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stub the ./database module to avoid pulling in the real database
// (which transitively imports electron/logger and requires a live
// Electron `app` runtime). Only `listApiModels` is exercised by
// `refineJobKeywordsViaLlm`; the other exports are unused.
vi.mock('./database', () => ({
  getSettings: vi.fn(),
  listApiModels: vi.fn(() => []),
  getDocument: vi.fn(),
  updateDocument: vi.fn(),
  updateDocumentVerification: vi.fn(),
  listApplications: vi.fn(() => []),
  updateApplication: vi.fn(),
  createDocument: vi.fn(),
  getJob: vi.fn()
}))

import * as database from './database'
import { refineJobKeywordsViaLlm } from './ai'

describe('refineJobKeywordsViaLlm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns refined result on a successful LLM response', async () => {
    vi.spyOn(database, 'listApiModels').mockReturnValue([
      { id: 1, name: 'mock', enabled: true } as any
    ])
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        keywords: [
          { phrase: 'python', weight: 0.9, category: 'hard' },
          { phrase: 'leadership', weight: 0.6, category: 'soft' }
        ],
        dropped: ['aws']
      }) } }]
    }), { status: 200 })))

    const candidates = [
      { phrase: 'python', weight: 0.7, category: 'hard' as const, source: 'required' as const },
      { phrase: 'aws', weight: 0.5, category: 'hard' as const, source: 'required' as const },
      { phrase: 'leadership', weight: 0.4, category: 'soft' as const, source: 'body' as const }
    ]
    const result = await refineJobKeywordsViaLlm(candidates, 'JD body', undefined)
    expect(result.refinedByLlm).toBe(true)
    expect(result.keywords.map((k) => k.phrase)).toEqual(['python', 'leadership'])
  })

  it('falls back to the pure result when no models are configured', async () => {
    vi.spyOn(database, 'listApiModels').mockReturnValue([])
    const candidates = [
      { phrase: 'python', weight: 0.7, category: 'hard' as const, source: 'required' as const }
    ]
    const result = await refineJobKeywordsViaLlm(candidates, 'JD body', undefined)
    expect(result.refinedByLlm).toBe(false)
    expect(result.keywords[0].phrase).toBe('python')
  })

  it('falls back to the pure result on a malformed LLM response', async () => {
    vi.spyOn(database, 'listApiModels').mockReturnValue([
      { id: 1, name: 'mock', enabled: true } as any
    ])
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
    const candidates = [
      { phrase: 'python', weight: 0.7, category: 'hard' as const, source: 'required' as const }
    ]
    const result = await refineJobKeywordsViaLlm(candidates, 'JD body', undefined)
    expect(result.refinedByLlm).toBe(false)
    expect(result.keywords[0].phrase).toBe('python')
  })
})
