import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tailorJobDocsForJob } from './tailorJobDocs'

// Mock the LLM and store so the test is hermetic.
vi.mock('./ai', () => ({
  tailorDocument: vi.fn(async (req: { document_type: 'cv' | 'cover_letter' }) => ({
    content: `mocked ${req.document_type} content`,
    model_used: 'mock',
  })),
}))
vi.mock('./database', () => ({
  getJob: vi.fn((id: number) => ({ id, title: 't', company: 'c', description: 'd', score: 0.8 })),
  // Use a real in-memory store stub; the implementer can swap to the real one
  // if the test env supports it. The contract is: writeDocuments returns ids,
  // writeTailorTimingFields is idempotent.
  writeDocuments: vi.fn(async () => ({ cvId: 10, clId: 11 })),
  writeTailorTimingFields: vi.fn(async () => {}),
  setJobStatus: vi.fn(async () => {}),
}))
vi.mock('./logger', () => ({
  log: { tailor: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('tailorJobDocsForJob', () => {
  it('returns both ids and timing', async () => {
    const result = await tailorJobDocsForJob(1)
    expect(result.cvId).toBe(10)
    expect(result.clId).toBe(11)
    expect(result.ms_cv).toBeGreaterThanOrEqual(0)
    expect(result.ms_cl).toBeGreaterThanOrEqual(0)
  })
})
