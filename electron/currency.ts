/**
 * Country (ISO 3166-1 alpha-2) → currency (ISO 4217) lookup.
 *
 * Mirrors the writer's `COUNTRIES` map in electron/utils.ts: every
 * country that the location normalizer can write to the store has a
 * currency entry here. The decider in src/pages/JobsPage.tsx reads
 * its dual-mirror in src/currency.ts.
 *
 * Currencies follow ISO 4217 alphabetic codes. Where a country
 * officially uses a non-USD dollar or a non-EUR euro, we use the
 * local code (CAD, AUD, CHF, etc.) — the goal is correct labeling,
 * not regional preferences.
 *
 * `IL` (Israel) is intentionally absent. The "no Israel in geo
 * datasets" convention removes Israel from the country map at the
 * writer; the corresponding currency entry is not added here.
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Americas
  US: 'USD',
  CA: 'CAD',
  BR: 'BRL',
  MX: 'MXN',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  // Europe — Eurozone
  DE: 'EUR', FR: 'EUR', NL: 'EUR', ES: 'EUR', IT: 'EUR', IE: 'EUR',
  PT: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR',
  // Europe — non-Eurozone
  GB: 'GBP',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
  // Asia
  IN: 'INR', CN: 'CNY', JP: 'JPY', KR: 'KRW',
  SG: 'SGD', HK: 'HKD', TW: 'TWD',
  // Middle East / Africa
  AE: 'AED', ZA: 'ZAR', NG: 'NGN', EG: 'EGP', KE: 'KES',
  // Eastern Europe / Caucasus
  TR: 'TRY', RU: 'RUB', UA: 'UAH',
  // Oceania
  AU: 'AUD', NZ: 'NZD',
}

/**
 * Long English country name → ISO 3166-1 alpha-2 code. Mirrors the
 * keys of the writer's `COUNTRIES` map in electron/utils.ts (kept
 * in lockstep with the renderer-side mirror in src/currency.ts).
 * Used by the renderer's currency decider at display time to
 * recover a 2-letter code from stored locations that are a bare
 * full country name. The stored value is left as the user typed it;
 * the Location column shows "Canada" / "United States" verbatim.
 */
export const LONG_NAME_TO_COUNTRY: Record<string, string> = {
  // Americas
  'United States': 'US',
  'United States of America': 'US',
  USA: 'US',
  US: 'US',
  America: 'US',
  Canada: 'CA',
  Brazil: 'BR',
  Mexico: 'MX',
  Argentina: 'AR',
  Chile: 'CL',
  Colombia: 'CO',
  // Europe — Eurozone
  Germany: 'DE', France: 'FR', Netherlands: 'NL', Spain: 'ES',
  Italy: 'IT', Ireland: 'IE', Portugal: 'PT', Belgium: 'BE',
  Austria: 'AT', Finland: 'FI', Greece: 'GR',
  // Europe — non-Eurozone
  'United Kingdom': 'GB',
  UK: 'GB',
  'Great Britain': 'GB',
  England: 'GB',
  Scotland: 'GB',
  Wales: 'GB',
  'Northern Ireland': 'GB',
  Sweden: 'SE', Norway: 'NO', Denmark: 'DK', Switzerland: 'CH',
  Poland: 'PL', 'Czech Republic': 'CZ', Czechia: 'CZ',
  Hungary: 'HU', Romania: 'RO',
  // Asia
  India: 'IN', China: 'CN', Japan: 'JP',
  'South Korea': 'KR', Korea: 'KR',
  Singapore: 'SG', 'Hong Kong': 'HK', Taiwan: 'TW',
  // Middle East / Africa
  'United Arab Emirates': 'AE', UAE: 'AE',
  'South Africa': 'ZA', Nigeria: 'NG', Egypt: 'EG', Kenya: 'KE',
  // Eastern Europe / Caucasus
  Turkey: 'TR', Russia: 'RU', Ukraine: 'UA',
  // Oceania
  Australia: 'AU', 'New Zealand': 'NZ',
}
