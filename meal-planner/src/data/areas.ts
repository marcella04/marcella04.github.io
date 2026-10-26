import type { DemoArea } from '../types';
export const demoAreas: DemoArea[] = [
  { id: 'central', name: 'Central Demo Area', latitude: 40.0, longitude: -100.0, description: 'Abstract demonstration area. Not a real place.' },
  { id: 'north', name: 'North Demo Area', latitude: 40.06, longitude: -100.0, description: 'Abstract demonstration area. Not a real place.' },
  { id: 'south', name: 'South Demo Area', latitude: 39.94, longitude: -100.0, description: 'Abstract demonstration area. Not a real place.' },
];
/** Only these demonstration ZIP codes are supported in V1. No real ZIP geocoding is performed. */
export const zipLookup: Record<string, string> = { '00001': 'central', '00002': 'north', '00003': 'south' };
export const UNSUPPORTED_ZIP_MESSAGE = 'This ZIP code is not included in the Version 1 offline dataset. Select a demo area or use your browser location instead.';
