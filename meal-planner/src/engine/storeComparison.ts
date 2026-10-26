import type { DataStatus, Product, Requirement, Store } from '../types';
import { stores as allStores } from '../data/stores';
import { products as allProducts } from '../data/products';
import { ingredientsById } from '../data/ingredients';
import { matchIngredient } from './productMatching';
import { ingredientCost, mealCostPerServing, round } from './costCalculator';
import { haversineMiles, type Coords } from './distanceCalculator';
import { storeComparisonWeights, minCoverageForRecommendation, outsideRadiusPenalty } from '../config/storeComparisonWeights';

export interface BasketItem { ingredientId: string; requirements: Requirement[] }
export interface BasketLine { ingredientId: string; name: string; productName: string; packages: number; checkout: number; usage: number; onSale: boolean }
export interface StoreResult {
  store: Store; totalCheckoutCost: number; estimatedUsageCost: number; mealCostPerServing: number; distanceMiles: number | null;
  pricedIngredientCount: number; totalIngredientCount: number; coveragePercent: number;
  missingIngredients: string[]; uncertainMatches: string[]; lines: BasketLine[]; priceType: DataStatus;
  score: number; explanation: string; recommendable: boolean; outsideRadius: boolean; isRecommended: boolean;
}
export interface CompareInput {
  basket: BasketItem[]; servings: number; user: Coords | null; radiusMiles: number; preference: 'lowest' | 'closest' | 'best';
  stores?: Store[]; products?: Product[];
}
const typeRank: DataStatus[] = ['sample', 'estimated', 'verified-static'];

/** Compares ONLY bundled demo stores and prices. Missing prices are never treated as zero. */
export function compareStores(inp: CompareInput): StoreResult[] {
  const stores = inp.stores ?? allStores, products = inp.products ?? allProducts;
  const raw = stores.map((store) => {
    const sp = products.filter((p) => p.storeId === store.id);
    const lines: BasketLine[] = [], missing: string[] = [], uncertain: string[] = [];
    let types: DataStatus[] = [];
    for (const item of inp.basket) {
      const ing = ingredientsById[item.ingredientId];
      const m = matchIngredient(ing, sp);
      if (m.status === 'unmatched') { missing.push(ing.name); continue; }
      if (m.status === 'uncertain' || !m.product) { uncertain.push(ing.name); continue; }
      const c = ingredientCost(item.requirements, m.product, ing);
      if (!c.ok) { uncertain.push(`${ing.name} (unit conversion unavailable)`); continue; }
      types.push(m.product.priceType);
      lines.push({ ingredientId: ing.id, name: ing.name, productName: m.product.productName, packages: c.packagesNeeded, checkout: c.packageCheckoutCost, usage: c.usageCost, onSale: m.product.salePrice !== undefined });
    }
    const checkout = round(lines.reduce((s, l) => s + l.checkout, 0)), usage = round(lines.reduce((s, l) => s + l.usage, 0));
    const total = inp.basket.length;
    const dist = inp.user ? haversineMiles(inp.user, store) : null;
    const priceType = types.length ? types.reduce((w, t) => (typeRank.indexOf(t) < typeRank.indexOf(w) ? t : w)) : 'sample';
    return { store, checkout, usage, dist, lines, missing, uncertain, priced: lines.length, total, priceType };
  });
  const lineAvg = (() => { const all = raw.flatMap((r) => r.lines.map((l) => l.checkout)); return all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0; })();
  const rankCost = raw.map((r) => r.checkout + (r.total - r.priced) * lineAvg);
  const minC = Math.min(...rankCost), maxC = Math.max(...rankCost);
  const w = { ...storeComparisonWeights[inp.preference] };
  if (!inp.user) w.distance = 0;
  const wsum = w.cost + w.distance + w.coverage;

  const results: StoreResult[] = raw.map((r, i) => {
    const coverage = r.total ? r.priced / r.total : 0;
    const costN = maxC === minC ? 1 : 1 - (rankCost[i] - minC) / (maxC - minC);
    const distN = r.dist === null ? 0.5 : 1 - Math.min(1, r.dist / (inp.radiusMiles * 2));
    const outside = r.dist !== null && r.dist > inp.radiusMiles;
    let score = ((w.cost * costN + w.distance * distN + w.coverage * coverage) / wsum) * 100;
    if (outside) score -= outsideRadiusPenalty * 100;
    if (coverage < minCoverageForRecommendation) score -= 25;
    return {
      store: r.store, totalCheckoutCost: r.checkout, estimatedUsageCost: r.usage, mealCostPerServing: mealCostPerServing(r.usage, inp.servings),
      distanceMiles: r.dist, pricedIngredientCount: r.priced, totalIngredientCount: r.total, coveragePercent: Math.round(coverage * 100),
      missingIngredients: r.missing, uncertainMatches: r.uncertain, lines: r.lines, priceType: r.priceType, score: Math.max(0, Math.round(score)),
      explanation: '', recommendable: coverage >= minCoverageForRecommendation && !outside, outsideRadius: outside, isRecommended: false,
    };
  }).sort((a, b) => Number(b.recommendable) - Number(a.recommendable) || b.score - a.score);

  const costs = results.map((r) => r.totalCheckoutCost).sort((a, b) => a - b);
  results.forEach((r, i) => {
    if (i === 0 && r.recommendable) r.isRecommended = true;
    const low = r.coveragePercent < minCoverageForRecommendation * 100;
    const bits: string[] = [];
    bits.push(low ? `only ${r.coveragePercent}% of the basket has price coverage, so it is not recommended` : `${r.coveragePercent}% of the basket has price coverage`);
    if (!low) bits.push(r.totalCheckoutCost <= costs[Math.min(1, costs.length - 1)] ? 'its estimated checkout total is among the lowest' : 'its estimated checkout total is moderate');
    if (r.distanceMiles !== null) bits.push(r.outsideRadius ? 'it is outside the selected radius' : 'it is within the selected radius');
    const text = bits.length > 1 ? `${bits.slice(0, -1).join(', ')} and ${bits[bits.length - 1]}` : bits[0];
    r.explanation = r.isRecommended ? `Recommended from the demo dataset because ${text}.` : `${text[0].toUpperCase()}${text.slice(1)}.`;
  });
  return results;
}
export type SortKey = 'cost' | 'distance' | 'coverage' | 'best';
export function sortResults(r: StoreResult[], key: SortKey): StoreResult[] {
  const c = [...r];
  if (key === 'cost') return c.sort((a, b) => a.totalCheckoutCost - b.totalCheckoutCost);
  if (key === 'distance') return c.sort((a, b) => (a.distanceMiles ?? 1e9) - (b.distanceMiles ?? 1e9));
  if (key === 'coverage') return c.sort((a, b) => b.coveragePercent - a.coveragePercent || a.totalCheckoutCost - b.totalCheckoutCost);
  return c.sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended) || Number(b.recommendable) - Number(a.recommendable) || b.score - a.score);
}
