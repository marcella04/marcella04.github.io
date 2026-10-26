import type { IngredientCategory, Requirement, ShoppingState, WeekPlan } from '../types';
import { ingredientsById } from '../data/ingredients';
import { mealsById } from '../data/meals';
import { convert } from './unitConversion';

export type ItemStatus = 'needed' | 'owned' | 'purchased' | 'removed';
export interface ShoppingItem { ingredientId: string; name: string; category: IngredientCategory; requirements: Requirement[]; status: ItemStatus; fromMeals: string[] }
export const emptyWeekState = () => ({ purchased: [] as string[], removed: [] as string[], extraMealIds: [] as string[] });

/** Sums compatible units into the ingredient's default unit. Incompatible units stay as separate lines. */
export function aggregate(entries: { ingredientId: string; quantity: number; unit: Requirement['unit'] }[]): Map<string, Requirement[]> {
  const out = new Map<string, Requirement[]>();
  for (const e of entries) {
    const ing = ingredientsById[e.ingredientId];
    const c = convert(e.quantity, e.unit, ing.defaultUnit, ing);
    const q = c.ok ? c.value : e.quantity, u = c.ok ? ing.defaultUnit : e.unit;
    const list = out.get(e.ingredientId) ?? [];
    const hit = list.find((r) => r.unit === u);
    if (hit) hit.quantity += q; else list.push({ quantity: q, unit: u });
    out.set(e.ingredientId, list);
  }
  return out;
}

export function buildShoppingList(plan: WeekPlan | undefined, state: ShoppingState): ShoppingItem[] {
  if (!plan) return [];
  const week = state.perWeek[plan.weekStart] ?? emptyWeekState();
  const mealIds = [...plan.days.flatMap((d) => [d.lunchMealId, d.dinnerMealId]), ...week.extraMealIds].filter(Boolean) as string[];
  const entries: Parameters<typeof aggregate>[0] = [];
  const from: Record<string, Set<string>> = {};
  for (const id of mealIds) {
    const m = mealsById[id];
    for (const i of m.ingredients) {
      if (ingredientsById[i.ingredientId].shoppable === false || i.optional) continue;
      entries.push({ ingredientId: i.ingredientId, quantity: i.quantity / m.servings, unit: i.unit });
      (from[i.ingredientId] ??= new Set()).add(m.name);
    }
  }
  const order: IngredientCategory[] = ['protein', 'vegetable', 'fruit', 'dairy', 'grain', 'pantry', 'sauce', 'seasoning', 'prepared food'];
  return [...aggregate(entries)].map(([id, requirements]) => {
    const ing = ingredientsById[id];
    const status: ItemStatus = week.removed.includes(id) ? 'removed' : state.owned.includes(id) ? 'owned' : week.purchased.includes(id) ? 'purchased' : 'needed';
    return { ingredientId: id, name: ing.name, category: ing.category, requirements, status, fromMeals: [...from[id]] };
  }).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name));
}
/** Items that count toward estimated package checkout: owned and removed items are excluded. */
export const checkoutItems = (items: ShoppingItem[]) => items.filter((i) => i.status === 'needed' || i.status === 'purchased');
export const formatQty = (r: Requirement) => `${Math.round(r.quantity * 100) / 100} ${r.unit}`;
