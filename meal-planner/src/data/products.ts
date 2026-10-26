import type { Product } from '../types';
import { basePrices } from './priceTable';

/**
 * Sample store prices generated from one invented base price table, scaled per store.
 * Every record is priceType "sample". No capturedDate is set because no real capture occurred.
 */
const storeMultiplier: Record<string, number> = {
  'demo-market-central': 1.06, 'value-grocery-central': 0.94, 'value-grocery-north': 0.92,
  'neighborhood-foods-south': 1.0, 'corner-pantry-south': 1.12,
};
/** Ingredients a store does not carry in the sample data. */
const missing: Record<string, string[]> = {
  'value-grocery-central': ['salmon-fillet', 'feta', 'quinoa', 'rotisserie-chicken', 'salad-kit'],
  'value-grocery-north': ['firm-tofu', 'shrimp', 'lentils', 'hummus'],
  'neighborhood-foods-south': [],
  'corner-pantry-south': ['salmon-fillet', 'shrimp', 'firm-tofu', 'quinoa', 'lentils', 'feta', 'rotisserie-chicken', 'frozen-berries', 'salad-kit', 'hummus', 'italian-seasoning'],
  'demo-market-central': [],
};
/** Sample sale multipliers keyed `${storeId}:${ingredientId}`. */
const sales: Record<string, number> = {
  'value-grocery-north:chicken-breast': 0.85, 'demo-market-central:salmon-fillet': 0.9, 'neighborhood-foods-south:eggs': 0.9,
};
/** Products whose canonical mapping is unknown, so matching is only "uncertain". */
const unmapped: Record<string, string> = { 'neighborhood-foods-south': 'chicken-breast' };

const r2 = (n: number) => Math.round(n * 100) / 100;
export const products: Product[] = Object.keys(storeMultiplier).flatMap((storeId) =>
  Object.entries(basePrices)
    .filter(([id]) => !missing[storeId].includes(id))
    .map(([ingredientId, b]) => {
      const regularPrice = r2(b.price * storeMultiplier[storeId]);
      const sale = sales[`${storeId}:${ingredientId}`];
      const isUnmapped = unmapped[storeId] === ingredientId;
      return {
        id: `${storeId}:${ingredientId}`, storeId, ingredientId: isUnmapped ? '' : ingredientId,
        productName: b.name, brand: b.brand, packageQuantity: b.qty, packageUnit: b.unit, regularPrice,
        ...(sale ? { salePrice: r2(regularPrice * sale) } : {}),
        availability: 'sample-available', priceType: 'sample', sourceLabel: 'Invented sample price for demonstration',
      } as Product;
    }),
);
export const productsByStore = (storeId: string) => products.filter((p) => p.storeId === storeId);
export const pricedIngredientIds = new Set(products.filter((p) => p.ingredientId).map((p) => p.ingredientId));
