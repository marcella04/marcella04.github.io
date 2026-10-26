import { useEffect, useState } from 'react';
import { useApp } from './state/AppContext';
import Onboarding from './components/Onboarding';
import PlanPage from './pages/PlanPage';
import ShoppingPage from './pages/ShoppingPage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import { Icon, cx } from './components/ui';

const routes = [
  { id: 'plan', label: 'My Plan', icon: 'plan' }, { id: 'shopping', label: 'Shopping', icon: 'shop' },
  { id: 'progress', label: 'Progress', icon: 'progress' }, { id: 'profile', label: 'Profile', icon: 'profile' },
] as const;
type RouteId = (typeof routes)[number]['id'];
const parse = (): RouteId => { const h = window.location.hash.replace(/^#\/?/, ''); return (routes.find((r) => r.id === h)?.id ?? 'plan'); };
export const NOTICE = 'Version 1 uses static demonstration data. Store information, prices, nutrition values, and availability are not live and should be verified before purchasing.';

export default function App() {
  const { data, recovered } = useApp();
  const [route, setRoute] = useState<RouteId>(parse());
  useEffect(() => { const f = () => { setRoute(parse()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);

  if (!data.onboardingComplete) return <><Notice /><Onboarding /></>;
  const Page = { plan: PlanPage, shopping: ShoppingPage, progress: ProgressPage, profile: ProfilePage }[route];
  return (
    <div className="min-h-screen md:flex">
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white md:static md:inset-auto md:min-h-screen md:w-52 md:flex-col md:gap-1 md:border-r md:border-t-0 md:bg-spruce md:p-3">
        <p className="hidden px-3 py-4 text-lg font-semibold text-white md:block">Weekly Planner</p>
        {routes.map((r) => (
          <a key={r.id} href={`#/${r.id}`} aria-current={route === r.id ? 'page' : undefined}
            className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium md:flex-none md:flex-row md:gap-3 md:rounded-md md:px-3 md:py-2 md:text-sm',
              route === r.id ? 'text-spruce md:bg-white md:text-spruce' : 'text-ink/70 hover:text-spruce md:text-white/90 md:hover:bg-spruce-dark md:hover:text-white')}>
            <Icon name={r.icon} />{r.label}
          </a>
        ))}
      </nav>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <Notice />
        <main className="mx-auto max-w-5xl p-4 md:p-6">
          {recovered && <p role="alert" className="mb-3 rounded-md border border-berry bg-[#F6DDE6] p-3 text-sm">Saved data could not be read, so defaults were restored.</p>}
          <Page />
        </main>
      </div>
    </div>
  );
}
function Notice() { return <p role="note" className="bg-mustard-soft px-4 py-2 text-center text-xs text-ink">{NOTICE}</p>; }
