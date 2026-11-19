import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function StopButton({ active, onToggle }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (active) {
      setPulse(true);
    } else {
      setPulse(false);
    }
  }, [active]);

  return (
    <button
      onClick={onToggle}
      className={cn(
        'fixed top-3 right-3 z-50 comic-boom font-ui text-xs px-5 py-2.5',
        active
          ? 'bg-surface-2 text-foreground'
          : 'bg-destructive text-destructive-foreground'
      )}
    >
      {active ? '▶ ΣΥΝΕΧΕΙΑ' : '⏹ ΣΤΟΠ'}
    </button>
  );
}