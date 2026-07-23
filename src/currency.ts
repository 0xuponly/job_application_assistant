/**
 * Dual-mirror of electron/currency.ts. The renderer cannot import
 * from electron/, so the table is duplicated here. The two files must
 * stay in lockstep; if you add or change an entry on one side, mirror
 * it on the other in the same commit.
 *
 * See electron/currency.ts for the rationale on which countries are
 * included and why Israel is excluded.
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
 * Long English country name → ISO 3166-1 alpha-2 code. Mirrors the keys
 * of the writer's `COUNTRIES` map in electron/utils.ts. Used by the
 * renderer's currency decider to recover a 2-letter code from stored
 * locations that are just a country name ("Canada", "United States")
 * — the writer's 1-part branch returns null for these (no city to
 * anchor to, no defaultCountry), so they survive in the store as a
 * bare long name. The Location column shows them as the user typed
 * them; this lookup runs at display time so the Salary column picks
 * CAD / USD / GBP / etc. correctly without rewriting the stored
 * value.
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
