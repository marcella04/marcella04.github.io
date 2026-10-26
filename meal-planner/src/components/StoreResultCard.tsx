import type { StoreResult } from '../engine/storeComparison';
import { DISTANCE_LABEL, formatMiles } from '../engine/distanceCalculator';
import { money } from '../engine/costCalculator';
import { Badge } from './ui';

export default function StoreResultCard({ r, showPerServing, servingsLabel }: { r: StoreResult; showPerServing?: boolean; servingsLabel?: string }) {
  return (
    <li className={`rounded-lg border p-3 ${r.isRecommended ? 'border-spruce bg-spruce-soft' : 'border-line bg-white'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-semibold">{r.store.name}</h4>
        <Badge tone="demo">Demo store data</Badge>
        <Badge>Sample price</Badge>
        {r.isRecommended && <Badge tone="good">Best match in demo dataset</Badge>}
        {r.outsideRadius && <Badge tone="warn">Outside selected radius</Badge>}
        {!r.recommendable && !r.outsideRadius && <Badge tone="warn">Low pricing coverage</Badge>}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <div><dt className="text-ink/70">Estimated package cost</dt><dd className="font-semibold">{money(r.totalCheckoutCost)}</dd></div>
        <div><dt className="text-ink/70">Estimated usage value</dt><dd className="font-semibold">{money(r.estimatedUsageCost)}</dd></div>
        {showPerServing && <div><dt className="text-ink/70">Estimated meal cost{servingsLabel ? ` (${servingsLabel})` : ''}</dt><dd className="font-semibold">{money(r.mealCostPerServing)}</dd></div>}
        <div><dt className="text-ink/70">{DISTANCE_LABEL}</dt><dd className="font-semibold">{r.distanceMiles === null ? 'Location not set' : formatMiles(r.distanceMiles)}</dd></div>
        <div><dt className="text-ink/70">Pricing coverage</dt><dd className="font-semibold">{r.pricedIngredientCount} of {r.totalIngredientCount} ingredients ({r.coveragePercent}%)</dd></div>
      </dl>
      {r.missingIngredients.length > 0 && <p className="mt-2 text-sm text-berry">No sample price for: {r.missingIngredients.join(', ')}. These are not counted as free.</p>}
      {r.uncertainMatches.length > 0 && <p className="mt-1 text-sm text-berry">Uncertain match, not priced: {r.uncertainMatches.join(', ')}.</p>}
      <p className="mt-2 text-sm">{r.explanation}</p>
      {r.lines.length > 0 && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-spruce">Price breakdown</summary>
          <ul className="mt-1 divide-y divide-line">
            {r.lines.map((l) => (
              <li key={l.ingredientId} className="flex justify-between gap-2 py-1">
                <span>{l.name}: {l.packages} × {l.productName}{l.onSale ? ' (sample sale)' : ''}</span><span>{money(l.checkout)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}
