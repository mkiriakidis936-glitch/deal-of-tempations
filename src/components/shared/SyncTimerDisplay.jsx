import React, { useEffect, useState } from 'react';
import { getRemaining, formatClock } from '@/lib/syncTimer';

// Read-only countdown that stays in sync across Tablet / TV / Mobile
// because the end time lives in the shared session state.
export default function SyncTimerDisplay({ state, variant = 'tv' }) {
  const timer = state?.syncTimer;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!timer?.running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [timer?.running, timer?.endsAt]);

  if (!timer) return null;

  const remaining = getRemaining(timer, now);
  const danger = timer.running && remaining <= 10;
  const paused = !timer.running;
  const size = variant === 'tv' ? 'text-6xl' : variant === 'mobile' ? 'text-4xl' : 'text-5xl';

  return (
    <div className={`comic-panel ${danger ? 'border-destructive/50' : ''} p-3 text-center`}>
      <div className={`ds-label ${danger ? 'text-destructive' : 'text-primary/80'}`}>
        {paused ? 'Παύση' : 'Χρονόμετρο'}
      </div>
      <div className={`ds-value ${size} leading-none ${danger ? 'text-destructive' : 'text-foreground'}`}>
        {formatClock(remaining)}
      </div>
      {timer.label && <div className="mt-1 ds-label text-foreground/55">{timer.label}</div>}
    </div>
  );
}