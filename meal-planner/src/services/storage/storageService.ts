import type { AppData, Profile } from '../../types';

const KEY = 'mealplanner.v1.data';
export const STORAGE_VERSION = 1;

export const defaultProfile: Profile = {
  age: 35, sex: 'unspecified', height: 66, heightUnit: 'in', weight: 180, goalWeight: 170, weightUnit: 'lb', activity: 'light',
  dietPreference: 'omnivore', allergies: [], restrictions: [], dislikes: '', cuisines: [], highProtein: false,
  maxDailyBudget: 18, maxWeeklyBudget: 110, maxMealCost: 8, cooking: 'any', noCook: false, maxPrepMinutes: 30, mealPrep: false,
  fitness: 'beginner', equipment: ['none'], workoutMinutes: 30, workoutDays: [0, 2, 4], radiusMiles: 10, storePreference: 'best',
};
export const defaultData = (): AppData => ({
  version: STORAGE_VERSION, onboardingComplete: false, profile: { ...defaultProfile }, location: { mode: 'none' },
  plans: {}, favorites: [], shopping: { owned: [], perWeek: {} }, weights: [], selectedStoreIds: [],
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Merges stored values over defaults, keeping only values of the expected type. */
function sanitize(raw: unknown): AppData {
  const d = defaultData();
  if (!isObj(raw)) return d;
  const out: AppData = { ...d };
  if (typeof raw.onboardingComplete === 'boolean') out.onboardingComplete = raw.onboardingComplete;
  if (isObj(raw.profile)) {
    const p: Record<string, unknown> = { ...d.profile };
    for (const k of Object.keys(d.profile) as (keyof Profile)[]) {
      const v = (raw.profile as Record<string, unknown>)[k];
      if (v !== undefined && typeof v === typeof d.profile[k] && Array.isArray(v) === Array.isArray(d.profile[k])) p[k] = v;
    }
    out.profile = p as unknown as Profile;
  }
  if (isObj(raw.location) && typeof raw.location.mode === 'string') out.location = raw.location as unknown as AppData['location'];
  if (isObj(raw.plans)) out.plans = raw.plans as unknown as AppData['plans'];
  if (Array.isArray(raw.favorites)) out.favorites = raw.favorites.filter((x) => typeof x === 'string');
  if (isObj(raw.shopping) && Array.isArray(raw.shopping.owned) && isObj(raw.shopping.perWeek)) out.shopping = raw.shopping as unknown as AppData['shopping'];
  if (Array.isArray(raw.weights)) out.weights = raw.weights as AppData['weights'];
  if (Array.isArray(raw.selectedStoreIds)) out.selectedStoreIds = raw.selectedStoreIds.filter((x) => typeof x === 'string');
  return out;
}

export interface LoadResult { data: AppData; recovered: boolean }

export const storageService = {
  load(): LoadResult {
    try {
      const text = localStorage.getItem(KEY);
      if (!text) return { data: defaultData(), recovered: false };
      const raw = JSON.parse(text);
      if (!isObj(raw) || raw.version !== STORAGE_VERSION) return { data: defaultData(), recovered: true };
      return { data: sanitize(raw), recovered: false };
    } catch {
      return { data: defaultData(), recovered: true };
    }
  },
  save(data: AppData): boolean {
    try { localStorage.setItem(KEY, JSON.stringify({ ...data, version: STORAGE_VERSION })); return true; } catch { return false; }
  },
  clearAll(): void { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } },
};
