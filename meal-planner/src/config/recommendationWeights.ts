/**
 * Scoring weights for ranking meals that already passed all mandatory filters.
 * These are tuning values chosen for reasonable variety. They are NOT medically validated.
 */
export const recommendationWeights = {
  calorieFit: 3,
  proteinFit: 2,
  budgetFit: 2,
  prepConvenience: 1.5,
  cuisine: 1,
  variety: 3,
  priceCoverage: 1,
  mealPrepBonus: 1,
  preparedBonus: 1.5,
  dislikePenalty: 6,
  jitter: 0.4,
} as const;

export const calorieBand = { lunchDinner: 0.3, swap: 0.4 } as const;
export const labels: Record<string, string> = {
  calorieFit: 'Calorie target fit', proteinFit: 'Protein fit', budgetFit: 'Budget fit', prepConvenience: 'Preparation time',
  cuisine: 'Preferred cuisine', variety: 'Variety this week', priceCoverage: 'Demo price coverage', mealPrepBonus: 'Meal prep interest',
  preparedBonus: 'Prepared-food preference', dislikePenalty: 'Disliked food',
};
