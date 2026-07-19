import { getCountries, isRecognizedCountry } from './locations';

export const COUNTRIES: string[] = getCountries();
export { isRecognizedCountry };
