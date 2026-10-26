export interface Coords { latitude: number; longitude: number }
export const DISTANCE_LABEL = 'Approx. straight-line distance';
const R_MILES = 3958.8;
const rad = (d: number) => (d * Math.PI) / 180;

/** Haversine great-circle distance in miles. Not driving, walking or travel distance. */
export function haversineMiles(a: Coords, b: Coords): number {
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}
export const formatMiles = (m: number) => `${m < 10 ? m.toFixed(1) : Math.round(m)} mi`;
