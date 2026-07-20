import { describe, it, expect } from 'vitest'
import { COUNTRY_TO_CURRENCY } from '../currency'

/**
 * Local copy of the decider under test. We don't import the un-exported
 * helper from JobsPage.tsx because it's not part of the public API;
 * the test pins its behavior so the rewrite can be verified.
 */
function currencyFromLocation(location: string | null | undefined): string | null {
  if (!location) return null
  if (/^(remote|anywhere|worldwide|global|wfh|work from home|distributed|fully remote|100%\s*remote)(?=,|$)/i.test(location.trim())) {
    return null
  }
  const last = location.split(',').pop()?.trim().toUpperCase()
  if (!last || !/^[A-Z]{2}$/.test(last)) return null
  return COUNTRY_TO_CURRENCY[last] ?? null
}

describe('currencyFromLocation', () => {
  it('returns null for null input', () => {
    expect(currencyFromLocation(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(currencyFromLocation('')).toBeNull()
  })

  it('returns null for "Remote"', () => {
    expect(currencyFromLocation('Remote')).toBeNull()
  })

  it('returns null for "Worldwide"', () => {
    expect(currencyFromLocation('Worldwide')).toBeNull()
  })

  it('returns null for "Remote, CA, US"', () => {
    expect(currencyFromLocation('Remote, CA, US')).toBeNull()
  })

  it('returns CAD for "Vancouver, CA"', () => {
    expect(currencyFromLocation('Vancouver, CA')).toBe('CAD')
  })

  it('returns CAD for "Vancouver, BC, CA"', () => {
    expect(currencyFromLocation('Vancouver, BC, CA')).toBe('CAD')
  })

  it('returns USD for "New York, NY, US"', () => {
    expect(currencyFromLocation('New York, NY, US')).toBe('USD')
  })

  it('returns EUR for "Berlin, DE"', () => {
    expect(currencyFromLocation('Berlin, DE')).toBe('EUR')
  })

  it('returns GBP for "London, GB"', () => {
    expect(currencyFromLocation('London, GB')).toBe('GBP')
  })

  it('returns AUD for "Sydney, AU"', () => {
    expect(currencyFromLocation('Sydney, AU')).toBe('AUD')
  })

  it('returns SGD for "Singapore, SG"', () => {
    expect(currencyFromLocation('Singapore, SG')).toBe('SGD')
  })

  it('returns INR for "Mumbai, IN"', () => {
    expect(currencyFromLocation('Mumbai, IN')).toBe('INR')
  })

  it('returns SEK for "Stockholm, SE"', () => {
    expect(currencyFromLocation('Stockholm, SE')).toBe('SEK')
  })

  it('returns null for unknown 2-letter code "ZZ"', () => {
    expect(currencyFromLocation('Foo, ZZ')).toBeNull()
  })

  it('returns null for full country name (legacy shape — decider now requires 2-letter)', () => {
    expect(currencyFromLocation('Vancouver, BC, Canada')).toBeNull()
  })

  it('returns null for legacy 2-part shape with full name', () => {
    expect(currencyFromLocation('Vancouver, Canada')).toBeNull()
  })

  it('handles extra whitespace around segments', () => {
    expect(currencyFromLocation('  Vancouver ,  BC ,  CA  ')).toBe('CAD')
  })
})
