import type { Job } from './types'

export interface QueueFunnelStats {
  added: number
  gradeA: number
  tailored: number
  submitted: number
  responded: number
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function computeQueueFunnel(jobs: Job[], now: number): QueueFunnelStats {
  const cutoff = now - WEEK_MS
  const recent = jobs.filter((j) => {
    const t = Date.parse(j.created_at)
    return Number.isFinite(t) && t >= cutoff
  })
  return {
    added: recent.length,
    gradeA: recent.filter((j) => j.match_grade === 'A').length,
    tailored: recent.filter((j) => j.tailor_generated_at != null).length,
    submitted: recent.filter((j) => j.submitted_at != null).length,
    responded: recent.filter((j) => j.response_at != null).length,
  }
}
