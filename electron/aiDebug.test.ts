import { describe, it, expect } from 'vitest'
import { fingerprintKey, hostOf, redactBody } from './aiDebug'

describe('fingerprintKey', () => {
  it('returns the first 6 and last 4 characters with an ellipsis for typical API keys', () => {
    // Realistic OpenRouter key shape: "sk-or-v1-abc123…xyz9" (51 chars).
    const key = 'sk-or-v1-abcdef1234567890XYZ9'
    expect(fingerprintKey(key)).toBe('sk-or-…XYZ9')
  })

  it('returns "<short>" for keys too short to safely fingerprint', () => {
    // Anything ≤12 chars could be reconstructed from first 6 + last 4,
    // so refuse to fingerprint. A 12-char key would expose 10 of its 12.
    expect(fingerprintKey('short')).toBe('<short>')
    expect(fingerprintKey('123456789012')).toBe('<short>') // exactly 12
  })

  it('returns "<none>" for empty input', () => {
    expect(fingerprintKey('')).toBe('<none>')
  })

  it('never returns more than first 6 + ellipsis + last 4 of the input', () => {
    const key = 'a'.repeat(200)
    const fp = fingerprintKey(key)
    expect(fp.length).toBeLessThanOrEqual(6 + 1 + 4) // "aaaaaa…aaaa"
  })
})

describe('hostOf', () => {
  it('returns the host of a normal https URL', () => {
    expect(hostOf('https://openrouter.ai/api/v1')).toBe('openrouter.ai')
  })

  it('drops the port for an api host with a custom port', () => {
    expect(hostOf('https://api.deepseek.com:8443/v1')).toBe('api.deepseek.com')
  })

  it('returns "<invalid-url>" for a string that is not a URL', () => {
    expect(hostOf('not a url')).toBe('<invalid-url>')
    expect(hostOf('')).toBe('<invalid-url>')
  })
})

describe('redactBody', () => {
  it('returns a fixed marker regardless of body content', () => {
    expect(redactBody('system prompt with CV content')).toBe('<redacted>')
    expect(redactBody('{"choices":[…]}')).toBe('<redacted>')
    expect(redactBody('')).toBe('<redacted>')
  })
})
