import type { Equipment, Exercise, Level, Workout, WorkoutCategory } from '../types';

const ex = (name: string, o: Partial<Exercise> & { instructions: string }): Exercise => ({ name, restSeconds: 30, ...o });
const E = {
  squat: ex('Bodyweight squat', { sets: 3, repetitions: 12, instructions: 'Feet shoulder-width, sit hips back and down, keep chest up, stand tall.', modification: 'Squat to a chair.' }),
  pushup: ex('Push-up', { sets: 3, repetitions: 8, instructions: 'Hands under shoulders, body in a straight line, lower chest then press up.', modification: 'Hands on a counter or knees down.' }),
  glute: ex('Glute bridge', { sets: 3, repetitions: 12, instructions: 'Lie on your back, knees bent, press hips up and squeeze, lower slowly.' }),
  plank: ex('Plank', { sets: 3, durationSeconds: 30, instructions: 'Forearms down, body straight, breathe steadily.', modification: 'Plank on knees or hands on a bench.' }),
  lunge: ex('Reverse lunge', { sets: 3, repetitions: 8, instructions: 'Step back, lower both knees about 90 degrees, push through the front foot.', modification: 'Hold a wall for balance.' }),
  birddog: ex('Bird dog', { sets: 2, repetitions: 8, instructions: 'On hands and knees, extend opposite arm and leg, pause, switch.' }),
  dbRow: ex('Dumbbell row', { sets: 3, repetitions: 10, instructions: 'Hinge forward with a flat back, pull the weight to your ribs, lower slowly.' }),
  dbPress: ex('Dumbbell shoulder press', { sets: 3, repetitions: 10, instructions: 'Press weights overhead without arching your back, lower under control.' }),
  gobletSquat: ex('Goblet squat', { sets: 3, repetitions: 10, instructions: 'Hold one dumbbell at your chest and squat with an upright torso.' }),
  rdl: ex('Dumbbell Romanian deadlift', { sets: 3, repetitions: 10, instructions: 'Soft knees, push hips back with a flat back, stand by squeezing glutes.' }),
  bandRow: ex('Band row', { sets: 3, repetitions: 12, instructions: 'Anchor the band, pull elbows back, squeeze shoulder blades.' }),
  bandPress: ex('Band chest press', { sets: 3, repetitions: 12, instructions: 'Anchor behind you and press forward with control.' }),
  bandSquat: ex('Band squat', { sets: 3, repetitions: 12, instructions: 'Stand on the band, hold the ends at shoulders, squat and stand.' }),
  walk: (m: number, n: string, i: string) => ex(n, { sets: 1, durationSeconds: m * 60, restSeconds: 0, instructions: i }),
  catcow: ex('Cat-cow', { sets: 1, repetitions: 10, instructions: 'Alternate arching and rounding your back slowly with your breathing.', restSeconds: 0 }),
  hip: ex('Hip flexor stretch', { sets: 1, durationSeconds: 40, instructions: 'Half-kneeling, tuck pelvis and lean forward gently. Switch sides.', restSeconds: 10 }),
  ham: ex('Hamstring stretch', { sets: 1, durationSeconds: 40, instructions: 'Heel forward, hinge at hips with a flat back until you feel a mild stretch.', restSeconds: 10 }),
  child: ex('Child pose', { sets: 1, durationSeconds: 45, instructions: 'Sit hips toward heels, reach arms forward, breathe slowly.', restSeconds: 0 }),
  thoracic: ex('Thoracic rotation', { sets: 1, repetitions: 8, instructions: 'On hands and knees, place a hand behind your head and rotate open. Switch sides.', restSeconds: 0 }),
  barbellSquat: ex('Barbell or machine squat', { sets: 4, repetitions: 8, instructions: 'Use a weight you can control with good form; use a spotter or safety bars.', restSeconds: 90 }),
  benchPress: ex('Bench or machine chest press', { sets: 4, repetitions: 8, instructions: 'Keep shoulder blades set and feet planted; lower under control.', restSeconds: 90 }),
  cableRow: ex('Seated cable row', { sets: 3, repetitions: 10, instructions: 'Sit tall, pull handle to your torso, pause, release slowly.', restSeconds: 60 }),
};
const SAFE = ['Stop if you feel sharp pain, dizziness or unusual shortness of breath.', 'Choose a level that feels comfortable and increase gradually.', 'Check with a qualified professional if you have a health condition or injury.'];
const w = (id: string, name: string, category: WorkoutCategory, difficulty: Level, durationMinutes: number, equipment: Equipment[], exercises: Exercise[]): Workout =>
  ({ id, name, category, difficulty, durationMinutes, equipment, exercises, safetyNotes: SAFE });

export const workouts: Workout[] = [
  w('walk-easy-20', 'Easy Walk', 'walking/cardio', 'beginner', 20, ['none'], [E.walk(20, 'Easy-pace walk', 'Walk at a pace where you can hold a conversation.')]),
  w('walk-brisk-30', 'Brisk Walk', 'walking/cardio', 'beginner', 30, ['none'], [E.walk(30, 'Brisk walk', 'Walk briskly; you should be breathing harder but still able to talk.')]),
  w('walk-intervals-45', 'Walk with Pace Intervals', 'walking/cardio', 'intermediate', 45, ['none'], [
    E.walk(5, 'Warm-up walk', 'Easy pace.'), ex('Interval block', { sets: 6, durationSeconds: 150, restSeconds: 0, instructions: 'Alternate 90 seconds brisk and 60 seconds easy.' }), E.walk(10, 'Cool-down walk', 'Slow gradually.')]),
  w('bw-full-beginner', 'Beginner Full Body', 'full body', 'beginner', 30, ['none'], [E.squat, E.pushup, E.glute, E.birddog, E.plank]),
  w('bw-full-circuit', 'Bodyweight Circuit', 'full body', 'intermediate', 40, ['none'], [E.squat, E.pushup, E.lunge, E.glute, E.plank]),
  w('db-full-beginner', 'Dumbbell Full Body', 'full body', 'beginner', 30, ['dumbbells'], [E.gobletSquat, E.dbRow, E.dbPress, E.glute, E.plank]),
  w('db-full-intermediate', 'Dumbbell Full Body Strength', 'full body', 'intermediate', 45, ['dumbbells'], [E.gobletSquat, E.dbRow, E.dbPress, E.rdl, E.lunge, E.plank]),
  w('band-full', 'Resistance Band Full Body', 'full body', 'beginner', 30, ['resistance-bands'], [E.bandSquat, E.bandRow, E.bandPress, E.glute, E.plank]),
  w('upper-bodyweight', 'Upper Body Basics', 'upper body', 'intermediate', 30, ['none'], [E.pushup, E.plank, E.birddog]),
  w('upper-dumbbell', 'Dumbbell Upper Body', 'upper body', 'intermediate', 40, ['dumbbells'], [E.dbRow, E.dbPress, E.pushup, E.plank]),
  w('lower-bodyweight', 'Lower Body Basics', 'lower body', 'beginner', 30, ['none'], [E.squat, E.glute, E.lunge]),
  w('lower-dumbbell', 'Dumbbell Lower Body', 'lower body', 'intermediate', 40, ['dumbbells'], [E.gobletSquat, E.rdl, E.lunge, E.glute]),
  w('gym-full-body', 'Gym Full Body Strength', 'full body', 'advanced', 50, ['gym'], [E.barbellSquat, E.benchPress, E.cableRow, E.rdl, E.plank]),
  w('mobility-15', 'Mobility Reset', 'mobility', 'beginner', 15, ['none'], [E.catcow, E.thoracic, E.hip, E.ham, E.child]),
  w('mobility-25', 'Full Mobility Flow', 'mobility', 'beginner', 25, ['none'], [E.catcow, E.thoracic, E.hip, E.ham, E.child, E.birddog]),
  w('recovery-walk', 'Recovery Walk', 'recovery', 'beginner', 20, ['none'], [E.walk(20, 'Gentle walk', 'Very easy pace with relaxed shoulders.')]),
  { id: 'rest-day', name: 'Rest Day', category: 'rest', difficulty: 'beginner', durationMinutes: 0, equipment: ['none'], exercises: [], safetyNotes: ['Rest is part of a balanced week.'] },
];
export const workoutsById: Record<string, Workout> = Object.fromEntries(workouts.map((x) => [x.id, x]));
