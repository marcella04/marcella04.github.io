import type { NutritionRecord } from '../types';

/** All values are per 100 g. Typical reference-style figures, labelled "estimated"; not live and not individually verified. */
const rows: Array<[string, number, number, number, number, number, number]> = [
  // id, kcal, protein, carbs, fat, fiber, sodium mg
  ['chicken-breast', 120, 22.5, 0, 2.6, 0, 45], ['ground-turkey', 150, 19, 0, 8, 0, 70], ['salmon-fillet', 208, 20, 0, 13, 0, 59],
  ['canned-tuna', 116, 26, 0, 0.8, 0, 340], ['shrimp', 90, 20, 0, 0.8, 0, 120], ['eggs', 143, 12.6, 0.7, 9.5, 0, 142],
  ['firm-tofu', 144, 17, 3, 9, 2, 14], ['black-beans', 91, 6, 16, 0.5, 6, 230], ['chickpeas', 139, 7, 22, 2.5, 6, 240],
  ['lentils', 352, 24, 63, 1.1, 11, 6], ['greek-yogurt', 59, 10, 3.6, 0.4, 0, 36], ['cheddar', 403, 25, 1.3, 33, 0, 621],
  ['feta', 264, 14, 4, 21, 0, 917], ['brown-rice', 362, 7.5, 76, 2.7, 3.4, 4], ['quinoa', 368, 14, 64, 6, 7, 5],
  ['whole-wheat-pasta', 348, 13, 72, 2.5, 10, 6], ['tortilla', 310, 9, 50, 7, 6, 600], ['bread', 250, 12, 43, 4, 7, 450],
  ['oats', 379, 13, 68, 6.5, 10, 6], ['sweet-potato', 86, 1.6, 20, 0.1, 3, 55], ['broccoli', 34, 2.8, 7, 0.4, 2.6, 33],
  ['spinach', 23, 2.9, 3.6, 0.4, 2.2, 79], ['bell-pepper', 26, 1, 6, 0.3, 2, 4], ['tomato', 18, 0.9, 3.9, 0.2, 1.2, 5],
  ['cucumber', 15, 0.7, 3.6, 0.1, 0.5, 2], ['carrot', 41, 0.9, 10, 0.2, 2.8, 69], ['onion', 40, 1.1, 9.3, 0.1, 1.7, 4],
  ['garlic', 149, 6.4, 33, 0.5, 2.1, 17], ['frozen-stirfry-veg', 45, 2.5, 8, 0.5, 3, 30], ['avocado', 160, 2, 9, 15, 7, 7],
  ['banana', 89, 1.1, 23, 0.3, 2.6, 1], ['lemon', 29, 1.1, 9, 0.3, 2.8, 2], ['frozen-berries', 50, 0.7, 12, 0.3, 3.5, 1],
  ['olive-oil', 884, 0, 0, 100, 0, 2], ['soy-sauce', 60, 8, 5.6, 0.1, 0.8, 5500], ['salsa', 36, 1.5, 7, 0.2, 1.8, 700],
  ['marinara', 50, 1.6, 8, 1.4, 2, 450], ['hummus', 230, 8, 20, 14, 5, 380], ['taco-seasoning', 280, 10, 55, 5, 12, 6000],
  ['italian-seasoning', 270, 10, 55, 6, 20, 100], ['peanut-butter', 590, 25, 20, 50, 6, 400],
  ['rotisserie-chicken', 190, 27, 0, 8.5, 0, 450], ['salad-kit', 90, 3, 9, 5, 2, 320],
];

export const nutrition: NutritionRecord[] = rows.map(([ingredientId, calories, protein, carbohydrates, fat, fiber, sodium]) => ({
  ingredientId, servingQuantity: 100, servingUnit: 'g', calories, protein, carbohydrates, fat, fiber, sodium,
  dataStatus: 'estimated', sourceLabel: 'Typical reference values (not individually verified)',
  sourceNote: 'Per 100 g. Static planning estimate; cooked and branded values differ.',
}));
export const nutritionById: Record<string, NutritionRecord> = Object.fromEntries(nutrition.map((n) => [n.ingredientId, n]));
