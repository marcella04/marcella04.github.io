import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export const cx = (...a: (string | false | undefined | null)[]) => a.filter(Boolean).join(' ');

export function Btn({ kind = 'default', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'default' | 'primary' | 'ghost' | 'danger' }) {
  const k = {
    default: 'border border-line bg-white text-ink hover:bg-spruce-soft',
    primary: 'bg-spruce text-white hover:bg-spruce-dark border border-spruce',
    ghost: 'text-spruce hover:bg-spruce-soft border border-transparent',
    danger: 'border border-berry bg-white text-berry hover:bg-berry hover:text-white',
  }[kind];
  return <button type="button" {...p} className={cx('rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', k, className)} />;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'demo' | 'good' | 'warn' }) {
  const t = { neutral: 'bg-spruce-soft text-spruce-dark', demo: 'bg-mustard-soft text-[#7A5600] border border-mustard', good: 'bg-spruce text-white', warn: 'bg-[#F6DDE6] text-berry' }[tone];
  return <span className={cx('inline-block rounded px-1.5 py-0.5 text-xs font-medium', t)}>{children}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; prev?.focus?.(); };
  }, []);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab' || !ref.current) return;
    const f = [...ref.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.hasAttribute('disabled'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={onKey}
        className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Btn kind="ghost" onClick={onClose} aria-label="Close dialog">Close</Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="mb-4 text-sm">{message}</p>
      <div className="flex justify-end gap-2"><Btn onClick={onCancel}>Cancel</Btn><Btn kind="danger" onClick={onConfirm}>{confirmLabel}</Btn></div>
    </Modal>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/70">{hint}</span>}
    </label>
  );
}
const input = 'w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm';
export function NumberField({ label, value, onChange, min, max, step = 1, hint }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; hint?: string }) {
  return <Field label={label} hint={hint}><input type="number" className={input} value={Number.isFinite(value) ? value : ''} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} /></Field>;
}
export function SelectField<T extends string>({ label, value, onChange, options, hint }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: string }) {
  return <Field label={label} hint={hint}><select className={input} value={value} onChange={(e) => onChange(e.target.value as T)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>;
}
export function TextField({ label, value, onChange, hint, placeholder }: { label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string }) {
  return <Field label={label} hint={hint}><input type="text" className={input} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></Field>;
}
export function Chips<T extends string | number>({ legend, options, selected, onToggle }: { legend: string; options: { value: T; label: string }[]; selected: T[]; onToggle: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button type="button" key={String(o.value)} aria-pressed={on} onClick={() => onToggle(o.value)}
              className={cx('rounded-full border px-3 py-1 text-sm', on ? 'border-spruce bg-spruce text-white' : 'border-line bg-white hover:bg-spruce-soft')}>{o.label}</button>
          );
        })}
      </div>
    </fieldset>
  );
}
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1F6F5C]" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
export const Card = ({ children, className }: { children: ReactNode; className?: string }) => <section className={cx('rounded-lg border border-line bg-white p-4', className)}>{children}</section>;

export function Icon({ name }: { name: 'plan' | 'shop' | 'progress' | 'profile' }) {
  const p = {
    plan: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    shop: <><path d="M5 7h14l-1.5 11a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8L5 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
    progress: <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  }[name];
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p}</svg>;
}
