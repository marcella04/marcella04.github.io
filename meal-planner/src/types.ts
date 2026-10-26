export type Unit = 'oz' | 'lb' | 'g' | 'kg' | 'tsp' | 'tbsp' | 'cup' | 'ml' | 'l' | 'count' | 'package' | 'can';
export type DataStatus = 'sample' | 'estimated' | 'verified-static';
export type DietTag = 'vegan' | 'vegetarian' | 'pescatarian' | 'gluten-free' | 'dairy-free';
export type Allergen = 'peanut' | 'tree-nut' | 'dairy' | 'egg' | 'gluten' | 'soy' | 'fish' | 'shellfish' | 'sesame';
export type IngredientCategory = 'protein' | 'grain' | 'vegetable' | 'fruit' | 'dairy' | 'sauce' | 'seasoning' | 'pantry' | 'prepared food';
export type MealType = 'lunch' | 'dinner';
export type Equipment = 'none' | 'dumbbells' | 'resistance-bands' | 'gym';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  defaultUnit: Unit;
  aliases: string[];
  dietTags: DietTag[];
  allergenTags: Allergen[];
  nutritionSourceLabel: string;
  dataStatus: DataStatus;
  /** grams per millilitre; required for volume <-> weight conversion */
  density?: number;
  /** grams per one count / can / package; required for discrete <-> weight conversion */
  unitWeights?: Partial<Record<'count' | 'can' | 'package', number>>;
  /** false for restaurant items that cannot be bought at a store */
  shoppable?: boolean;
}

export interface NutritionRecord {
  ingredientId: string;
  servingQuantity: number;
  servingUnit: 'g';
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;
  dataStatus: DataStatus;
  sourceLabel: string;
  sourceNote: string;
}

export interface MealIngredient { ingredientId: string; quantity: number; unit: Unit; optional: boolean }

export interface Meal {
  id: string;
  name: string;
  mealType: MealType | 'either';
  description: string;
  servings: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  estimatedCostPerServing: number;
  preparationMinutes: number;
  ingredients: MealIngredient[];
  instructions: string[];
  dietaryTags: string[];
  allergenTags: Allergen[];
  cuisineTags: string[];
  preparationTags: string[];
  suggestedStoreChains: string[];
  dataStatus: DataStatus;
}

export interface Exercise {
  name: string;
  sets?: number;
  repetitions?: number;
  durationSeconds?: number;
  restSeconds: number;
  instructions: string;
  modification?: string;
}
export type WorkoutCategory = 'walking/cardio' | 'full body' | 'upper body' | 'lower body' | 'mobility' | 'recovery' | 'rest';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export interface Workout {
  id: string;
  name: string;
  category: WorkoutCategory;
  difficulty: Level;
  durationMinutes: number;
  equipment: Equipment[];
  exercises: Exercise[];
  safetyNotes: string[];
}

export interface Store {
  id: string; name: string; chain: string; areaId: string; latitude: number; longitude: number;
  addressLabel: string; pricingSupport: 'full' | 'partial'; dataStatus: DataStatus;
}
export interface Product {
  id: string; storeId: string; ingredientId: string; productName: string; brand: string;
  packageQuantity: number; packageUnit: Unit; regularPrice: number; salePrice?: number;
  availability: 'sample-available'; priceType: DataStatus; capturedDate?: string; sourceLabel: string;
}
export interface DemoArea { id: string; name: string; latitude: number; longitude: number; description: string }

export interface Profile {
  age: number; sex: 'male' | 'female' | 'unspecified';
  height: number; heightUnit: 'in' | 'cm'; weight: number; goalWeight: number; weightUnit: 'lb' | 'kg';
  activity: 'sedentary' | 'light' | 'moderate' | 'active';
  dietPreference: 'omnivore' | 'pescatarian' | 'vegetarian' | 'vegan';
  allergies: Allergen[]; restrictions: ('gluten-free' | 'dairy-free')[];
  dislikes: string; cuisines: string[]; highProtein: boolean;
  maxDailyBudget: number; maxWeeklyBudget: number; maxMealCost: number;
  cooking: 'any' | 'minimal' | 'prepared'; noCook: boolean; maxPrepMinutes: number; mealPrep: boolean;
  fitness: Level; equipment: Equipment[]; workoutMinutes: number; workoutDays: number[];
  radiusMiles: number; storePreference: 'lowest' | 'closest' | 'best';
}

export interface DayPlan {
  date: string;
  lunchMealId: string | null; dinnerMealId: string | null; workoutId: string | null;
  lunchEaten: boolean; dinnerEaten: boolean; workoutDone: boolean;
}
export interface WeekPlan { weekStart: string; days: DayPlan[]; warnings: string[]; seed: number }

export interface Requirement { quantity: number; unit: Unit }
export interface ShoppingState {
  owned: string[];
  perWeek: Record<string, { purchased: string[]; removed: string[]; extraMealIds: string[] }>;
}
export interface WeightEntry { id: string; date: string; weight: number; unit: 'lb' | 'kg' }
export type LocationMode = 'none' | 'geo' | 'demo' | 'skip' | 'disabled';
export interface LocationPref { mode: LocationMode; areaId?: string; savedCoords?: { latitude: number; longitude: number } }

export interface AppData {
  version: number;
  onboardingComplete: boolean;
  profile: Profile;
  location: LocationPref;
  plans: Record<string, WeekPlan>;
  favorites: string[];
  shopping: ShoppingState;
  weights: WeightEntry[];
  selectedStoreIds: string[];
}
