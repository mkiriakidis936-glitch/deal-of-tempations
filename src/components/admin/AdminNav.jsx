import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Desktop: κάθετο μενού
export default function AdminNav({ groups, active, onChange }) {
  return (
    <nav className="space-y-3">
      {groups.map((group) => (
        <div key={group.id}>
          <div className="font-heading text-[10px] tracking-[0.18em] text-primary/80 px-2 mb-1">
            {group.label}
          </div>
          <div className="flex flex-col gap-1">
            {group.tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={cn(
                  'text-left px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all',
                  active === t.id
                    ? 'bg-primary text-tarot-dark border-primary'
                    : 'bg-card border-border/40 hover:bg-secondary'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// Κινητό (iPhone): οριζόντια μπάρα που σκρολάρει, κολλημένη στην κορυφή
export function AdminTabBar({ groups, active, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    const container = ref.current;
    const selected = container?.querySelector('[data-active="true"]');
    if (!container || !selected) return;

    const left = selected.offsetLeft - (container.clientWidth - selected.clientWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [active]);

  return (
    <div ref={ref} className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-1.5 snap-x" role="tablist">
      {groups.flatMap((g) => [
        <span key={`g-${g.id}`} className="shrink-0 font-heading text-[9px] tracking-[0.18em] text-primary/70 pl-2 pr-0.5">
          {g.label}
        </span>,
        ...g.tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            data-active={active === t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'shrink-0 snap-center whitespace-nowrap min-h-[44px] px-3.5 rounded-full border-2 text-xs font-bold transition-all',
              active === t.id
                ? 'bg-primary text-tarot-dark border-primary'
                : 'bg-card border-border/40'
            )}
          >
            {t.label}
          </button>
        )),
      ])}
    </div>
  );
}
