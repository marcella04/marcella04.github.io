import type { Meal, MealType, Profile } from '../types';
import type { NutritionEstimate } from './nutritionCalculator';
import { recommendationWeights as W, calorieBand, labels } from '../config/recommendationWeights';
import { ingredientsById } from '../data/ingredients';
import { pricedIngredientIds } from '../data/products';
import { hash } from '../utils/dates';

export interface RecContext {
  profile: Profile; target: NutritionEstimate; meals: Meal[];
  /** meal id -> times already used this week */
  used?: Record<string, number>;
  previousDayMealIds?: string[];
  seed?: number; slotKey?: string;
}
export interface Scored { meal: Meal; score: number; breakdown: { key: string; label: string; value: number }[]; explanation: string }
export interface RecResult { candidates: Scored[]; relaxed: string[] }

const dietRequires: Record<Profile['dietPreference'], string | null> = { omnivore: null, pescatarian: 'pescatarian', vegetarian: 'vegetarian', vegan: 'vegan' };

/** Mandatory exclusions: allergies and hard dietary restrictions. Never relaxed. */
export function isSafeForProfile(meal: Meal, p: Profile): boolean {
  if (meal.allergenTags.some((a) => p.allergies.includes(a))) return false;
  const need = [...p.restrictions, ...(dietRequires[p.dietPreference] ? [dietRequires[p.dietPreference]!] : [])];
  return need.every((t) => meal.dietaryTags.includes(t));
}
const typeOk = (m: Meal, t: MealType) => m.mealType === t || m.mealType === 'either';
const targetFor = (t: MealType, e: NutritionEstimate) => (t === 'lunch' ? e.lunchTarget : e.dinnerTarget);
const isNoCook = (m: Meal) => ['no-cook', 'grocery-prepared', 'restaurant-style'].some((t) => m.preparationTags.includes(t));
const cookingOk = (m: Meal, p: Profile) => (p.noCook && !isNoCook(m) ? false : p.cooking === 'minimal' ? m.preparationMinutes <= 20 : true);

export function dislikedIn(meal: Meal, dislikes: string): string[] {
  const words = dislikes.toLowerCase().split(/[,;\n]/).map((s) => s.trim()).filter((s) => s.length > 2);
  if (!words.length) return [];
  return words.filter((w) => meal.ingredients.some((i) => {
    const ing = ingredientsById[i.ingredientId];
    return [ing.name, ...ing.aliases].some((n) => n.toLowerCase().includes(w) || w.includes(n.toLowerCase()));
  }) || meal.name.toLowerCase().includes(w));
}
export function priceCoverage(meal: Meal): number {
  const shop = meal.ingredients.filter((i) => ingredientsById[i.ingredientId].shoppable !== false);
  return shop.length ? shop.filter((i) => pricedIngredientIds.has(i.ingredientId)).length / shop.length : 0;
}

export function scoreMeal(meal: Meal, type: MealType, ctx: RecContext): Scored {
  const { profile: p, target } = ctx;
  const t = targetFor(type, target);
  const prepared = p.cooking === 'prepared' && (meal.preparationTags.includes('grocery-prepared') || meal.preparationTags.includes('restaurant-style'));
  const used = ctx.used?.[meal.id] ?? 0;
  const repeatOk = p.mealPrep && meal.preparationTags.includes('meal-prep');
  const wantProtein = p.highProtein ? 35 : 25;
  const cuisineFit = p.cuisines.length ? (meal.cuisineTags.some((c) => p.cuisines.includes(c)) ? 1 : 0) : 0.5;
  const v = {
    calorieFit: Math.max(0, 1 - Math.abs(meal.calories - t) / (t * calorieBand.swap)),
    proteinFit: Math.min(1, meal.protein / wantProtein),
    budgetFit: Math.max(0, 1 - 0.5 * (meal.estimatedCostPerServing / Math.max(1, p.maxMealCost))),
    prepConvenience: Math.max(0, 1 - meal.preparationMinutes / Math.max(10, p.maxPrepMinutes)),
    cuisine: cuisineFit,
    variety: Math.max(0, 1 - used * (repeatOk ? 0.25 : 0.7)) - (ctx.previousDayMealIds?.includes(meal.id) ? 0.5 : 0),
    priceCoverage: priceCoverage(meal),
    mealPrepBonus: p.mealPrep && meal.preparationTags.includes('meal-prep') ? 1 : 0,
    preparedBonus: prepared ? 1 : 0,
    dislikePenalty: dislikedIn(meal, p.dislikes).length ? -1 : 0,
  };
  const breakdown = (Object.keys(v) as (keyof typeof v)[]).map((k) => ({ key: k, label: labels[k], value: v[k] * W[k] }));
  const jitter = hash(`${ctx.seed ?? 0}|${ctx.slotKey ?? ''}|${meal.id}`) * W.jitter;
  const score = breakdown.reduce((s, b) => s + b.value, 0) + jitter;
  const top = [...breakdown].filter((b) => b.value > 0).sort((a, b) => b.value - a.value).slice(0, 3).map((b) => b.label.toLowerCase());
  return { meal, score, breakdown, explanation: top.length ? `Ranked well for ${top.join(', ')}. This is a planning score, not medical validation.` : 'Valid under your safety filters.' };
}

/**
 * Filters in order: allergies, hard diet, meal type, calorie target, max meal cost, prep time, cooking preference.
 * If nothing passes, later (soft) filters are relaxed one at a time and reported. Steps 1-3 are never relaxed.
 */
export function recommendMeals(type: MealType, ctx: RecContext): RecResult {
  const p = ctx.profile, t = targetFor(type, ctx.target);
  const safe = ctx.meals.filter((m) => isSafeForProfile(m, p)).filter((m) => typeOk(m, type));
  const soft: [string, (m: Meal) => boolean][] = [
    ['calorie target', (m) => Math.abs(m.calories - t) <= t * calorieBand.lunchDinner],
    ['maximum meal cost', (m) => m.estimatedCostPerServing <= p.maxMealCost],
    ['maximum preparation time', (m) => m.preparationMinutes <= p.maxPrepMinutes],
    ['cooking preference', (m) => cookingOk(m, p)],
  ];
  let active = soft.map(([n]) => n);
  const pass = () => safe.filter((m) => soft.every(([n, f]) => !active.includes(n) || f(m)));
  let list = pass();
  const relaxed: string[] = [];
  for (const [name] of [...soft].reverse()) {
    if (list.length) break;
    active = active.filter((n) => n !== name); relaxed.push(name); list = pass();
  }
  return { candidates: list.map((m) => scoreMeal(m, type, ctx)).sort((a, b) => b.score - a.score), relaxed };
}

export type SwapMode = 'cost' | 'protein' | 'faster' | 'different' | 'vegetarian' | 'no-cook' | 'restaurant' | 'prepared';
export const swapModes: { id: SwapMode; label: string }[] = [
  { id: 'cost', label: 'Lower Estimated Cost' }, { id: 'protein', label: 'Higher Protein' }, { id: 'faster', label: 'Faster' },
  { id: 'different', label: 'Something Different' }, { id: 'vegetarian', label: 'Vegetarian' }, { id: 'no-cook', label: 'No Cook' },
  { id: 'restaurant', label: 'Restaurant Style' }, { id: 'prepared', label: 'Grocery Prepared' },
];

/** Replaces one meal only. Allergies and hard restrictions are always enforced. */
export function findSwap(type: MealType, current: Meal, mode: SwapMode, ctx: RecContext, excludeIds: string[]): { meal: Meal | null; reason: string } {
  const t = targetFor(type, ctx.target), p = ctx.profile;
  const pool = ctx.meals.filter((m) => isSafeForProfile(m, p) && typeOk(m, type) && m.id !== current.id && !excludeIds.includes(m.id))
    .filter((m) => Math.abs(m.calories - t) <= t * calorieBand.swap);
  const preds: Record<SwapMode, (m: Meal) => boolean> = {
    cost: (m) => m.estimatedCostPerServing < current.estimatedCostPerServing,
    protein: (m) => m.protein > current.protein,
    faster: (m) => m.preparationMinutes < current.preparationMinutes,
    different: (m) => !m.cuisineTags.some((c) => current.cuisineTags.includes(c)) || m.name !== current.name,
    vegetarian: (m) => m.dietaryTags.includes('vegetarian'),
    'no-cook': (m) => m.preparationTags.includes('no-cook'),
    restaurant: (m) => m.preparationTags.includes('restaurant-style'),
    prepared: (m) => m.preparationTags.includes('grocery-prepared'),
  };
  const cands = pool.filter(preds[mode]).map((m) => scoreMeal(m, type, ctx));
  if (!cands.length) {
    return { meal: null, reason: `No other meal matches "${swapModes.find((s) => s.id === mode)!.label}" while respecting your allergies, dietary restrictions and calorie range.` };
  }
  const sorters: Partial<Record<SwapMode, (a: Scored, b: Scored) => number>> = {
    cost: (a, b) => a.meal.estimatedCostPerServing - b.meal.estimatedCostPerServing,
    protein: (a, b) => b.meal.protein - a.meal.protein,
    faster: (a, b) => a.meal.preparationMinutes - b.meal.preparationMinutes,
  };
  cands.sort(sorters[mode] ?? ((a, b) => b.score - a.score));
  return { meal: cands[0].meal, reason: '' };
}
