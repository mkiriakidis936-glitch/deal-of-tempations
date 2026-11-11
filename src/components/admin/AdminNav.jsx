import React from 'react';
import { cn } from '@/lib/utils';

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