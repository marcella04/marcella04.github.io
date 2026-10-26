import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { BudgetSection, CookingSection, ExerciseSection, LocationSection, NutritionSection, PersonalSection, ShoppingSection } from './ProfileSections';
import { Btn } from './ui';
import { NUTRITION_DISCLAIMER } from '../engine/nutritionCalculator';
import type { Profile } from '../types';

const steps = ['About you', 'Nutrition', 'Budget', 'Cooking', 'Exercise', 'Shopping', 'Location'] as const;

export default function Onboarding() {
  const { data, update, generate } = useApp();
  const [i, setI] = useState(0);
  const set = (patch: Partial<Profile>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  const p = data.profile;
  const valid = [p.age >= 18 && p.height > 0 && p.weight > 0 && p.goalWeight > 0, true, p.maxDailyBudget > 0 && p.maxWeeklyBudget > 0 && p.maxMealCost > 0, p.maxPrepMinutes > 0, p.workoutDays.length > 0 || true, p.radiusMiles > 0, true][i];
  const finish = () => { update((d) => ({ ...d, onboardingComplete: true })); setTimeout(() => generate('full'), 0); };
  return (
    <main className="mx-auto min-h-screen max-w-2xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Set up your weekly plan</h1>
      <p className="mt-1 text-sm">Step {i + 1} of {steps.length}: {steps[i]}. Everything stays in this browser.</p>
      <div className="mt-3 h-2 rounded bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1} aria-label="Setup progress">
        <div className="h-2 rounded bg-spruce" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
      </div>
      <div className="mt-6 rounded-lg border border-line bg-white p-4 sm:p-6">
        {i === 0 && <PersonalSection p={p} set={set} />}
        {i === 1 && <NutritionSection p={p} set={set} />}
        {i === 2 && <BudgetSection p={p} set={set} />}
        {i === 3 && <CookingSection p={p} set={set} />}
        {i === 4 && <ExerciseSection p={p} set={set} />}
        {i === 5 && <ShoppingSection p={p} set={set} />}
        {i === 6 && <LocationSection />}
      </div>
      {i === 0 && <p className="mt-3 text-xs text-ink/70">{NUTRITION_DISCLAIMER.join(' ')}</p>}
      <div className="mt-4 flex justify-between">
        <Btn onClick={() => setI(i - 1)} disabled={i === 0}>Back</Btn>
        {i < steps.length - 1
          ? <Btn kind="primary" onClick={() => setI(i + 1)} disabled={!valid}>Next</Btn>
          : <Btn kind="primary" onClick={finish}>Create my week</Btn>}
      </div>
    </main>
  );
}
