import { useState, type ReactNode } from 'react';
import type { Allergen, Equipment, Profile } from '../types';
import { Badge, Btn, Check, Chips, NumberField, SelectField, TextField, cx } from './ui';
import { useApp } from '../state/AppContext';
import { demoAreas, zipLookup, UNSUPPORTED_ZIP_MESSAGE } from '../data/areas';
import { estimateNutrition } from '../engine/nutritionCalculator';

type P = { p: Profile; set: (patch: Partial<Profile>) => void };
const tg = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const Grid = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

export function PersonalSection({ p, set }: P) {
  const est = estimateNutrition(p);
  return (
    <div className="space-y-4">
      <Grid>
        <NumberField label="Age" value={p.age} min={18} max={90} onChange={(age) => set({ age })} hint="Planning estimates support ages 18 to 90." />
        <SelectField label="Sex (used only for calorie estimates)" value={p.sex} onChange={(sex) => set({ sex })} options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'unspecified', label: 'Prefer not to say' }]} />
        <NumberField label="Height" value={p.height} onChange={(height) => set({ height })} />
        <SelectField label="Height unit" value={p.heightUnit} onChange={(heightUnit) => set({ heightUnit })} options={[{ value: 'in', label: 'Inches' }, { value: 'cm', label: 'Centimeters' }]} />
        <NumberField label="Current weight" value={p.weight} onChange={(weight) => set({ weight })} />
        <NumberField label="Goal weight" value={p.goalWeight} onChange={(goalWeight) => set({ goalWeight })} />
        <SelectField label="Weight unit" value={p.weightUnit} onChange={(weightUnit) => set({ weightUnit })} options={[{ value: 'lb', label: 'Pounds' }, { value: 'kg', label: 'Kilograms' }]} />
        <SelectField label="Activity level" value={p.activity} onChange={(activity) => set({ activity })} options={[
          { value: 'sedentary', label: 'Mostly seated' }, { value: 'light', label: 'Light activity' }, { value: 'moderate', label: 'Moderately active' }, { value: 'active', label: 'Very active' }]} />
      </Grid>
      <div className="rounded-md bg-mustard-soft p-3 text-sm" aria-live="polite">
        <p className="font-medium">Estimated planning target: about {est.planningTarget} kcal per day</p>
        <p>Resting estimate {est.bmr} kcal, estimated daily needs {est.tdee} kcal. These are general estimates, not medical advice.</p>
        {est.warnings.map((w) => <p key={w} className="mt-1 text-berry">{w}</p>)}
      </div>
    </div>
  );
}

const allergens: Allergen[] = ['peanut', 'tree-nut', 'dairy', 'egg', 'gluten', 'soy', 'fish', 'shellfish', 'sesame'];
export function NutritionSection({ p, set }: P) {
  return (
    <div className="space-y-4">
      <SelectField label="Dietary preference" value={p.dietPreference} onChange={(dietPreference) => set({ dietPreference })} options={[
        { value: 'omnivore', label: 'No preference' }, { value: 'pescatarian', label: 'Pescatarian' }, { value: 'vegetarian', label: 'Vegetarian' }, { value: 'vegan', label: 'Vegan' }]} />
      <Chips legend="Allergies (always excluded)" options={allergens.map((a) => ({ value: a, label: a }))} selected={p.allergies} onToggle={(a) => set({ allergies: tg(p.allergies, a) })} />
      <Chips legend="Hard dietary restrictions (always enforced)" options={[{ value: 'gluten-free', label: 'Gluten-free' }, { value: 'dairy-free', label: 'Dairy-free' }]} selected={p.restrictions} onToggle={(r) => set({ restrictions: tg(p.restrictions, r) })} />
      <TextField label="Disliked foods" value={p.dislikes} onChange={(dislikes) => set({ dislikes })} placeholder="e.g. tofu, onion" hint="Separate with commas. Meals with these are ranked far lower." />
      <Chips legend="Preferred cuisines" options={['American', 'Mexican', 'Mediterranean', 'Asian', 'Italian'].map((c) => ({ value: c, label: c }))} selected={p.cuisines} onToggle={(c) => set({ cuisines: tg(p.cuisines, c) })} />
      <Check label="Prefer high-protein meals" checked={p.highProtein} onChange={(highProtein) => set({ highProtein })} />
      <p className="text-xs text-ink/70">Allergen and diet labels in this demo dataset are sample data. Always read real ingredient labels.</p>
    </div>
  );
}
export function BudgetSection({ p, set }: P) {
  return (
    <Grid>
      <NumberField label="Maximum daily meal budget ($)" value={p.maxDailyBudget} min={1} onChange={(maxDailyBudget) => set({ maxDailyBudget })} />
      <NumberField label="Maximum weekly grocery budget ($)" value={p.maxWeeklyBudget} min={1} onChange={(maxWeeklyBudget) => set({ maxWeeklyBudget })} />
      <NumberField label="Maximum cost per meal ($)" value={p.maxMealCost} min={1} onChange={(maxMealCost) => set({ maxMealCost })} />
    </Grid>
  );
}
export function CookingSection({ p, set }: P) {
  return (
    <div className="space-y-4">
      <SelectField label="Cooking preference" value={p.cooking} onChange={(cooking) => set({ cooking })} options={[
        { value: 'any', label: 'Happy to cook' }, { value: 'minimal', label: 'Minimal cooking (20 minutes or less)' }, { value: 'prepared', label: 'Prefer prepared foods' }]} />
      <NumberField label="Maximum preparation time (minutes)" value={p.maxPrepMinutes} min={5} max={120} onChange={(maxPrepMinutes) => set({ maxPrepMinutes })} />
      <Check label="Interested in meal prep" checked={p.mealPrep} onChange={(mealPrep) => set({ mealPrep })} />
      <Check label="No-cook meals only" checked={p.noCook} onChange={(noCook) => set({ noCook })} />
    </div>
  );
}
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function ExerciseSection({ p, set }: P) {
  const eq: { value: Equipment; label: string }[] = [{ value: 'none', label: 'No equipment' }, { value: 'dumbbells', label: 'Dumbbells' }, { value: 'resistance-bands', label: 'Resistance bands' }, { value: 'gym', label: 'Gym access' }];
  return (
    <div className="space-y-4">
      <SelectField label="Fitness level" value={p.fitness} onChange={(fitness) => set({ fitness })} options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]} />
      <Chips legend="Available equipment" options={eq} selected={p.equipment} onToggle={(e) => set({ equipment: tg(p.equipment, e) })} />
      <SelectField label="Preferred workout duration" value={String(p.workoutMinutes)} onChange={(v) => set({ workoutMinutes: Number(v) })} options={[20, 30, 45, 60].map((m) => ({ value: String(m), label: `${m} minutes` }))} />
      <Chips legend="Preferred workout days" options={days.map((d, i) => ({ value: i, label: d }))} selected={p.workoutDays} onToggle={(i) => set({ workoutDays: tg(p.workoutDays, i).sort() })} />
      <p className="text-xs text-ink/70">Workouts are planned for fitness and balance. They are not tied to what you eat.</p>
    </div>
  );
}
export function ShoppingSection({ p, set }: P) {
  return (
    <div className="space-y-4">
      <NumberField label="Preferred search radius (miles)" value={p.radiusMiles} min={1} max={50} onChange={(radiusMiles) => set({ radiusMiles })} />
      <SelectField label="Store ranking preference" value={p.storePreference} onChange={(storePreference) => set({ storePreference })} options={[
        { value: 'lowest', label: 'Lowest Price' }, { value: 'closest', label: 'Closest Store' }, { value: 'best', label: 'Best Value' }]} />
    </div>
  );
}

export function LocationSection() {
  const { data, setLocation, userCoords, setSessionCoords } = useApp();
  const loc = data.location;
  const [msg, setMsg] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [explained, setExplained] = useState(false);
  const [save, setSave] = useState(false);
  const [zip, setZip] = useState('');

  const request = () => {
    if (!('geolocation' in navigator)) { setMsg({ tone: 'error', text: 'This browser does not support location. Select a demo area instead.' }); return; }
    setAsking(true); setMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAsking(false);
        const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setSessionCoords(c);
        setLocation({ mode: 'geo', ...(save ? { savedCoords: { latitude: Math.round(c.latitude * 100) / 100, longitude: Math.round(c.longitude * 100) / 100 } } : {}) });
        setMsg({ tone: 'info', text: pos.coords.accuracy > 5000 ? 'Location set, but the position looks inaccurate. Distances to the demo stores may be unreliable.' : 'Location set for this session.' });
      },
      (err) => {
        setAsking(false);
        const t = err.code === err.PERMISSION_DENIED ? 'Permission was denied. You can still use the planner, or select a demo area.'
          : err.code === err.POSITION_UNAVAILABLE ? 'Your position is unavailable right now. Try again or select a demo area.'
          : err.code === err.TIMEOUT ? 'Finding your location timed out. Try again or select a demo area.' : 'Location could not be read. Select a demo area instead.';
        setMsg({ tone: 'error', text: t });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };
  const applyZip = () => {
    const a = zipLookup[zip.trim()];
    if (!a) { setMsg({ tone: 'error', text: UNSUPPORTED_ZIP_MESSAGE }); return; }
    setLocation({ mode: 'demo', areaId: a }); setMsg({ tone: 'info', text: `Using the ${demoAreas.find((d) => d.id === a)!.name}.` });
  };
  const status = loc.mode === 'geo' ? (userCoords ? 'Using your browser location (not shown).' : 'Saved location is not active this session.') : loc.mode === 'demo' ? `Demo area: ${demoAreas.find((d) => d.id === loc.areaId)?.name ?? 'none'}` : loc.mode === 'disabled' ? 'Local recommendations are off.' : loc.mode === 'skip' ? 'Location skipped.' : 'No location chosen.';
  return (
    <div className="space-y-4">
      <p className="text-sm">Location is optional. Meal planning works without it. Store data here is a <Badge tone="demo">Demo store data</Badge> set, not real stores.</p>
      <p className="rounded-md bg-spruce-soft p-3 text-sm font-medium" aria-live="polite">{status}</p>
      <div className="space-y-2 rounded-md border border-line p-3">
        <p className="text-sm">Your approximate location is used to compare your distance from stores included in this demo dataset. The application does not continuously track you or send your location to a server.</p>
        {!explained ? <Btn onClick={() => setExplained(true)}>Use My Location</Btn> : (
          <div className="space-y-2">
            <Check label="Remember my approximate location in this browser" checked={save} onChange={setSave} />
            <Btn kind="primary" onClick={request} disabled={asking}>{asking ? 'Finding location…' : 'Continue and ask my browser'}</Btn>
          </div>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {demoAreas.map((a) => (
          <button key={a.id} type="button" aria-pressed={loc.mode === 'demo' && loc.areaId === a.id} onClick={() => { setLocation({ mode: 'demo', areaId: a.id }); setMsg(null); }}
            className={cx('rounded-md border p-3 text-left text-sm', loc.mode === 'demo' && loc.areaId === a.id ? 'border-spruce bg-spruce-soft' : 'border-line bg-white hover:bg-spruce-soft')}>
            <span className="block font-medium">Select Demo Area</span>{a.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-40"><TextField label="Demo ZIP code" value={zip} onChange={setZip} placeholder="00001" hint="Only demo ZIPs 00001 to 00003 work." /></div>
        <Btn onClick={applyZip}>Look up</Btn>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => { setSessionCoords(null); setLocation({ mode: 'skip' }); setMsg({ tone: 'info', text: 'Location skipped.' }); }}>Skip Location</Btn>
        <Btn onClick={() => { setSessionCoords(null); setLocation({ mode: 'disabled' }); setMsg({ tone: 'info', text: 'Local recommendations disabled.' }); }}>Disable Local Recommendations</Btn>
        <Btn kind="danger" onClick={() => { setSessionCoords(null); setLocation({ mode: 'none' }); setMsg({ tone: 'info', text: 'Location removed.' }); }}>Remove Location</Btn>
      </div>
      {msg && <p role={msg.tone === 'error' ? 'alert' : 'status'} className={cx('text-sm', msg.tone === 'error' ? 'text-berry' : 'text-spruce-dark')}>{msg.text}</p>}
    </div>
  );
}
