import { describe, expect, it } from 'vitest';
import { convert } from './unitConversion';
import { haversineMiles } from './distanceCalculator';
import { estimateNutrition } from './nutritionCalculator';
import { defaultProfile } from '../services/storage/storageService';
import { meals } from '../data/meals';
import { ingredientsById } from '../data/ingredients';
import { products } from '../data/products';
import { recommendMeals, isSafeForProfile, findSwap } from './mealRecommendation';
import { generateWeek } from './weeklyPlanner';
import { aggregate, buildShoppingList, checkoutItems } from './shoppingListGenerator';
import { compareStores } from './storeComparison';
import { matchIngredient } from './productMatching';
import type { Profile } from '../types';

const close = (a: number, b: number, d = 0.01) => expect(Math.abs(a - b)).toBeLessThan(d);

describe('unit conversion', () => {
  it('converts within weight and volume', () => {
    const r = convert(16, 'oz', 'lb'); expect(r.ok && r.value).toBeCloseTo(1, 2);
    const v = convert(3, 'tsp', 'tbsp'); expect(v.ok && v.value).toBeCloseTo(1, 2);
    const c = convert(1, 'cup', 'ml'); expect(c.ok && c.value).toBeCloseTo(236.588, 2);
  });
  it('refuses volume to weight without density', () => {
    const r = convert(1, 'cup', 'g'); expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('missing-density');
  });
  it('uses ingredient density when provided', () => {
    const r = convert(1, 'cup', 'g', { density: 0.5 }); expect(r.ok && r.value).toBeCloseTo(118.294, 2);
  });
  it('does not convert between discrete units without data', () => { expect(convert(1, 'can', 'count').ok).toBe(false); });
});

describe('distance', () => {
  it('matches known haversine values', () => {
    close(haversineMiles({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }), 69.09, 0.1);
    expect(haversineMiles({ latitude: 40, longitude: -100 }, { latitude: 40, longitude: -100 })).toBe(0);
    close(haversineMiles({ latitude: 40, longitude: -100 }, { latitude: 40.06, longitude: -100 }), 4.14, 0.05);
  });
});

describe('nutrition', () => {
  it('computes Mifflin-St Jeor and clamps', () => {
    const e = estimateNutrition({ ...defaultProfile, sex: 'male', age: 30, height: 180, heightUnit: 'cm', weight: 80, weightUnit: 'kg', goalWeight: 80, activity: 'sedentary' });
    expect(e.bmr).toBe(1780); expect(e.tdee).toBe(2136); expect(e.planningTarget).toBe(2136);
  });
  it('never returns an extreme deficit and warns on unsupported input', () => {
    const e = estimateNutrition({ ...defaultProfile, sex: 'female', age: 40, height: 150, heightUnit: 'cm', weight: 45, weightUnit: 'kg', goalWeight: 40, activity: 'sedentary' });
    expect(e.planningTarget).toBeGreaterThanOrEqual(Math.round(e.tdee * 0.8));
    const u = estimateNutrition({ ...defaultProfile, age: 12 }); expect(u.warnings.length).toBeGreaterThan(0);
  });
});

describe('data integrity', () => {
  it('meals reference known ingredients and have sensible macros', () => {
    for (const m of meals) {
      expect(m.calories).toBeGreaterThan(250); expect(m.calories).toBeLessThan(900);
      for (const i of m.ingredients) expect(ingredientsById[i.ingredientId]).toBeDefined();
    }
  });
  it('products never claim live data', () => { for (const p of products) { expect(['sample', 'estimated', 'verified-static']).toContain(p.priceType); expect(p.capturedDate).toBeUndefined(); } });
});

const allergyProfile = (a: Profile['allergies']): Profile => ({ ...defaultProfile, allergies: a, maxMealCost: 30, maxPrepMinutes: 60 });
describe('recommendation safety', () => {
  it('never recommends allergen meals', () => {
    const p = allergyProfile(['dairy', 'egg', 'fish', 'gluten']); const t = estimateNutrition(p);
    for (const type of ['lunch', 'dinner'] as const) {
      const r = recommendMeals(type, { profile: p, target: t, meals });
      expect(r.candidates.length).toBeGreaterThan(0);
      for (const c of r.candidates) expect(c.meal.allergenTags.some((a) => p.allergies.includes(a))).toBe(false);
    }
  });
  it('vegan preference and swaps preserve restrictions', () => {
    const p: Profile = { ...allergyProfile(['peanut']), dietPreference: 'vegan' }; const t = estimateNutrition(p);
    const week = generateWeek({ weekStart: '2026-10-26', profile: p, target: t, seed: 1, mode: 'full' });
    for (const d of week.days) for (const id of [d.lunchMealId, d.dinnerMealId]) { if (id) expect(isSafeForProfile(meals.find((m) => m.id === id)!, p)).toBe(true); }
    const cur = meals.find((m) => m.id === week.days[0].lunchMealId)!;
    for (const mode of ['cost', 'protein', 'faster', 'different', 'vegetarian', 'no-cook'] as const) {
      const s = findSwap('lunch', cur, mode, { profile: p, target: t, meals }, []);
      if (s.meal) expect(isSafeForProfile(s.meal, p)).toBe(true); else expect(s.reason).not.toBe('');
    }
  });
  it('returns warnings instead of ignoring constraints', () => {
    const p: Profile = { ...defaultProfile, maxMealCost: 1, maxWeeklyBudget: 10 }; const t = estimateNutrition(p);
    const week = generateWeek({ weekStart: '2026-10-26', profile: p, target: t, seed: 2, mode: 'full' });
    expect(week.warnings.length).toBeGreaterThan(0);
  });
  it('plans 7 days with varied meals', () => {
    const p = { ...defaultProfile, maxMealCost: 12 }; const week = generateWeek({ weekStart: '2026-10-26', profile: p, target: estimateNutrition(p), seed: 3, mode: 'full' });
    expect(week.days).toHaveLength(7);
    const ids = week.days.flatMap((d) => [d.lunchMealId, d.dinnerMealId]); expect(new Set(ids).size).toBeGreaterThanOrEqual(10);
  });
});

describe('shopping and store comparison', () => {
  it('aggregates compatible units', () => {
    const m = aggregate([{ ingredientId: 'chicken-breast', quantity: 6, unit: 'oz' }, { ingredientId: 'chicken-breast', quantity: 0.5, unit: 'lb' }, { ingredientId: 'chicken-breast', quantity: 5, unit: 'oz' }]);
    const r = m.get('chicken-breast')!; expect(r).toHaveLength(1); close(r[0].quantity, 19);
  });
  const p = defaultProfile; const plan = generateWeek({ weekStart: '2026-10-26', profile: p, target: estimateNutrition(p), seed: 4, mode: 'full' });
  it('owned items leave checkout calculations', () => {
    const base = checkoutItems(buildShoppingList(plan, { owned: [], perWeek: {} }));
    const id = base[0].ingredientId;
    const after = checkoutItems(buildShoppingList(plan, { owned: [id], perWeek: {} }));
    expect(after.some((i) => i.ingredientId === id)).toBe(false); expect(after.length).toBe(base.length - 1);
  });
  it('never treats missing prices as free and lists them', () => {
    const basket = [{ ingredientId: 'salmon-fillet', requirements: [{ quantity: 10, unit: 'oz' as const }] }, { ingredientId: 'eggs', requirements: [{ quantity: 6, unit: 'count' as const }] }];
    const res = compareStores({ basket, servings: 2, user: { latitude: 40, longitude: -100 }, radiusMiles: 10, preference: 'lowest' });
    const vg = res.find((r) => r.store.id === 'value-grocery-central')!;
    expect(vg.missingIngredients).toContain('Salmon fillet'); expect(vg.coveragePercent).toBe(50); expect(vg.isRecommended).toBe(false);
    expect(vg.totalCheckoutCost).toBeGreaterThan(0);
  });
  it('uncertain matches are flagged and not priced', () => {
    const sp = products.filter((x) => x.storeId === 'neighborhood-foods-south');
    expect(matchIngredient(ingredientsById['chicken-breast'], sp).status).toBe('uncertain');
    expect(matchIngredient(ingredientsById['eggs'], sp).status).toBe('exact');
  });
});
