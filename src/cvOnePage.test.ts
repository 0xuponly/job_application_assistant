import { describe, it, expect, vi } from 'vitest'
import { enforceOnePageCeilings, enforceLeadershipOneLine } from './cvOnePage'

describe('enforceOnePageCeilings', () => {
  it('caps Experience entries to 4, keeping the first 4', () => {
    const exp = (n: number) => `Role ${n}\tCity, ST\nTitle ${n}\tJan 2024 – Present\n- Did thing ${n}\n- Did other thing ${n}\n- Did another ${n}\n- Did final ${n}\n`
    const md = `Name\nemail@example.com\n\nEXPERIENCE\n${exp(1)}${exp(2)}${exp(3)}${exp(4)}${exp(5)}${exp(6)}${exp(7)}\n`
    const out = enforceOnePageCeilings(md)
    // Roles 1-4 kept
    expect(out).toMatch(/Role 1\b/)
    expect(out).toMatch(/Role 4\b/)
    // Roles 5-7 dropped
    expect(out).not.toMatch(/Role 5\b/)
    expect(out).not.toMatch(/Role 6\b/)
    expect(out).not.toMatch(/Role 7\b/)
  })

  it('caps bullets per Experience entry to 4', () => {
    const md = `Name\nemail\n\nEXPERIENCE\nRole A\tCity\nTitle\tJan 2024 – Present\n- b1\n- b2\n- b3\n- b4\n- b5\n- b6\n\nEDUCATION\nSchool\n`
    const out = enforceOnePageCeilings(md)
    expect(out).toMatch(/- b1/)
    expect(out).toMatch(/- b4/)
    expect(out).not.toMatch(/- b5/)
    expect(out).not.toMatch(/- b6/)
  })

  it('caps Leadership & Activities to 3 one-line entries', () => {
    const md = 'Name\nemail\n\nLEADERSHIP & ACTIVITIES\n' +
      '**Org 1**, City\t2024\n' +
      '**Org 2**, City\t2023\n' +
      '**Org 3**, City\t2022\n' +
      '**Org 4**, City\t2021\n'
    const out = enforceOnePageCeilings(md)
    expect(out).toMatch(/\*\*Org 1\*\*/)
    expect(out).toMatch(/\*\*Org 2\*\*/)
    expect(out).toMatch(/\*\*Org 3\*\*/)
    expect(out).not.toMatch(/\*\*Org 4\*\*/)
  })

  it('caps Skills & Interests lines to 6', () => {
    const md = `Name\nemail\n\nSKILLS & INTERESTS\nTechnical: a, b, c\nLanguage: x, y, z\nLaboratory: p, q, r\nInterests: foo, bar, baz\nExtra: 1, 2, 3\nAnother: 4, 5, 6\nYet: 7, 8, 9\nFinal: 10, 11, 12\n`
    const out = enforceOnePageCeilings(md)
    expect(out).toMatch(/Technical: a, b, c/)
    expect(out).toMatch(/Another: 4, 5, 6/)
    expect(out).not.toMatch(/Yet: 7/)
    expect(out).not.toMatch(/Final: 10/)
  })

  it('truncates Education to at most 4 lines', () => {
    const md = `Name\nemail\n\nEDUCATION\nSchool 1\nDegree 1\nSchool 2\nDegree 2\n`
    const out = enforceOnePageCeilings(md)
    expect(out).toMatch(/School 1/)
    expect(out).toMatch(/Degree 1/)
    expect(out).toMatch(/School 2/)
    expect(out).toMatch(/Degree 2/)
  })

  it('drops Education content beyond the 4-line cap', () => {
    const md = `Name\nemail\n\nEDUCATION\nSchool 1\nDegree 1\nSchool 2\nDegree 2\nSchool 3\nDegree 3\n`
    const out = enforceOnePageCeilings(md)
    expect(out).toMatch(/School 1/)
    expect(out).toMatch(/Degree 2/)
    expect(out).not.toMatch(/School 3/)
    expect(out).not.toMatch(/Degree 3/)
  })

  it('leaves content under all ceilings unchanged', () => {
    const md = `Name\nemail@example.com\n\nEXPERIENCE\nRole A\tCity\nTitle\tJan 2024 – Present\n- bullet\n\nEDUCATION\nSchool A\n`
    const out = enforceOnePageCeilings(md)
    expect(out).toBe(md)
  })

  it('emits a console-style log when culling occurs', () => {
    const log = vi.fn()
    const md = `Name\nemail\n\nEXPERIENCE\n${[1,2,3,4,5,6,7].map(n => `Role ${n}\tCity\nTitle ${n}\tJan 2024 – Present\n- bullet\n`).join('')}\n`
    enforceOnePageCeilings(md, { log })
    expect(log).toHaveBeenCalled()
    expect(log.mock.calls[0][0]).toMatch(/experience/)
    expect(log.mock.calls[0][0]).toMatch(/7/)
    expect(log.mock.calls[0][0]).toMatch(/4/)
  })

  it('does not log when nothing is culled', () => {
    const log = vi.fn()
    const md = `Name\nemail\n\nEDUCATION\nSchool\n`
    enforceOnePageCeilings(md, { log })
    expect(log).not.toHaveBeenCalled()
  })
})

describe('enforceLeadershipOneLine', () => {
  it('keeps a one-line entry unchanged', () => {
    const md = 'LEADERSHIP & ACTIVITIES\n**President**, UBC Coding Club\t2023 – 2024\n'
    expect(enforceLeadershipOneLine(md)).toBe(md)
  })

  it('drops a sub-bullet that follows a one-line entry', () => {
    const md =
      'LEADERSHIP & ACTIVITIES\n' +
      '**President**, UBC Coding Club\t2023 – 2024\n' +
      '- Organized weekly hackathons\n' +
      '- Mentored 12 first-years\n'
    const out = enforceLeadershipOneLine(md)
    // Output is multi-line (header + title), so use toContain rather
    // than ^...$ which can only match a single-line string.
    expect(out).toContain('**President**, UBC Coding Club\t2023 – 2024')
    expect(out).not.toMatch(/hackathons/)
    expect(out).not.toMatch(/Mentored/)
  })

  it('drops a wrapped continuation line (not a bullet) after the title', () => {
    const md =
      'LEADERSHIP & ACTIVITIES\n' +
      '**President**, UBC Coding Club\t2023 – 2024\n' +
      'A continuation of the description that wrapped.\n'
    const out = enforceLeadershipOneLine(md)
    expect(out).not.toMatch(/continuation/)
  })

  it('caps at 3 entries by default', () => {
    const md =
      'LEADERSHIP & ACTIVITIES\n' +
      '**A**, Org A\t2024\n' +
      '**B**, Org B\t2023\n' +
      '**C**, Org C\t2022\n' +
      '**D**, Org D\t2021\n'
    const out = enforceLeadershipOneLine(md)
    expect(out).toMatch(/Org A/)
    expect(out).toMatch(/Org C/)
    expect(out).not.toMatch(/Org D/)
  })

  it('respects a custom max', () => {
    const md =
      'LEADERSHIP & ACTIVITIES\n' +
      '**A**, Org A\t2024\n' +
      '**B**, Org B\t2023\n' +
      '**C**, Org C\t2022\n'
    const out = enforceLeadershipOneLine(md, { max: 2 })
    expect(out).toMatch(/Org A/)
    expect(out).toMatch(/Org B/)
    expect(out).not.toMatch(/Org C/)
  })

  it('returns text unchanged when there is no Leadership section', () => {
    const md = 'Name\nemail\n\nEXPERIENCE\nRole A\n- bullet\n'
    expect(enforceLeadershipOneLine(md)).toBe(md)
  })

  it('preserves sections before and after Leadership', () => {
    const md =
      'Name\nemail\n\nEXPERIENCE\nRole A\n- bullet\n\n' +
      'LEADERSHIP & ACTIVITIES\n' +
      '**President**, UBC Coding Club\t2023 – 2024\n' +
      '- dropped\n\n' +
      'EDUCATION\nSchool\n'
    const out = enforceLeadershipOneLine(md)
    expect(out).toMatch(/EXPERIENCE/)
    expect(out).toMatch(/EDUCATION/)
    expect(out).toMatch(/UBC Coding Club/)
    expect(out).not.toMatch(/dropped/)
  })

  it('emits a log when continuation lines or over-cap entries are dropped', () => {
    const log = vi.fn()
    const md =
      'LEADERSHIP & ACTIVITIES\n' +
      '**A**, Org A\t2024\n- dropped\n' +
      '**B**, Org B\t2023\n' +
      '**C**, Org C\t2022\n' +
      '**D**, Org D\t2021\n'
    enforceLeadershipOneLine(md, { log })
    expect(log).toHaveBeenCalled()
    expect(log.mock.calls[0][0]).toMatch(/leadership/)
  })

  it('does not log when nothing is dropped', () => {
    const log = vi.fn()
    const md =
      'LEADERSHIP & ACTIVITIES\n' +
      '**A**, Org A\t2024\n' +
      '**B**, Org B\t2023\n'
    enforceLeadershipOneLine(md, { log })
    expect(log).not.toHaveBeenCalled()
  })
})
