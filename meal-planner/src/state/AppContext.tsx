import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData, DayPlan, LocationPref, MealType, WeekPlan, WeightEntry } from '../types';
import { storageService, defaultData } from '../services/storage/storageService';
import { estimateNutrition, type NutritionEstimate } from '../engine/nutritionCalculator';
import { generateWeek } from '../engine/weeklyPlanner';
import { findSwap, type SwapMode } from '../engine/mealRecommendation';
import { meals, mealsById } from '../data/meals';
import { demoAreas } from '../data/areas';
import { currentWeekStart } from '../utils/dates';
import { emptyWeekState } from '../engine/shoppingListGenerator';
import type { Coords } from '../engine/distanceCalculator';

interface Ctx {
  data: AppData; recovered: boolean; target: NutritionEstimate;
  weekStart: string; setWeekStart: (s: string) => void; plan: WeekPlan | undefined;
  userCoords: Coords | null; setSessionCoords: (c: Coords | null) => void;
  update: (fn: (d: AppData) => AppData) => void;
  generate: (mode: 'full' | 'uncompleted') => void;
  swap: (date: string, type: MealType, mode: SwapMode) => string;
  toggleEaten: (date: string, type: MealType) => void; toggleWorkout: (date: string) => void;
  toggleFavorite: (id: string) => void;
  setLocation: (l: LocationPref) => void;
  toggleOwned: (id: string) => void; togglePurchased: (id: string) => void; removeItem: (id: string) => void; restoreItem: (id: string) => void; addExtraMeal: (mealId: string) => void;
  saveWeight: (w: Omit<WeightEntry, 'id'> & { id?: string }) => void; deleteWeight: (id: string) => void;
  resetWeek: () => void; clearProgress: () => void; clearAll: () => void;
}
const C = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(C); if (!c) throw new Error('AppProvider missing'); return c; };
const toggle = (a: string[], id: string) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(() => storageService.load());
  const [data, setData] = useState<AppData>(loaded.data);
  const [weekStart, setWeekStart] = useState(currentWeekStart());
  const [sessionCoords, setSessionCoords] = useState<Coords | null>(null);
  useEffect(() => { storageService.save(data); }, [data]);
  const update = useCallback((fn: (d: AppData) => AppData) => setData(fn), []);
  const target = useMemo(() => estimateNutrition(data.profile), [data.profile]);
  const plan = data.plans[weekStart];

  const userCoords = useMemo<Coords | null>(() => {
    const l = data.location;
    if (l.mode === 'geo') return sessionCoords ?? l.savedCoords ?? null;
    if (l.mode === 'demo') { const a = demoAreas.find((x) => x.id === l.areaId); return a ? { latitude: a.latitude, longitude: a.longitude } : null; }
    return null;
  }, [data.location, sessionCoords]);

  const week = (d: AppData, ws: string) => d.shopping.perWeek[ws] ?? emptyWeekState();
  const patchWeek = (fn: (w: ReturnType<typeof emptyWeekState>) => ReturnType<typeof emptyWeekState>) =>
    update((d) => ({ ...d, shopping: { ...d.shopping, perWeek: { ...d.shopping.perWeek, [weekStart]: fn(week(d, weekStart)) } } }));
  const patchDay = (date: string, fn: (d: DayPlan) => DayPlan) =>
    update((d) => { const p = d.plans[weekStart]; if (!p) return d; return { ...d, plans: { ...d.plans, [weekStart]: { ...p, days: p.days.map((x) => (x.date === date ? fn(x) : x)) } } }; });

  const value: Ctx = {
    data, recovered: loaded.recovered, target, weekStart, setWeekStart, plan, userCoords, setSessionCoords, update,
    generate: (mode) => update((d) => {
      const existing = d.plans[weekStart];
      const p = generateWeek({ weekStart, profile: d.profile, target: estimateNutrition(d.profile), seed: (existing?.seed ?? 0) + 1, existing, mode });
      return { ...d, plans: { ...d.plans, [weekStart]: p } };
    }),
    swap: (date, type, mode) => {
      if (!plan) return 'Generate a week first.';
      const day = plan.days.find((x) => x.date === date);
      const cur = day && mealsById[(type === 'lunch' ? day.lunchMealId : day.dinnerMealId) ?? ''];
      if (!day || !cur) return 'No meal to swap.';
      const all = plan.days.flatMap((x) => [x.lunchMealId, x.dinnerMealId]).filter(Boolean) as string[];
      const used: Record<string, number> = {}; all.forEach((id) => { used[id] = (used[id] ?? 0) + 1; });
      const dayIds = [day.lunchMealId, day.dinnerMealId].filter(Boolean) as string[];
      const res = findSwap(type, cur, mode, { profile: data.profile, target, meals, used, seed: plan.seed + 7, slotKey: `${date}|${type}|swap` }, mode === 'different' ? all : dayIds);
      if (!res.meal) return res.reason;
      const id = res.meal.id;
      patchDay(date, (x) => (type === 'lunch' ? { ...x, lunchMealId: id } : { ...x, dinnerMealId: id }));
      return '';
    },
    toggleEaten: (date, type) => patchDay(date, (x) => (type === 'lunch' ? { ...x, lunchEaten: !x.lunchEaten } : { ...x, dinnerEaten: !x.dinnerEaten })),
    toggleWorkout: (date) => patchDay(date, (x) => ({ ...x, workoutDone: !x.workoutDone })),
    toggleFavorite: (id) => update((d) => ({ ...d, favorites: toggle(d.favorites, id) })),
    setLocation: (location) => update((d) => ({ ...d, location })),
    toggleOwned: (id) => update((d) => ({ ...d, shopping: { ...d.shopping, owned: toggle(d.shopping.owned, id) } })),
    togglePurchased: (id) => patchWeek((w) => ({ ...w, purchased: toggle(w.purchased, id) })),
    removeItem: (id) => patchWeek((w) => ({ ...w, removed: w.removed.includes(id) ? w.removed : [...w.removed, id] })),
    restoreItem: (id) => patchWeek((w) => ({ ...w, removed: w.removed.filter((x) => x !== id) })),
    addExtraMeal: (mealId) => patchWeek((w) => ({ ...w, extraMealIds: [...w.extraMealIds, mealId] })),
    saveWeight: (w) => update((d) => {
      const e: WeightEntry = { ...w, id: w.id ?? `w${Date.now()}${Math.floor(Math.random() * 1000)}` };
      const rest = d.weights.filter((x) => x.id !== e.id);
      return { ...d, weights: [...rest, e].sort((a, b) => a.date.localeCompare(b.date)) };
    }),
    deleteWeight: (id) => update((d) => ({ ...d, weights: d.weights.filter((x) => x.id !== id) })),
    resetWeek: () => update((d) => {
      const plans = { ...d.plans }; delete plans[weekStart];
      const perWeek = { ...d.shopping.perWeek }; delete perWeek[weekStart];
      return { ...d, plans, shopping: { ...d.shopping, perWeek } };
    }),
    clearProgress: () => update((d) => ({
      ...d, weights: [],
      plans: Object.fromEntries(Object.entries(d.plans).map(([k, p]) => [k, { ...p, days: p.days.map((x) => ({ ...x, lunchEaten: false, dinnerEaten: false, workoutDone: false })) }])),
      shopping: { ...d.shopping, perWeek: Object.fromEntries(Object.entries(d.shopping.perWeek).map(([k, w]) => [k, { ...w, purchased: [] }])) },
    })),
    clearAll: () => { storageService.clearAll(); setSessionCoords(null); setData(defaultData()); },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
