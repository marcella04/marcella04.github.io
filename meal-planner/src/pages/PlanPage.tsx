import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { addDays, currentWeekStart, DAY_NAMES, shortDate, today } from '../utils/dates';
import { mealsById } from '../data/meals';
import { workoutsById } from '../data/workouts';
import { Badge, Btn, Card, Modal, cx } from '../components/ui';
import MealModal from '../components/MealModal';
import WorkoutModal from '../components/WorkoutModal';
import { swapModes } from '../engine/mealRecommendation';
import { money } from '../engine/costCalculator';
import type { DayPlan, MealType } from '../types';
import { NUTRITION_DISCLAIMER } from '../engine/nutritionCalculator';

type Open = { kind: 'meal'; date: string; type: MealType } | { kind: 'swap'; date: string; type: MealType } | { kind: 'workout'; date: string } | null;

export default function PlanPage() {
  const { plan, weekStart, setWeekStart, generate, target, data, swap, toggleEaten, toggleWorkout } = useApp();
  const [open, setOpen] = useState<Open>(null);
  const [swapMsg, setSwapMsg] = useState('');
  const isCurrent = weekStart === currentWeekStart();
  const find = (date: string) => plan?.days.find((d) => d.date === date);

  const MealSlot = ({ day, type }: { day: DayPlan; type: MealType }) => {
    const id = type === 'lunch' ? day.lunchMealId : day.dinnerMealId, eaten = type === 'lunch' ? day.lunchEaten : day.dinnerEaten;
    const m = id ? mealsById[id] : null;
    return (
      <div className={cx('rounded-md border p-3', eaten ? 'border-spruce bg-spruce-soft' : 'border-line bg-white')}>
        <p className="text-sm font-medium text-spruce-dark">{type === 'lunch' ? 'Lunch' : 'Dinner'}{eaten && ' · eaten'}</p>
        {m ? (
          <>
            <p className="font-semibold leading-snug">{m.name}</p>
            <p className="text-sm">{m.calories} kcal · {m.protein} g protein</p>
            <p className="text-sm">Estimated {money(m.estimatedCostPerServing)} per serving{data.favorites.includes(m.id) ? ' · favorite' : ''}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Btn onClick={() => setOpen({ kind: 'meal', date: day.date, type })}>Details</Btn>
              <Btn onClick={() => { setSwapMsg(''); setOpen({ kind: 'swap', date: day.date, type }); }} disabled={eaten}>Swap</Btn>
              <Btn kind="ghost" onClick={() => toggleEaten(day.date, type)}>{eaten ? 'Undo eaten' : 'Mark eaten'}</Btn>
            </div>
          </>
        ) : <p className="text-sm text-berry">No meal fits your safety settings for this slot.</p>}
      </div>
    );
  };

  const openDay = open && find(open.date);
  const openMeal = open && open.kind !== 'workout' && openDay ? mealsById[(open.type === 'lunch' ? openDay.lunchMealId : openDay.dinnerMealId) ?? ''] : null;
  const openWorkout = open?.kind === 'workout' && openDay?.workoutId ? workoutsById[openDay.workoutId] : null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Plan</h1>
          <p className="text-sm">Week of {shortDate(weekStart)} to {shortDate(addDays(weekStart, 6))}</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => setWeekStart(addDays(weekStart, -7))}>Previous Week</Btn>
          <Btn onClick={() => setWeekStart(currentWeekStart())} disabled={isCurrent}>Current Week</Btn>
          <Btn onClick={() => setWeekStart(addDays(weekStart, 7))}>Next Week</Btn>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Btn kind="primary" onClick={() => generate('full')}>Generate My Week</Btn>
        <Btn onClick={() => generate('uncompleted')} disabled={!plan}>Regenerate Uncompleted Items</Btn>
        <Btn onClick={() => { window.location.hash = '#/shopping'; }} disabled={!plan}>Generate Shopping List</Btn>
      </div>

      <Card className="bg-mustard-soft">
        <p className="text-sm"><b>Estimated planning target: about {target.planningTarget} kcal per day</b> (lunch about {target.lunchTarget}, dinner about {target.dinnerTarget}). {NUTRITION_DISCLAIMER.join(' ')}</p>
        {target.warnings.map((w) => <p key={w} className="mt-1 text-sm text-berry">{w}</p>)}
      </Card>

      {plan?.warnings.map((w) => <p key={w} role="alert" className="rounded-md border border-berry bg-[#F6DDE6] p-3 text-sm">{w}</p>)}

      {!plan ? (
        <Card><p className="font-medium">No plan for this week yet.</p><p className="text-sm">Select Generate My Week to create lunches, dinners and workouts.</p></Card>
      ) : (
        <ol className="space-y-3">
          {plan.days.map((day, i) => {
            const w = day.workoutId ? workoutsById[day.workoutId] : null;
            return (
              <li key={day.date} className={cx('rounded-lg border bg-paper p-3', day.date === today() ? 'border-mustard border-2' : 'border-line')}>
                <h2 className="mb-2 font-semibold">{DAY_NAMES[i]} <span className="font-normal text-ink/70">{shortDate(day.date)}</span>{day.date === today() && <> <Badge tone="demo">Today</Badge></>}</h2>
                <div className="grid gap-2 lg:grid-cols-3">
                  <MealSlot day={day} type="lunch" />
                  <MealSlot day={day} type="dinner" />
                  <div className={cx('rounded-md border p-3', day.workoutDone ? 'border-spruce bg-spruce-soft' : 'border-line bg-white')}>
                    <p className="text-sm font-medium text-spruce-dark">Workout{day.workoutDone && ' · complete'}</p>
                    {w && <>
                      <p className="font-semibold leading-snug">{w.name}</p>
                      <p className="text-sm">{w.durationMinutes ? `${w.durationMinutes} minutes` : 'Recovery day'} · {w.category}</p>
                      <div className="mt-2 flex gap-1.5">
                        <Btn onClick={() => setOpen({ kind: 'workout', date: day.date })}>View</Btn>
                        {w.category !== 'rest' && <Btn kind="ghost" onClick={() => toggleWorkout(day.date)}>{day.workoutDone ? 'Undo' : 'Complete'}</Btn>}
                      </div>
                    </>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {open?.kind === 'meal' && openMeal && openDay && (
        <MealModal meal={openMeal} slot={{ date: open.date, type: open.type, eaten: open.type === 'lunch' ? openDay.lunchEaten : openDay.dinnerEaten }}
          onClose={() => setOpen(null)} onSwap={() => { setSwapMsg(''); setOpen({ kind: 'swap', date: open.date, type: open.type }); }} />
      )}
      {open?.kind === 'swap' && openMeal && (
        <Modal title={`Swap ${openMeal.name}`} onClose={() => setOpen(null)}>
          <p className="mb-3 text-sm">Only this meal changes. Your allergies and dietary restrictions always apply.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {swapModes.map((m) => (
              <Btn key={m.id} onClick={() => { const reason = swap(open.date, open.type, m.id); if (reason) setSwapMsg(reason); else setOpen(null); }}>{m.label}</Btn>
            ))}
          </div>
          {swapMsg && <p role="alert" className="mt-3 text-sm text-berry">{swapMsg}</p>}
        </Modal>
      )}
      {openWorkout && open?.kind === 'workout' && openDay && (
        <WorkoutModal workout={openWorkout} done={openDay.workoutDone} onToggle={() => toggleWorkout(open.date)} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
