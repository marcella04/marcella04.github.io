import type { Ingredient, Product } from '../types';

export type MatchStatus = 'exact' | 'mapped' | 'uncertain' | 'unmatched';
export interface MatchResult { status: MatchStatus; product?: Product; note?: string }

/** Explicit canonical equivalences. A product for the key may stand in for the listed ids. Empty by default. */
export const mappedEquivalents: Record<string, string[]> = {};

/**
 * Primary match is the canonical ingredient ID. Aliases are only a fallback and always yield "uncertain".
 * "uncertain" results must never be used for allergy-safety decisions, and unmatched items are never free.
 */
export function matchIngredient(ingredient: Ingredient, storeProducts: Product[]): MatchResult {
  const exact = storeProducts.find((p) => p.ingredientId === ingredient.id);
  if (exact) return { status: 'exact', product: exact };
  const mapped = storeProducts.find((p) => p.ingredientId && (mappedEquivalents[p.ingredientId] ?? []).includes(ingredient.id));
  if (mapped) return { status: 'mapped', product: mapped };
  const names = [ingredient.name, ...ingredient.aliases].map((s) => s.toLowerCase());
  const fuzzy = storeProducts.find((p) => !p.ingredientId && names.some((n) => p.productName.toLowerCase().includes(n)));
  if (fuzzy) return { status: 'uncertain', product: fuzzy, note: 'Matched by name only. Verify the product before relying on this price.' };
  return { status: 'unmatched' };
}
