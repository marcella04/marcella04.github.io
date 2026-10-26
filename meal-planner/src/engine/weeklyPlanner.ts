import type { DayPlan, MealType, Profile, WeekPlan } from '../types';
import { meals as allMeals, mealsById } from '../data/meals';
import type { NutritionEstimate } from './nutritionCalculator';
import { recommendMeals } from './mealRecommendation';
import { recommendWorkout } from './workoutRecommendation';
import { addDays } from '../utils/dates';
import { DAY_NAMES } from '../utils/dates';

export interface PlanInput {
  weekStart: string; profile: Profile; target: NutritionEstimate; seed: number;
  existing?: WeekPlan | null; mode: 'full' | 'uncompleted';
}
const blankDay = (date: string): DayPlan => ({ date, lunchMealId: null, dinnerMealId: null, workoutId: null, lunchEaten: false, dinnerEaten: false, workoutDone: false });

export function generateWeek({ weekStart, profile, target, seed, existing, mode }: PlanInput): WeekPlan {
  const keep = mode === 'uncompleted' ? existing : null;
  const warnings: string[] = [];
  const used: Record<string, number> = {};
  const days: DayPlan[] = [];
  for (const d of keep?.days ?? []) {
    for (const [id, eaten] of [[d.lunchMealId, d.lunchEaten], [d.dinnerMealId, d.dinnerEaten]] as const) if (id && eaten) used[id] = (used[id] ?? 0) + 1;
  }
  const relaxedNames = new Set<string>(); let relaxedCount = 0; const blocked: string[] = [];
  const workoutIds: (string | null)[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const old = keep?.days[i];
    const day: DayPlan = old ? { ...old } : blankDay(date);
    day.date = date;
    const prevIds = i > 0 ? [days[i - 1].lunchMealId, days[i - 1].dinnerMealId].filter(Boolean) as string[] : [];
    for (const type of ['lunch', 'dinner'] as MealType[]) {
      const idKey = type === 'lunch' ? 'lunchMealId' : 'dinnerMealId';
      const eatenKey = type === 'lunch' ? 'lunchEaten' : 'dinnerEaten';
      if (old && old[eatenKey] && old[idKey]) continue;
      const todayIds = [day.lunchMealId, day.dinnerMealId].filter(Boolean) as string[];
      const res = recommendMeals(type, { profile, target, meals: allMeals, used, previousDayMealIds: prevIds, seed, slotKey: `${date}|${type}` });
      const pick = res.candidates.find((c) => !todayIds.includes(c.meal.id)) ?? res.candidates[0];
      if (!pick) { day[idKey] = null; blocked.push(`${DAY_NAMES[i]} ${type}`); continue; }
      if (res.relaxed.length) { relaxedCount++; res.relaxed.forEach((r) => relaxedNames.add(r)); }
      day[idKey] = pick.meal.id; used[pick.meal.id] = (used[pick.meal.id] ?? 0) + 1;
    }
    if (old && old.workoutDone && old.workoutId) workoutIds.push(old.workoutId);
    else { const w = recommendWorkout(profile, i, workoutIds, seed); day.workoutId = w.id; day.workoutDone = false; workoutIds.push(w.id); }
    days.push(day);
  }

  if (blocked.length) warnings.push(`No meal satisfies your allergies and dietary restrictions for: ${blocked.join(', ')}. Those slots were left empty rather than breaking a safety setting.`);
  if (relaxedCount) {
    warnings.push(`No complete match met your selected ${[...relaxedNames].join(', ')} together with your dietary restrictions for ${relaxedCount} meal${relaxedCount > 1 ? 's' : ''}. The closest valid options are shown.`);
  }
  const cost = (d: DayPlan) => [d.lunchMealId, d.dinnerMealId].reduce((s, id) => s + (id ? mealsById[id].estimatedCostPerServing : 0), 0);
  const total = days.reduce((s, d) => s + cost(d), 0);
  const overDays = days.filter((d) => cost(d) > profile.maxDailyBudget).length;
  if (overDays) warnings.push(`${overDays} day${overDays > 1 ? 's' : ''} exceed your daily meal budget of $${profile.maxDailyBudget} (estimated).`);
  if (total > profile.maxWeeklyBudget) warnings.push(`The weekly estimate ($${total.toFixed(2)}) exceeds your selected weekly budget ($${profile.maxWeeklyBudget}).`);
  return { weekStart, days, warnings, seed };
}
export const planMealCost = (d: DayPlan) => [d.lunchMealId, d.dinnerMealId].reduce((s, id) => s + (id ? mealsById[id].estimatedCostPerServing : 0), 0);
