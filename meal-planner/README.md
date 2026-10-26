# Weekly Meal, Grocery and Workout Planner (Version 1)

A calendar-first, fully static React + TypeScript site that plans lunches, dinners, workouts, groceries and estimated food spending.

**Zero runtime network requests.** All data is bundled. State lives in `localStorage`. Store, price and nutrition data are **sample/estimated demonstration data, not live**.

## Run locally
```bash
npm install
npm run dev          # http://localhost:5173
npm run validate     # tests + type-check + build + static-safety scan
```

## Layout
| Path | Purpose |
|---|---|
| `src/data/` | ingredients, nutrition, meals, workouts, stores, products, demo areas (all local TS) |
| `src/engine/` | pure, tested logic: nutrition, unit conversion, distance, matching, cost, recommendation, planner, shopping list, store comparison |
| `src/config/` | scoring weights and nutrition constants (separate from components) |
| `src/services/storage/storageService.ts` | the only code that touches `localStorage` (versioned, corruption-safe) |
| `src/pages`, `src/components` | UI (hash-routed: `#/plan`, `#/shopping`, `#/progress`, `#/profile`) |

## Data honesty
- Nutrition values are typical reference-style figures labelled `estimated`. Meal macros and costs are derived from them.
- All products are `priceType: "sample"`, generated from one invented price table scaled per store. No `capturedDate` is set.
- Stores are generic demo stores in abstract "Demo Areas". No real addresses. Supported demo ZIPs: `00001`-`00003`.
- To use real data later, replace the files in `src/data/` and set `dataStatus`/`priceType` to `verified-static` only with a documented source.

## Known limitations
- Shopping quantities cover one serving per planned meal; meal-prep batches are not bought as whole batches.
- Package rounding is per ingredient for the week, so weekly checkout totals exceed usage value.
- Split-store shopping is intentionally not modeled.
- Calorie targets are general estimates (Mifflin-St Jeor), clamped to avoid extreme values. Not medical advice.
