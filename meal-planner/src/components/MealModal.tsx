import { useMemo, useState } from 'react';
import type { Meal, MealType } from '../types';
import { Badge, Btn, Modal } from './ui';
import { useApp } from '../state/AppContext';
import { ingredientsById } from '../data/ingredients';
import { aggregate } from '../engine/shoppingListGenerator';
import { compareStores } from '../engine/storeComparison';
import StoreResultCard from './StoreResultCard';
import { money } from '../engine/costCalculator';
import { formatQty } from '../engine/shoppingListGenerator';

interface Props { meal: Meal; slot?: { date: string; type: MealType; eaten: boolean }; onClose: () => void; onSwap?: () => void }

export default function MealModal({ meal, slot, onClose, onSwap }: Props) {
  const { data, userCoords, toggleFavorite, toggleEaten, addExtraMeal } = useApp();
  const [compare, setCompare] = useState(false);
  const [added, setAdded] = useState(false);
  const fav = data.favorites.includes(meal.id);
  const results = useMemo(() => {
    if (!compare) return [];
    const agg = aggregate(meal.ingredients.filter((i) => !i.optional && ingredientsById[i.ingredientId].shoppable !== false).map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit })));
    return compareStores({ basket: [...agg].map(([ingredientId, requirements]) => ({ ingredientId, requirements })), servings: meal.servings, user: userCoords, radiusMiles: data.profile.radiusMiles, preference: data.profile.storePreference });
  }, [compare, meal, userCoords, data.profile.radiusMiles, data.profile.storePreference]);
  const shoppable = meal.ingredients.some((i) => ingredientsById[i.ingredientId].shoppable !== false);
  return (
    <Modal title={meal.name} onClose={onClose} wide>
      <p className="text-sm">{meal.description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {meal.dietaryTags.map((t) => <Badge key={t}>{t}</Badge>)}
        {meal.cuisineTags.map((t) => <Badge key={t}>{t}</Badge>)}
        {meal.preparationTags.map((t) => <Badge key={t}>{t}</Badge>)}
        <Badge tone="demo">Estimated values ({meal.dataStatus})</Badge>
      </div>
      <p className="mt-2 text-sm">Allergens: {meal.allergenTags.length ? meal.allergenTags.join(', ') : 'none listed in the sample data'}. Check real labels before eating.</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-6">
        {[['Calories', `${meal.calories} kcal`], ['Protein', `${meal.protein} g`], ['Carbs', `${meal.carbohydrates} g`], ['Fat', `${meal.fat} g`], ['Fiber', `${meal.fiber} g`], ['Prep', meal.preparationMinutes ? `${meal.preparationMinutes} min` : 'None']].map(([k, v]) => (
          <div key={k} className="rounded-md bg-paper p-2"><dt className="text-ink/70">{k}</dt><dd className="font-semibold">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-2 text-sm">Estimated cost per serving: <b>{money(meal.estimatedCostPerServing)}</b> (sample prices). Values are per serving; recipe makes {meal.servings}.</p>
      <h3 className="mt-4 font-semibold">Ingredients (whole recipe)</h3>
      <ul className="mt-1 list-disc pl-5 text-sm">
        {meal.ingredients.map((i) => <li key={i.ingredientId}>{ingredientsById[i.ingredientId].name}: {formatQty(i)}{i.optional ? ' (optional)' : ''}</li>)}
      </ul>
      <h3 className="mt-4 font-semibold">Preparation</h3>
      <ol className="mt-1 list-decimal pl-5 text-sm">{meal.instructions.map((s, k) => <li key={k}>{s}</li>)}</ol>
      <p className="mt-3 text-sm">Suggested demo store chains: {meal.suggestedStoreChains.length ? meal.suggestedStoreChains.join(', ') : 'none (restaurant item)'}.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {slot && <Btn kind="primary" onClick={() => toggleEaten(slot.date, slot.type)}>{slot.eaten ? 'Unmark as Eaten' : 'Mark as Eaten'}</Btn>}
        <Btn onClick={() => toggleFavorite(meal.id)} aria-pressed={fav}>{fav ? 'Remove Favorite' : 'Favorite'}</Btn>
        {slot && onSwap && <Btn onClick={onSwap} disabled={slot.eaten}>Swap Meal</Btn>}
        {shoppable && <Btn onClick={() => setCompare((c) => !c)}>{compare ? 'Hide Store Comparison' : 'Compare Demo Stores'}</Btn>}
        {shoppable && <Btn onClick={() => { addExtraMeal(meal.id); setAdded(true); }}>Add to Shopping List</Btn>}
      </div>
      {added && <p role="status" className="mt-2 text-sm text-spruce-dark">Added to this week's shopping list.</p>}
      {compare && (
        <div className="mt-4">
          <h3 className="font-semibold">Demo store comparison</h3>
          <p className="mb-2 text-xs text-ink/70">Lowest estimate in the included demo dataset. Not live prices.</p>
          <ul className="space-y-2">{results.map((r) => <StoreResultCard key={r.store.id} r={r} showPerServing servingsLabel={`${meal.servings} serving${meal.servings > 1 ? 's' : ''}`} />)}</ul>
        </div>
      )}
    </Modal>
  );
}
