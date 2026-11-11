import React from 'react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'status', icon: '🏠', label: 'Status' },
  { id: 'show', icon: '📨', label: 'Show' },
  { id: 'votes', icon: '🗳️', label: 'Ψήφοι' },
  { id: 'mini', icon: '🎮', label: 'Mini' },
  { id: 'scan', icon: '📷', label: 'Scan' },
];

export default function MobileTabBar({ active, onChange, hasScan }) {
  const tabs = hasScan ? TABS : TABS.filter((t) => t.id !== 'scan');
  return (
    <div className="flex gap-1 sticky top-[88px] z-10">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex-1 comic-panel-sm p-2 flex flex-col items-center gap-1 transition-all',
            active === t.id ? 'border-primary/45 bg-primary/12 text-primary' : 'text-foreground/70'
          )}
        >
          <span className="text-lg leading-none">{t.icon}</span>
          <span className="ds-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}