// Privacy-safe debug helpers used by callAI when FLOW_JOB_DEBUG_AI=1.
//
// Three rules, in order of importance:
//   1. Never log the full API key. fingerprintKey shows only first 6 + last 4.
//   2. Never log the full request body. redactBody returns a fixed marker.
//   3. Never log more of the URL than is needed. hostOf drops path/query/port.
//
// All three helpers are pure and side-effect free so they can be unit-tested
// in isolation. Nothing in this file should ever call out to network, disk,
// or env reads.

export function fingerprintKey(key: string): string {
  if (!key) return '<none>'
  // A fingerprint of first 6 + last 4 exposes 10 chars; refuse to fingerprint
  // anything ≤12 chars because the result would be longer than the key.
  if (key.length <= 12) return '<short>'
  return `${key.slice(0, 6)}…${key.slice(-4)}`
}

export function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host.replace(/:\d+$/, '')
  } catch {
    return '<invalid-url>'
  }
}

export function redactBody(_body: string): string {
  // The body can include the candidate's CV, system prompt with private
  // instructions, or arbitrary JSON. Always return a fixed marker.
  return '<redacted>'
}
