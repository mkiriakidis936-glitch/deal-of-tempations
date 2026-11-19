import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Desktop: οργανωμένο κάθετο μενού σε οκτώ ομάδες
export default function AdminNav({ groups, active, onChange }) {
  return (
    <nav className="space-y-3" aria-label="Πλοήγηση διαχείρισης">
      {groups.map((group) => (
        <div key={group.id}>
          <div className="font-heading text-[10px] tracking-[0.14em] text-[#e5c76b] px-2 mb-1">
            {group.label}
          </div>
          <div className="flex flex-col gap-1">
            {group.tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={active === t.id ? 'page' : undefined}
                className={cn(
                  'text-left px-3 py-2 rounded-lg border text-xs font-bold transition-all',
                  active === t.id
                    ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-sm'
                    : 'bg-[#090909] border-[#d4af37]/25 hover:bg-[#211a0b] hover:border-[#d4af37]/40'
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

// Κινητό: βασικές συντομεύσεις και πλήρες μενού για όλες τις υπόλοιπες ενότητες
export function AdminTabBar({ groups, active, onChange }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryTabs = [
    { id: 'dashboard', label: 'Αρχική', icon: '⌂' },
    { id: 'inbox', label: 'Αιτήσεις', icon: '✉' },
    { id: 'events', label: 'Events', icon: '◎' },
    { id: 'settings', label: 'Ρυθμίσεις', icon: '⚙' },
  ];

  const selectTab = (id) => {
    onChange(id);
    setMoreOpen(false);
  };

  return (
    <div className="relative mx-auto flex max-w-xl items-center justify-around gap-1 py-1.5" role="tablist" aria-label="Κύρια πλοήγηση">
      {moreOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 max-h-[65dvh] overflow-y-auto rounded-t-2xl border border-[#d4af37]/30 bg-[#090909] shadow-2xl p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="font-heading text-sm text-[#d4af37]">ΟΛΕΣ ΟΙ ΕΝΟΤΗΤΕΣ</div>
            <button type="button" onClick={() => setMoreOpen(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold border border-[#d4af37]/30">Κλείσιμο</button>
          </div>
          <div className="space-y-3">
            {groups.map((group) => (
              <section key={group.id}>
                <div className="mb-1 px-1 text-[10px] font-bold tracking-wider text-[#e5c76b]">{group.label}</div>
                <div className="grid grid-cols-1 gap-1">
                  {group.tabs.map((tab) => (
                    <button key={tab.id} type="button" onClick={() => selectTab(tab.id)}
                      aria-current={active === tab.id ? 'page' : undefined}
                      className={cn('w-full rounded-lg border px-3 py-2.5 text-left text-xs font-semibold',
                        active === tab.id ? 'border-[#d4af37] bg-[#d4af37] text-black' : 'border-[#d4af37]/25 bg-black hover:bg-[#211a0b]')}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
      {primaryTabs.map((tab) => (
        <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id}
          onClick={() => selectTab(tab.id)}
          className={cn('flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors',
            active === tab.id ? 'bg-[#d4af37] text-black' : 'text-[#e5c76b]/75 hover:bg-[#211a0b]')}>
          <span className="text-lg leading-5">{tab.icon}</span>
          <span className="truncate">{tab.label}</span>
        </button>
      ))}
      <button type="button" role="tab" aria-selected={moreOpen || !primaryTabs.some((tab) => tab.id === active)}
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen((open) => !open)}
        className={cn('flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors',
          moreOpen || !primaryTabs.some((tab) => tab.id === active) ? 'bg-[#d4af37] text-black' : 'text-[#e5c76b]/75 hover:bg-[#211a0b]')}>
        <span className="text-lg leading-5">☷</span>
        <span className="truncate">Περισσότερα</span>
      </button>
    </div>
  );
}
