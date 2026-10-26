import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { BudgetSection, CookingSection, ExerciseSection, LocationSection, NutritionSection, PersonalSection, ShoppingSection } from '../components/ProfileSections';
import { Btn, Card, ConfirmDialog } from '../components/ui';
import { NUTRITION_DISCLAIMER } from '../engine/nutritionCalculator';
import type { Profile } from '../types';

type Action = 'location' | 'week' | 'progress' | 'all' | null;
const copy: Record<Exclude<Action, null>, { title: string; message: string; label: string }> = {
  location: { title: 'Remove saved location?', message: 'This removes any location setting and saved approximate coordinates from this browser.', label: 'Remove location' },
  week: { title: 'Reset the current week?', message: 'This deletes the plan and shopping status for the week you are viewing.', label: 'Reset week' },
  progress: { title: 'Clear progress?', message: 'This deletes weight history and clears eaten, completed and purchased marks. Plans stay.', label: 'Clear progress' },
  all: { title: 'Clear all application data?', message: 'This deletes your profile, plans, favorites, progress and settings from this browser and restarts setup.', label: 'Clear everything' },
};

export default function ProfilePage() {
  const { data, update, setLocation, setSessionCoords, resetWeek, clearProgress, clearAll } = useApp();
  const [confirm, setConfirm] = useState<Action>(null);
  const set = (patch: Partial<Profile>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  const p = data.profile;
  const run = () => {
    if (confirm === 'location') { setSessionCoords(null); setLocation({ mode: 'none' }); }
    if (confirm === 'week') resetWeek();
    if (confirm === 'progress') clearProgress();
    if (confirm === 'all') clearAll();
    setConfirm(null);
  };
  const sections: [string, JSX.Element][] = [
    ['About you', <PersonalSection p={p} set={set} />], ['Nutrition', <NutritionSection p={p} set={set} />], ['Budget', <BudgetSection p={p} set={set} />],
    ['Cooking', <CookingSection p={p} set={set} />], ['Exercise', <ExerciseSection p={p} set={set} />], ['Shopping', <ShoppingSection p={p} set={set} />],
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="text-sm">Changes save automatically and apply the next time you generate or regenerate a week.</p>
      {sections.map(([t, el]) => <Card key={t}><h2 className="mb-3 text-lg font-semibold">{t}</h2>{el}</Card>)}
      <Card><h2 className="mb-3 text-lg font-semibold">Location</h2><LocationSection /></Card>
      <Card>
        <h2 className="mb-2 text-lg font-semibold">About these estimates</h2>
        <ul className="list-disc pl-5 text-sm">{NUTRITION_DISCLAIMER.map((d) => <li key={d}>{d}</li>)}</ul>
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-semibold">Privacy</h2>
        <p className="mb-3 text-sm">Your data is stored only in this browser using local storage. Nothing is sent anywhere, and there is no analytics, tracking or advertising.</p>
        <div className="flex flex-wrap gap-2">
          <Btn kind="danger" onClick={() => setConfirm('location')}>Remove Saved Location</Btn>
          <Btn kind="danger" onClick={() => setConfirm('week')}>Reset Current Week</Btn>
          <Btn kind="danger" onClick={() => setConfirm('progress')}>Clear Progress</Btn>
          <Btn kind="danger" onClick={() => setConfirm('all')}>Clear All Application Data</Btn>
        </div>
      </Card>
      {confirm && <ConfirmDialog title={copy[confirm].title} message={copy[confirm].message} confirmLabel={copy[confirm].label} onConfirm={run} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
