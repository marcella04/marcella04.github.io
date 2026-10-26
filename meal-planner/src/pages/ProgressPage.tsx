import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { Btn, Card, NumberField, Field } from '../components/ui';
import { today, shortDate } from '../utils/dates';
import { mealsById } from '../data/meals';
import { workoutsById } from '../data/workouts';
import { buildShoppingList, checkoutItems } from '../engine/shoppingListGenerator';
import { compareStores } from '../engine/storeComparison';
import { money } from '../engine/costCalculator';
import type { WeekPlan } from '../types';

const toUnit = (w: number, from: 'lb' | 'kg', to: 'lb' | 'kg') => (from === to ? w : from === 'lb' ? w * 0.45359237 : w / 0.45359237);

export default function ProgressPage() {
  const { data, userCoords, saveWeight, deleteWeight } = useApp();
  const unit = data.profile.weightUnit;
  const [form, setForm] = useState<{ id?: string; date: string; weight: number }>({ date: today(), weight: data.profile.weight });

  const stats = useMemo(() => Object.values(data.plans).sort((a, b) => b.weekStart.localeCompare(a.weekStart)).map((p: WeekPlan) => {
    const meals = p.days.flatMap((d) => [[d.lunchMealId, d.lunchEaten], [d.dinnerMealId, d.dinnerEaten]] as const).filter(([id]) => id);
    const workouts = p.days.filter((d) => d.workoutId && workoutsById[d.workoutId].category !== 'rest');
    const planned = meals.length + workouts.length;
    const done = meals.filter(([, e]) => e).length + workouts.filter((d) => d.workoutDone).length;
    const spent = meals.filter(([, e]) => e).reduce((s, [id]) => s + mealsById[id!].estimatedCostPerServing, 0);
    const items = buildShoppingList(p, data.shopping);
    const active = items.filter((i) => i.status !== 'removed');
    const listDone = active.filter((i) => i.status === 'purchased' || i.status === 'owned').length;
    const basket = checkoutItems(items).map((i) => ({ ingredientId: i.ingredientId, requirements: i.requirements }));
    const ok = basket.length ? compareStores({ basket, servings: Math.max(1, meals.length), user: userCoords, radiusMiles: data.profile.radiusMiles, preference: data.profile.storePreference }).filter((r) => r.recommendable || r.coveragePercent >= 80) : [];
    const saving = ok.length > 1 ? Math.max(...ok.map((r) => r.totalCheckoutCost)) - Math.min(...ok.map((r) => r.totalCheckoutCost)) : 0;
    return { p, adherence: planned ? Math.round((done / planned) * 100) : 0, done, planned, spent, listPct: active.length ? Math.round((listDone / active.length) * 100) : 0, saving };
  }), [data.plans, data.shopping, userCoords, data.profile.radiusMiles, data.profile.storePreference]);

  const totals = stats.reduce((t, s) => ({ done: t.done + s.done, spent: t.spent + s.spent, saving: t.saving + s.saving }), { done: 0, spent: 0, saving: 0 });
  const series = data.weights.map((w) => ({ ...w, v: toUnit(w.weight, w.unit, unit) }));
  const lo = Math.min(...series.map((s) => s.v)) - 1, hi = Math.max(...series.map((s) => s.v)) + 1;
  const pts = series.map((s, i) => [series.length === 1 ? 150 : 20 + (i / (series.length - 1)) * 260, 100 - ((s.v - lo) / (hi - lo || 1)) * 80] as const);

  const save = () => { if (!Number.isFinite(form.weight) || form.weight <= 0) return; saveWeight({ id: form.id, date: form.date, weight: form.weight, unit }); setForm({ date: today(), weight: form.weight }); };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Progress</h1>
      <Card>
        <h2 className="mb-3 font-semibold">Weight history</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Date"><input type="date" className="rounded-md border border-line px-2 py-1.5 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <div className="w-32"><NumberField label={`Weight (${unit})`} value={form.weight} step={0.1} onChange={(weight) => setForm({ ...form, weight })} /></div>
          <Btn kind="primary" onClick={save}>{form.id ? 'Save changes' : 'Add weight'}</Btn>
          {form.id && <Btn onClick={() => setForm({ date: today(), weight: data.profile.weight })}>Cancel edit</Btn>}
        </div>
        {series.length === 0 ? <p className="mt-3 text-sm">No weights yet. Add your first entry above.</p> : (
          <>
            <svg viewBox="0 0 300 120" role="img" aria-label={`Weight trend from ${series[0].v.toFixed(1)} to ${series[series.length - 1].v.toFixed(1)} ${unit}`} className="mt-3 h-36 w-full max-w-lg rounded bg-paper">
              <polyline fill="none" stroke="#1F6F5C" strokeWidth="2" points={pts.map((p) => p.join(',')).join(' ')} />
              {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#E0A526" />)}
            </svg>
            <ul className="mt-2 divide-y divide-line text-sm">
              {[...data.weights].reverse().map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span>{shortDate(w.date)}: {w.weight} {w.unit}</span>
                  <span className="flex gap-1"><Btn kind="ghost" onClick={() => setForm({ id: w.id, date: w.date, weight: toUnit(w.weight, w.unit, unit) })}>Edit</Btn><Btn kind="ghost" onClick={() => deleteWeight(w.id)}>Delete</Btn></span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Totals</h2>
        <p className="text-sm">{totals.done} meals and workouts completed · estimated food spending on eaten meals {money(totals.spent)}</p>
        <p className="text-sm">Estimated saving across weeks: {money(totals.saving)}. Estimated saving based on the included static demo dataset (gap between highest and lowest estimates among demo stores with good coverage).</p>
      </Card>

      <section aria-labelledby="weekly" className="space-y-2">
        <h2 id="weekly" className="font-semibold">Weekly adherence</h2>
        {stats.length === 0 && <p className="text-sm">Generate a plan on My Plan to start tracking.</p>}
        {stats.map((s) => (
          <Card key={s.p.weekStart}>
            <div className="flex justify-between text-sm"><b>Week of {shortDate(s.p.weekStart)}</b><span>{s.adherence}% ({s.done} of {s.planned})</span></div>
            <div className="my-2 h-2 rounded bg-line" role="progressbar" aria-label={`Adherence for week of ${shortDate(s.p.weekStart)}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.adherence}><div className="h-2 rounded bg-spruce" style={{ width: `${s.adherence}%` }} /></div>
            <p className="text-sm">Estimated spending on eaten meals {money(s.spent)} · shopping list {s.listPct}% complete · estimated demo-data saving {money(s.saving)}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
