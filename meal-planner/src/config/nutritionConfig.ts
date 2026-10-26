export const nutritionConfig = {
  activityMultipliers: { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 },
  sexOffset: { male: 5, female: -161, unspecified: -78 },
  /** share of the daily planning target given to each meal */
  mealShare: { lunch: 0.3, dinner: 0.35 },
  targetDeficit: 0.15,
  maxDeficit: 0.2,
  /** minimum planning targets (kcal) */
  floors: { male: 1500, female: 1200, unspecified: 1350 },
  ceilingKcal: 3500,
  supportedAge: { min: 18, max: 90 },
  supportedHeightCm: { min: 120, max: 230 },
  supportedWeightKg: { min: 35, max: 250 },
} as const;
