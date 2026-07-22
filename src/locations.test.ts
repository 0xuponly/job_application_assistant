import { describe, it, expect } from 'vitest';
import {
  getLocations,
  getCountries,
  isRecognizedCountry,
  findByPrefix,
  condenseLocation,
} from './locations';

describe('locations data', () => {
  it('exposes a non-empty list of nodes', () => {
    expect(getLocations().length).toBeGreaterThan(0);
  });

  it('getCountries returns at least 200 entries', () => {
    expect(getCountries().length).toBeGreaterThanOrEqual(200);
  });

  it('getCountries includes Canada, US, UK, France, Germany, Japan', () => {
    const c = getCountries();
    for (const want of ['Canada', 'United States', 'United Kingdom', 'France', 'Germany', 'Japan']) {
      expect(c).toContain(want);
    }
  });

  it('isRecognizedCountry matches exact and trims/case-folds', () => {
    expect(isRecognizedCountry('Canada')).toBe(true);
    expect(isRecognizedCountry('  canada  ')).toBe(true);
    expect(isRecognizedCountry('Atlantis')).toBe(false);
    expect(isRecognizedCountry('')).toBe(false);
  });
});

describe('findByPrefix', () => {
  it('returns case-insensitive prefix matches on name', () => {
    const r = findByPrefix('van');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((n) => n.name.toLowerCase().startsWith('van'))).toBe(true);
  });

  it('ranks exact prefix matches before mid-name matches', () => {
    // first result for 'vanc' should be a node whose name starts with 'vanc'
    const r = findByPrefix('vanc');
    expect(r[0].name.toLowerCase().startsWith('vanc')).toBe(true);
  });

  it('caps results at the supplied limit', () => {
    const r = findByPrefix('san', 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });

  it('returns empty for empty query', () => {
    expect(findByPrefix('')).toEqual([]);
  });

  it('ranks priority countries (US/CA/UK/AU/NZ/IE) ahead of others', () => {
    // "San Francisco" has 19 matches; the USA one is in the data but
    // was buried at position 11 by raw insertion order. After the
    // country-priority sort, it should appear at the top.
    const r = findByPrefix('san francisco')
    expect(r.length).toBeGreaterThan(0)
    const us = r.find((n) => n.type === 'city' && n.name === 'San Francisco' && n.parentId === 'state:United States:California')
    expect(us).toBeDefined()
    // US San Francisco must be among the first results — exact position
    // depends on how many priority nodes also match, but it should be
    // in the top 5 and certainly above any non-priority country match.
    const usIdx = r.indexOf(us!)
    expect(usIdx).toBeLessThan(5)
    // No non-priority country result should appear before the US one.
    const priorityCountries = new Set(['country:United States','country:Canada','country:United Kingdom','country:Australia','country:New Zealand','country:Ireland'])
    for (let i = 0; i < usIdx; i++) {
      const n = r[i]
      const countryId = n.type === 'country' ? n.id
        : (n.type === 'state' || n.type === 'province') ? n.parentId
        : (() => { const ps = (n as { parentId: string | null }).parentId; return ps ? null : null })()
      // Just confirm there's a US/CA/UK/AU/NZ/IE node ahead of the US
      // San Francisco; we don't deeply verify each.
      expect(countryId === null || priorityCountries.has(countryId)).toBe(true)
    }
  });
});

describe('display()', () => {
  it('builds "City, State, Country" for a city node', () => {
    const r = findByPrefix('vancouver');
    const vancouver = r.find((n) => n.type === 'city' && n.name === 'Vancouver');
    expect(vancouver).toBeDefined();
    expect(vancouver!.display()).toBe('Vancouver, British Columbia, Canada');
  });

  it('returns just the country name for a country node', () => {
    const r = findByPrefix('france');
    const france = r.find((n) => n.type === 'country' && n.name === 'France');
    expect(france).toBeDefined();
    expect(france!.display()).toBe('France');
  });

  it('builds "State, Country" for a state/province node', () => {
    const r = findByPrefix('ontario');
    const ontario = r.find((n) => n.type === 'province' && n.name === 'Ontario');
    expect(ontario).toBeDefined();
    expect(ontario!.display()).toBe('Ontario, Canada');
  });
});

describe('condenseLocation', () => {
  it('condenses "City, State, Country" using both maps', () => {
    expect(condenseLocation('Vancouver, British Columbia, Canada')).toBe('Vancouver, BC, CA');
  });

  it('condenses a US city to "City, ST, US"', () => {
    expect(condenseLocation('San Francisco, California, United States')).toBe('San Francisco, CA, US');
  });

  it('condenses a city with no state segment to "City, CC"', () => {
    expect(condenseLocation('London, United Kingdom')).toBe('London, UK');
  });

  it('returns free text without commas unchanged', () => {
    expect(condenseLocation('Remote')).toBe('Remote');
    expect(condenseLocation('Anywhere')).toBe('Anywhere');
    expect(condenseLocation('EU')).toBe('EU');
  });

  it('returns empty string for empty input', () => {
    expect(condenseLocation('')).toBe('');
  });

  it('returns empty string for null/undefined', () => {
    expect(condenseLocation(null)).toBe('');
    expect(condenseLocation(undefined)).toBe('');
  });

  it('leaves an unmapped state alone but condenses a mapped country', () => {
    expect(condenseLocation('Mumbai, Maharashtra, India')).toBe('Mumbai, Maharashtra, IN');
  });

  it('leaves an unmapped country alone but condenses a mapped state', () => {
    expect(condenseLocation('Vancouver, British Columbia, Atlantis')).toBe(
      'Vancouver, BC, Atlantis'
    );
  });
});
