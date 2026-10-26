import type { Level, Profile, Workout } from '../types';
import { workouts, workoutsById } from '../data/workouts';
import { hash } from '../utils/dates';

const rank: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const rotation = ['full body', 'lower body', 'upper body', 'walking/cardio'] as const;
export const isDemanding = (w: Workout | null | undefined) =>
  !!w && !['mobility', 'recovery', 'rest', 'walking/cardio'].includes(w.category) && (w.difficulty !== 'beginner' || w.durationMinutes >= 40);

/** Picks one day's workout from fitness level, equipment, duration, selected days and recent load. Not tied to food intake. */
export function recommendWorkout(p: Profile, dayIndex: number, plannedIds: (string | null)[], seed = 0): Workout {
  const prev = dayIndex > 0 ? workoutsById[plannedIds[dayIndex - 1] ?? ''] : undefined;
  const have = new Set([...p.equipment, 'none']);
  if (!p.workoutDays.includes(dayIndex)) {
    const hard = isDemanding(prev) || (prev && prev.category !== 'rest' && prev.category !== 'mobility' && prev.category !== 'recovery');
    if (hard) return workoutsById[hash(`${seed}|m|${dayIndex}`) > 0.5 ? 'mobility-25' : 'mobility-15'];
    return workoutsById[hash(`${seed}|r|${dayIndex}`) > 0.6 ? 'recovery-walk' : 'rest-day'];
  }
  let allowed = workouts.filter((w) => !['mobility', 'recovery', 'rest'].includes(w.category) && rank[w.difficulty] <= rank[p.fitness] && w.equipment.every((e) => have.has(e)));
  if (!allowed.length) allowed = workouts.filter((w) => w.id === 'walk-brisk-30' || w.id === 'bw-full-beginner');
  if (isDemanding(prev)) allowed = allowed.filter((w) => !isDemanding(w)) || allowed;
  const doneCount = plannedIds.filter((id, i) => i < dayIndex && id && !['rest', 'mobility', 'recovery'].includes(workoutsById[id]?.category)).length;
  const wantCat = rotation[doneCount % rotation.length];
  const inCat = allowed.filter((w) => w.category === wantCat);
  const pool = inCat.length ? inCat : allowed;
  const scored = pool.map((w) => ({ w, s: Math.abs(w.durationMinutes - p.workoutMinutes) + (plannedIds.includes(w.id) ? 15 : 0) + hash(`${seed}|${dayIndex}|${w.id}`) * 4 }));
  return scored.sort((a, b) => a.s - b.s)[0].w;
}
