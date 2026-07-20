import { describe, it, expect } from 'vitest'
import { parseSections } from './keywordExtractor'

describe('parseSections', () => {
  it('returns the first non-empty line as title', () => {
    const jd = 'Senior Software Engineer\n\nWe are looking for a great engineer.\n'
    expect(parseSections(jd).title).toBe('Senior Software Engineer')
  })

  it('treats empty input as empty title and empty body', () => {
    const s = parseSections('')
    expect(s.title).toBe('')
    expect(s.required).toBe('')
    expect(s.preferred).toBe('')
    expect(s.body).toBe('')
  })

  it('buckets lines under a "Requirements" header into required', () => {
    const jd = [
      'Staff Backend Engineer',
      '',
      'Requirements',
      '- 5+ years Python',
      '- AWS experience',
      '',
      'About the role',
      'You will work on...'
    ].join('\n')
    const s = parseSections(jd)
    expect(s.required).toMatch(/5\+ years python/)
    expect(s.required).toMatch(/aws experience/)
    expect(s.body).toMatch(/you will work on/i)
    expect(s.required).not.toMatch(/about the role/i)
  })

  it('buckets lines under a "Nice to have" header into preferred', () => {
    const jd = [
      'Senior Engineer',
      '',
      'Nice to have',
      '- Kubernetes',
      '- GraphQL',
      '',
      'About',
      'A small team'
    ].join('\n')
    const s = parseSections(jd)
    expect(s.preferred).toMatch(/kubernetes/)
    expect(s.preferred).toMatch(/graphql/)
    expect(s.body).toMatch(/a small team/i)
  })

  it('treats the whole description as body when no headers are present', () => {
    const jd = 'Just a wall of text.\nWith no headers.\nAbout the role and the company.'
    const s = parseSections(jd)
    expect(s.title).toBe('Just a wall of text.')
    expect(s.required).toBe('')
    expect(s.preferred).toBe('')
    expect(s.body).toMatch(/with no headers/i)
  })

  it('handles interleaved required/preferred sections', () => {
    const jd = [
      'Title',
      '',
      'Requirements',
      '- python',
      '',
      'Nice to have',
      '- rust',
      '',
      'Requirements',
      '- postgres'
    ].join('\n')
    const s = parseSections(jd)
    expect(s.required).toMatch(/python/)
    expect(s.required).toMatch(/postgres/)
    expect(s.preferred).toMatch(/rust/)
  })

  it('matches a wide set of header spellings case-insensitively', () => {
    const jd = [
      'Job Title',
      '',
      'MINIMUM QUALIFICATIONS',
      '- go',
      '',
      'WHAT YOU\'LL NEED',
      '- rust',
      '',
      'DESIRED',
      '- haskell'
    ].join('\n')
    const s = parseSections(jd)
    expect(s.required).toMatch(/go/)
    expect(s.required).toMatch(/rust/)
    expect(s.preferred).toMatch(/haskell/)
  })
})
