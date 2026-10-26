import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { buildShoppingList, checkoutItems, formatQty, type ShoppingItem } from '../engine/shoppingListGenerator';
import { compareStores, sortResults, type SortKey } from '../engine/storeComparison';
import { mealsById } from '../data/meals';
import StoreResultCard from '../components/StoreResultCard';
import { Badge, Btn, Card, cx } from '../components/ui';
import { preferenceLabels } from '../config/storeComparisonWeights';
import { shortDate, addDays } from '../utils/dates';
import { money } from '../engine/costCalculator';

export default function ShoppingPage() {
  const { plan, data, weekStart, userCoords, update, toggleOwned, togglePurchased, removeItem, restoreItem } = useApp();
  const [sort, setSort] = useState<SortKey>('best');
  const items = useMemo(() => buildShoppingList(plan, data.shopping), [plan, data.shopping]);
  const basket = useMemo(() => checkoutItems(items).map((i) => ({ ingredientId: i.ingredientId, requirements: i.requirements })), [items]);
  const servings = useMemo(() => {
    const extra = data.shopping.perWeek[weekStart]?.extraMealIds ?? [];
    return Math.max(1, (plan?.days.flatMap((d) => [d.lunchMealId, d.dinnerMealId]).filter((id) => id && mealsById[id].mealType) .length ?? 0) + extra.length);
  }, [plan, data.shopping, weekStart]);
  const results = useMemo(() => sortResults(compareStores({ basket, servings, user: userCoords, radiusMiles: data.profile.radiusMiles, preference: data.profile.storePreference }), sort),
    [basket, servings, userCoords, data.profile.radiusMiles, data.profile.storePreference, sort]);

  const active = items.filter((i) => i.status !== 'removed');
  const done = active.filter((i) => i.status === 'purchased' || i.status === 'owned').length;
  const removed = items.filter((i) => i.status === 'removed');
  const cats = [...new Set(active.map((i) => i.category))];
  const hasLoc = !!userCoords;

  const Row = ({ i }: { i: ShoppingItem }) => (
    <li className={cx('flex flex-wrap items-center gap-x-3 gap-y-1 py-2', i.status === 'owned' && 'opacity-70')}>
      <label className="flex min-w-0 flex-1 items-start gap-2">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#1F6F5C]" checked={i.status === 'purchased'} disabled={i.status === 'owned'} onChange={() => togglePurchased(i.ingredientId)} />
        <span>
          <span className={cx('font-medium', i.status === 'purchased' && 'line-through')}>{i.name}</span>
          <span className="block text-sm">{i.requirements.map(formatQty).join(' + ')} required</span>
          <span className="block text-xs text-ink/70">For: {i.fromMeals.join(', ')}</span>
        </span>
      </label>
      {i.status === 'owned' && <Badge>Already owned</Badge>}
      <Btn kind="ghost" onClick={() => toggleOwned(i.ingredientId)}>{i.status === 'owned' ? 'I need to buy it' : 'I already have it'}</Btn>
      <Btn kind="ghost" onClick={() => removeItem(i.ingredientId)}>Remove</Btn>
    </li>
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Shopping</h1>
        <p className="text-sm">Week of {shortDate(weekStart)} to {shortDate(addDays(weekStart, 6))}. Quantities cover one serving per planned meal. Items you already own are left out of cost estimates.</p>
      </header>
      {!plan || !items.length ? (
        <Card><p className="font-medium">No shopping list yet.</p><p className="text-sm">Generate a week on My Plan, or add a meal to the list from its details.</p></Card>
      ) : (
        <>
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Your list</h2><p className="text-sm" aria-live="polite">{done} of {active.length} done</p></div>
            <div className="mb-3 h-2 rounded bg-line" role="progressbar" aria-label="Shopping list completion" aria-valuemin={0} aria-valuemax={active.length} aria-valuenow={done}><div className="h-2 rounded bg-spruce" style={{ width: `${active.length ? (done / active.length) * 100 : 0}%` }} /></div>
            {cats.map((c) => (
              <div key={c} className="mb-2"><h3 className="text-sm font-semibold capitalize text-spruce-dark">{c}</h3>
                <ul className="divide-y divide-line">{active.filter((i) => i.category === c).map((i) => <Row key={i.ingredientId} i={i} />)}</ul></div>
            ))}
            {removed.length > 0 && (
              <details className="mt-3 text-sm"><summary className="cursor-pointer text-spruce">Removed items ({removed.length})</summary>
                <ul className="mt-1">{removed.map((i) => <li key={i.ingredientId} className="flex items-center justify-between py-1"><span>{i.name}</span><Btn kind="ghost" onClick={() => restoreItem(i.ingredientId)}>Restore</Btn></li>)}</ul></details>
            )}
          </Card>

          <section aria-labelledby="weekly-est" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><h2 id="weekly-est" className="text-lg font-semibold">Weekly grocery estimate</h2><Badge tone="demo">Demo store data</Badge></div>
            <p className="text-sm">Compared across the included demo stores only. Shopping at one store is assumed. Lowest estimate in the included demo dataset, not a live price.</p>
            {!hasLoc && <p className="rounded-md bg-mustard-soft p-3 text-sm">No location is set, so distances are hidden and stores are compared on price and coverage only. Set a demo area on Profile to see approximate straight-line distances.</p>}
            <div className="flex flex-wrap gap-4">
              <label className="text-sm"><span className="mr-2 font-medium">Sort by</span>
                <select className="rounded-md border border-line bg-white px-2 py-1" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  <option value="best">Best Value</option><option value="cost">Estimated Checkout Cost</option><option value="distance" disabled={!hasLoc}>Approximate Distance</option><option value="coverage">Pricing Coverage</option>
                </select></label>
              <label className="text-sm"><span className="mr-2 font-medium">Preference</span>
                <select className="rounded-md border border-line bg-white px-2 py-1" value={data.profile.storePreference}
                  onChange={(e) => update((d) => ({ ...d, profile: { ...d.profile, storePreference: e.target.value as typeof d.profile.storePreference } }))}>
                  {Object.entries(preferenceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></label>
            </div>
            {basket.length === 0 ? <p className="text-sm">Every item is owned or removed, so there is nothing to price.</p> : (
              <ul className="space-y-2">{results.map((r) => <StoreResultCard key={r.store.id} r={r} showPerServing servingsLabel={`${servings} meals`} />)}</ul>
            )}
            {results[0] && basket.length > 0 && (() => {
              const ok = results.filter((r) => r.recommendable);
              if (ok.length < 2) return null;
              const lo = Math.min(...ok.map((r) => r.totalCheckoutCost)), hi = Math.max(...ok.map((r) => r.totalCheckoutCost));
              return <p className="text-sm">Among stores with good price coverage, estimates range from {money(lo)} to {money(hi)}. Splitting purchases across stores is not modeled because small estimated differences rarely justify extra trips.</p>;
            })()}
          </section>
        </>
      )}
    </div>
  );
}
