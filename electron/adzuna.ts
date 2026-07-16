// Adzuna first-party job-board API.
// Docs: https://developer.adzuna.com/docs/search
// Auth: app_id + app_key from https://developer.adzuna.com/ (free tier ~250 calls/mo).
// Returns structured job records that map directly to CreateJobInput —
// no HTML scraping, no Cloudflare, no challenge pages.
//
// Used by the Adzuna board entry in BOARDS. The board is skipped if
// either key is empty (the user hasn't configured Adzuna yet).

import { getSettings } from './database'
import type { CreateJobInput } from './types'

interface AdzunaResult {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string; area?: string[] }
  created: string
  description: string
  salary_min?: number
  salary_max?: number
  redirect_url: string
  category?: { label: string }
  contract_type?: string
  contract_time?: string
}

interface AdzunaResponse {
  count: number
  results: AdzunaResult[]
}

// `country` is the Adzuna country code — 'ca', 'us', 'gb', etc.
// `location` is the user's preferred location string from settings
// (e.g. "Vancouver", "London"). `keywords` is the user's scan keywords.
// Returns a list of CreateJobInput ready for `createJob`.
export async function fetchAdzunaJobs(
  country: string,
  keywords: string,
  location: string,
  signal?: AbortSignal
): Promise<CreateJobInput[]> {
  const settings = getSettings()
  const appId = settings.adzuna_app_id?.trim()
  const appKey = settings.adzuna_app_key?.trim()
  if (!appId || !appKey) return []

  const results: CreateJobInput[] = []
  // Adzuna returns up to 50 per page. Walk pages until either we run
  // out of results or the user's keyword query is fully represented.
  // Cap at 5 pages (250 results) to stay within the free tier's daily
  // budget. Most queries don't need more.
  const MAX_PAGES = 5
  const PER_PAGE = 50
  for (let page = 1; page <= MAX_PAGES; page++) {
    if (signal?.aborted) break
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: String(PER_PAGE),
      'what': keywords,
      'what_or': keywords,
      'what_phrase': '',
      'where': location,
      'max_days_old': '30'
    })
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'flow_job/1.0' },
      signal
    })
    if (!response.ok) break
    const payload = (await response.json()) as AdzunaResponse
    if (!payload.results || payload.results.length === 0) break
    for (const r of payload.results) {
      const title = (r.title || '').replace(/&nbsp;/g, ' ').trim()
      const company = r.company?.display_name?.trim() || ''
      const desc = (r.description || '').replace(/&nbsp;/g, ' ').trim()
      if (!title || !company || !desc) continue
      const loc = r.location?.display_name?.trim() || ''
      const salaryMin = r.salary_min
      const salaryMax = r.salary_max
      const salary =
        salaryMin && salaryMax
          ? `${Math.round(salaryMin)}–${Math.round(salaryMax)}`
          : salaryMin
            ? String(Math.round(salaryMin))
            : salaryMax
              ? String(Math.round(salaryMax))
              : undefined
      results.push({
        title,
        company,
        location: loc || null,
        url: r.redirect_url,
        description: desc,
        salary_range: salary ?? null,
        source: 'adzuna',
        requirements: null,
        application_requirements: null,
        hiring_manager: null,
        employment_type: null,
        work_mode: null,
        notes: null
      })
    }
    if (payload.results.length < PER_PAGE) break
  }
  return results
}
