import React from 'react';
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

// Κινητό: σταθερή κάτω μπάρα με τις πέντε βασικές ενότητες
export function AdminTabBar({ groups, active, onChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Αρχική', icon: '⌂' },
    { id: 'inbox', label: 'Αιτήσεις', icon: '✉' },
    { id: 'events', label: 'Events', icon: '◎' },
    { id: 'media', label: 'Media', icon: '▧' },
    { id: 'settings', label: 'Ρυθμίσεις', icon: '⚙' },
  ];
  return (
    <div className="mx-auto flex max-w-xl items-center justify-around gap-1 py-1.5" role="tablist" aria-label="Κύρια πλοήγηση">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn('flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition-colors',
            active === tab.id ? 'bg-primary text-tarot-dark' : 'text-foreground/70 hover:bg-secondary')}>
          <span className="text-lg leading-5">{tab.icon}</span>
          <span className="truncate">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
