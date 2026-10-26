/** Weights for ranking demo stores. Plain tuning values, not validated savings models. */
export const storeComparisonWeights = {
  lowest: { cost: 1, distance: 0, coverage: 0.15 },
  closest: { cost: 0.1, distance: 1, coverage: 0.15 },
  best: { cost: 0.5, distance: 0.25, coverage: 0.25 },
} as const;
/** Stores below this share of priced ingredients are never recommended as the top pick. */
export const minCoverageForRecommendation = 0.8;
/** Score penalty (0-1 scale) for stores outside the preferred radius. */
export const outsideRadiusPenalty = 0.3;
export const preferenceLabels = { lowest: 'Lowest Estimated Cost', closest: 'Closest Included Store', best: 'Best Value' } as const;
