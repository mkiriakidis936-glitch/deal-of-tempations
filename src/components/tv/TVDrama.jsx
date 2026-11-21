import React, { useEffect, useRef } from 'react';
import { tvSfx, useTick } from '@/lib/modeKit';

// TV: «Δραματική στιγμή» από το Tablet — στατική, χωρίς κινήσεις, με ήχο σασπένς.
export default function TVDrama({ drama, muted }) {
  const lastAt = useRef(null);
  useTick(!!drama && Date.now() < drama.until + 1000, 1000);
  useEffect(() => {
    if (!drama?.at) return;
    if (lastAt.current !== null && drama.at !== lastAt.current && !muted) tvSfx.drama();
    lastAt.current = drama.at;
  }, [drama?.at, muted]);
  if (!drama || Date.now() > drama.until) return null;
  return (
    <div className="ui-tv ui-tv-takeover" style={{ zIndex: 90 }}>
      <div className="ui-tv-live" style={{ background: '#fff', color: '#000' }}>🎭 ΔΡΑΜΑΤΙΚΗ ΣΤΙΓΜΗ</div>
      <div className="ui-tv-title max-w-6xl" style={{ fontSize: 'calc(var(--tv-unit) * 6)' }}>{drama.text}</div>
    </div>
  );
}
