// Renderer-side mirror of `electron/queueStats.ts` `computeQueueFunnel`.
//
// The renderer can't import from `electron/` cleanly because that
// directory contains `app` / `safeStorage` imports that the renderer
// process cannot load. Per the dual-mirror convention, we keep a
// thin copy here. The two implementations MUST stay in sync; the
// only allowed divergence is the location of the `Job` type (here it
// lives in `src/types.ts`).
//
// Pure function — no I/O — so any divergence is test-detectable.
import type { Job } from './types'

export interface QueueFunnelStats {
  added: number
  gradeA: number
  tailored: number
  submitted: number
  responded: number
}

// Funnel window. Matches the Match quality card's selector so the
// two widgets feel consistent.
export type FunnelWindow = 'week' | '30d' | '90d' | 'all'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export function computeQueueFunnel(jobs: Job[], now: number, window: FunnelWindow = 'week'): QueueFunnelStats {
  // Build the date cohort. For fixed windows, restrict to jobs
  // created within the last N days. For 'all', use the full list.
  const windowMs = window === 'all' ? null : window === 'week' ? WEEK_MS : window === '30d' ? 30 * DAY_MS : 90 * DAY_MS
  const recent = windowMs == null
    ? jobs.slice()
    : jobs.filter((j) => {
        const t = Date.parse(j.created_at)
        return Number.isFinite(t) && t >= now - windowMs
      })
  const sourced = recent.filter((j) => j.status === 'sourced')
  return {
    // "Added" = jobs added in the window that are still in the sourced
    // pile (haven't moved into ready/tailoring/applied yet).
    added: sourced.length,
    // "Grade ≥A" = sourced-window jobs with a Fit score of S or A.
    gradeA: sourced.filter((j) => j.match_grade === 'S' || j.match_grade === 'A').length,
    // "Tailored" = sourced-window jobs that have been tailored.
    // tailor_generated_at is set once and never cleared, so this is
    // stable as the job moves through the pipeline.
    tailored: sourced.filter((j) => j.tailor_generated_at != null).length,
    // "Applied" = window jobs that have reached the applied (or
    // follow_up) state, regardless of current status. We count by
    // status rather than submitted_at because submitted_at is only
    // stamped by the ApplyQueue flow.
    submitted: recent.filter((j) => j.status === 'applied' || j.status === 'follow_up').length,
    // "Responded" = window jobs where the employer responded.
    responded: recent.filter((j) => j.response_at != null).length,
  }
}
