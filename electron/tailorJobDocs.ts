import { tailorDocument } from './ai'
import {
  getJob,
  writeDocuments,
  writeTailorTimingFields,
  setJobStatus
} from './database'
import { log } from './logger'

export interface TailorJobDocsResult {
  cvId: number
  clId: number
  ms_cv: number
  ms_cl: number
}

export async function tailorJobDocsForJob(jobId: number): Promise<TailorJobDocsResult> {
  const job = getJob(jobId)
  if (!job) {
    log.tailor.warn('dropped_missing_job', { jobId })
    throw new Error(`Job ${jobId} not found`)
  }

  const [cv, cl] = await Promise.all([
    timed(() => tailorDocument({ job_id: jobId, document_type: 'cv' }), 'cv', jobId),
    timed(() => tailorDocument({ job_id: jobId, document_type: 'cover_letter' }), 'cl', jobId)
  ])

  const cvFailed = cv.result == null
  const clFailed = cl.result == null

  if (cvFailed || clFailed) {
    log.tailor.error(cvFailed ? 'cv_failed' : 'cl_failed', { jobId })
  }

  // Atomic: write whatever docs succeeded + the timing fields + status.
  // If both failed, write neither doc and only the error fields.
  const ids = cvFailed && clFailed
    ? { cvId: 0, clId: 0 }
    : await writeDocuments({
        jobId,
        cvContent: cv.result?.content ?? null,
        clContent: cl.result?.content ?? null
      })

  await writeTailorTimingFields({
    jobId,
    ms_cv: cv.ms,
    ms_cl: cl.ms,
    generatedAt: !cvFailed && !clFailed ? Date.now() : null,
    lastError: cvFailed
      ? (cv.error ?? 'cv_failed')
      : clFailed
        ? (cl.error ?? 'cl_failed')
        : null
  })

  if (!cvFailed && !clFailed) {
    await setJobStatus(jobId, 'ready')
  }

  return { cvId: ids.cvId, clId: ids.clId, ms_cv: cv.ms, ms_cl: cl.ms }
}

async function timed<T>(
  fn: () => Promise<T>,
  _kind: 'cv' | 'cl',
  _jobId: number
): Promise<{ result: T | null; ms: number; error?: string }> {
  const t0 = Date.now()
  try {
    const result = await fn()
    return { result, ms: Date.now() - t0 }
  } catch (err) {
    return {
      result: null,
      ms: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
