import type { Profile } from '../types';
import { nutritionConfig as cfg } from '../config/nutritionConfig';

export interface NutritionEstimate {
  isEstimate: true;
  bmr: number; tdee: number; planningTarget: number; lunchTarget: number; dinnerTarget: number;
  warnings: string[];
}
export const NUTRITION_DISCLAIMER = [
  'This application provides general planning estimates only.',
  'Nutritional needs vary by person.',
  'It is not medical advice.',
  'Pregnancy, medical conditions, eating-disorder concerns, and other special circumstances require qualified professional guidance.',
];
export const toKg = (w: number, u: 'lb' | 'kg') => (u === 'lb' ? w * 0.45359237 : w);
export const toCm = (h: number, u: 'in' | 'cm') => (u === 'in' ? h * 2.54 : h);

/** Mifflin-St Jeor resting energy estimate (kcal/day). */
export const mifflinStJeor = (kg: number, cm: number, age: number, sex: Profile['sex']) => 10 * kg + 6.25 * cm - 5 * age + cfg.sexOffset[sex];

export function estimateNutrition(p: Profile): NutritionEstimate {
  const warnings: string[] = [];
  const kg = toKg(p.weight, p.weightUnit), goalKg = toKg(p.goalWeight, p.weightUnit), cm = toCm(p.height, p.heightUnit);
  const unsupported =
    p.age < cfg.supportedAge.min || p.age > cfg.supportedAge.max ||
    cm < cfg.supportedHeightCm.min || cm > cfg.supportedHeightCm.max || kg < cfg.supportedWeightKg.min || kg > cfg.supportedWeightKg.max;
  if (unsupported) warnings.push('Some of your entries fall outside the range these estimates support, so a general maintenance-level target is shown. Please check your details or speak with a qualified professional.');

  const safeAge = Math.min(Math.max(p.age, cfg.supportedAge.min), cfg.supportedAge.max);
  const safeCm = Math.min(Math.max(cm, cfg.supportedHeightCm.min), cfg.supportedHeightCm.max);
  const safeKg = Math.min(Math.max(kg, cfg.supportedWeightKg.min), cfg.supportedWeightKg.max);
  const bmr = mifflinStJeor(safeKg, safeCm, safeAge, p.sex);
  const tdee = bmr * cfg.activityMultipliers[p.activity];

  const bmi = safeKg / (safeCm / 100) ** 2;
  const goalLower = goalKg < kg - 0.5;
  let target = tdee;
  if (goalLower && !unsupported) {
    if (bmi < 18.5) warnings.push('Your current weight is already low for your height, so no calorie reduction is applied. Please consider professional guidance.');
    else target = tdee * (1 - cfg.targetDeficit);
  }
  target = Math.max(target, tdee * (1 - cfg.maxDeficit));
  const floor = cfg.floors[p.sex];
  if (target < floor && tdee >= floor) { target = floor; warnings.push(`The planning target was raised to a general minimum of ${floor} kcal.`); }
  else if (target < floor) { target = tdee; warnings.push('Your estimated energy needs are below the general planning minimum. A maintenance-level estimate is shown; please seek professional guidance.'); }
  target = Math.min(target, cfg.ceilingKcal);

  const r = (n: number) => Math.round(n);
  return {
    isEstimate: true, bmr: r(bmr), tdee: r(tdee), planningTarget: r(target),
    lunchTarget: r(target * cfg.mealShare.lunch), dinnerTarget: r(target * cfg.mealShare.dinner), warnings,
  };
}
