import type { Ingredient, Unit } from '../types';

export const WEIGHT_G: Partial<Record<Unit, number>> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
export const VOLUME_ML: Partial<Record<Unit, number>> = { ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588 };
export type Dimension = 'weight' | 'volume' | 'discrete';
export type ConversionData = Pick<Ingredient, 'density' | 'unitWeights'>;
export type ConversionError = { code: 'incompatible' | 'missing-density' | 'missing-unit-weight'; message: string };
export type ConversionResult = { ok: true; value: number } | { ok: false; error: ConversionError };

export const dimensionOf = (u: Unit): Dimension => (u in WEIGHT_G ? 'weight' : u in VOLUME_ML ? 'volume' : 'discrete');
const fail = (code: ConversionError['code'], message: string): ConversionResult => ({ ok: false, error: { code, message } });

function toGrams(q: number, u: Unit, data?: ConversionData): ConversionResult {
  const d = dimensionOf(u);
  if (d === 'weight') return { ok: true, value: q * WEIGHT_G[u]! };
  if (d === 'volume') {
    if (!data?.density) return fail('missing-density', `No density data to convert ${u} to weight.`);
    return { ok: true, value: q * VOLUME_ML[u]! * data.density };
  }
  const w = data?.unitWeights?.[u as 'count' | 'package' | 'can'];
  return w ? { ok: true, value: q * w } : fail('missing-unit-weight', `No weight data to convert ${u} to weight.`);
}
function fromGrams(g: number, u: Unit, data?: ConversionData): ConversionResult {
  const d = dimensionOf(u);
  if (d === 'weight') return { ok: true, value: g / WEIGHT_G[u]! };
  if (d === 'volume') {
    if (!data?.density) return fail('missing-density', `No density data to convert weight to ${u}.`);
    return { ok: true, value: g / data.density / VOLUME_ML[u]! };
  }
  const w = data?.unitWeights?.[u as 'count' | 'package' | 'can'];
  return w ? { ok: true, value: g / w } : fail('missing-unit-weight', `No weight data to convert weight to ${u}.`);
}

/** Converts within a dimension directly. Crosses dimensions only when ingredient-specific data exists. Never guesses. */
export function convert(quantity: number, from: Unit, to: Unit, data?: ConversionData): ConversionResult {
  if (from === to) return { ok: true, value: quantity };
  const df = dimensionOf(from), dt = dimensionOf(to);
  if (df === dt && df !== 'discrete') {
    const table = df === 'weight' ? WEIGHT_G : VOLUME_ML;
    return { ok: true, value: (quantity * table[from]!) / table[to]! };
  }
  const g = toGrams(quantity, from, data);
  if (!g.ok) return g;
  return fromGrams(g.value, to, data);
}

export const canConvert = (from: Unit, to: Unit, data?: ConversionData) => convert(1, from, to, data).ok;
