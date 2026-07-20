import { describe, it, expect } from 'vitest'
import { formatLocation } from './utils'

describe('formatLocation — country-last contract', () => {
  it('1-part input with defaultCountry produces City, CC', () => {
    expect(formatLocation('Vancouver', 'Canada')).toBe('Vancouver, CA')
  })

  it('1-part input without defaultCountry returns null', () => {
    expect(formatLocation('Vancouver', '')).toBeNull()
  })

  it('2-part input where second token is a known 2-letter country code produces City, CC', () => {
    expect(formatLocation('Vancouver, CA', 'US')).toBe('Vancouver, CA')
  })

  it('2-part input where second token is an unknown 2-letter code falls back to defaultCountry', () => {
    expect(formatLocation('Vancouver, MH', 'US')).toBe('Vancouver, US')
  })

  it('2-part input with unknown full-name second token falls back to defaultCountry', () => {
    expect(formatLocation('Vancouver, Atlantis', 'US')).toBe('Vancouver, US')
  })

  it('2-part input with unknown full-name and no defaultCountry returns null', () => {
    expect(formatLocation('Vancouver, Atlantis', '')).toBeNull()
  })

  it('2-part input where second token is a region produces City, REGION (no defaultCountry append)', () => {
    expect(formatLocation('Vancouver, BC', 'US')).toBe('Vancouver, BC')
  })

  it('2-part input where second token is a full country name produces City, CC', () => {
    expect(formatLocation('London, United Kingdom', 'US')).toBe('London, GB')
  })

  it('3-part input with known region and country produces City, REGION, CC', () => {
    expect(formatLocation('Vancouver, BC, Canada', 'US')).toBe('Vancouver, BC, CA')
  })

  it('3-part input with unknown region and known country produces City, CC', () => {
    expect(formatLocation('Sydney, NSW, Australia', 'US')).toBe('Sydney, AU')
  })

  it('3-part input with known region and unknown country falls back to defaultCountry', () => {
    expect(formatLocation('Paris, Île-de-France, Atlantis', 'FR')).toBe('Paris, Île-de-France, FR')
  })

  it('3-part input with neither region nor country and no defaultCountry returns null', () => {
    expect(formatLocation('Foo, Bar, Baz', '')).toBeNull()
  })

  it('Remote token is preserved verbatim', () => {
    expect(formatLocation('Remote', 'US')).toBe('Remote')
  })

  it('Remote token with country suffix is collapsed to just the token', () => {
    expect(formatLocation('Remote, CA, US', 'US')).toBe('Remote')
  })

  it('null input returns null', () => {
    expect(formatLocation(null, 'US')).toBeNull()
  })

  it('empty input returns null', () => {
    expect(formatLocation('', 'US')).toBeNull()
  })

  it('multi-location joined by semicolon normalizes each piece', () => {
    expect(formatLocation('Vancouver, BC; Toronto, ON', 'US')).toBe('Vancouver, BC; Toronto, ON')
  })
})
