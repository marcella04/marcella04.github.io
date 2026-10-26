import type { Ingredient, Product, Requirement } from '../types';
import { convert } from './unitConversion';

/**
 * Four distinct values are kept apart:
 *  - package checkout cost: packages needed x package price (what is paid)
 *  - ingredient usage cost: share of a package the recipe actually uses
 *  - meal cost per serving: usage cost divided by servings
 *  - weekly checkout cost: sum of package checkout cost over the aggregated weekly list
 * Limitations: package rounding is per ingredient (no partial-package carry-over across weeks),
 * and prices are sample estimates. Aggregate ingredients BEFORE pricing to avoid double-counting shared packages.
 */
export const effectivePrice = (p: Product) => p.salePrice ?? p.regularPrice;

export interface IngredientCost {
  ok: boolean;
  packagesNeeded: number;
  packageCheckoutCost: number;
  usageCost: number;
  error?: string;
}

export function ingredientCost(reqs: Requirement[], product: Product, ingredient: Ingredient): IngredientCost {
  let needed = 0;
  for (const r of reqs) {
    const c = convert(r.quantity, r.unit, product.packageUnit, ingredient);
    if (!c.ok) return { ok: false, packagesNeeded: 0, packageCheckoutCost: 0, usageCost: 0, error: c.error.message };
    needed += c.value;
  }
  const packagesNeeded = Math.max(1, Math.ceil(needed / product.packageQuantity - 1e-9));
  const price = effectivePrice(product);
  return {
    ok: true, packagesNeeded, packageCheckoutCost: round(packagesNeeded * price),
    usageCost: round((needed / product.packageQuantity) * price),
  };
}
export const mealCostPerServing = (usageCost: number, servings: number) => round(usageCost / Math.max(1, servings));
export const round = (n: number) => Math.round(n * 100) / 100;
export const money = (n: number) => `$${n.toFixed(2)}`;
