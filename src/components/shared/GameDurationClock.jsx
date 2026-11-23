import React from 'react';
import { fmt, useTick } from '@/lib/modeKit';

export default function GameDurationClock({ state, compact = false, inline = false, corner = false }) {
  useTick(!!state?.gameStartedAt, 1000);
  const durationSeconds = Math.max(0, Number(state?.gameDurationMinutes || 0) * 60);
  if (!durationSeconds || !state?.gameStartedAt) return null;
  const now = Date.now();
  const pausedAt = state.gamePausedAt || (state.stopActive || state.mg?.stop ? now : null);
  const pausedMs = Math.max(0, Number(state.gamePausedMs || 0));
  const elapsedMs = Math.max(0, now - state.gameStartedAt - pausedMs - (pausedAt ? now - pausedAt : 0));
  const remaining = Math.max(0, Math.ceil(durationSeconds - elapsedMs / 1000));
  const expired = remaining <= 0;
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const label = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : fmt(remaining);
  return (
    <div className={corner
      ? 'fixed bottom-16 right-4 z-[55] rounded-xl border border-primary/50 bg-black px-4 py-2 text-center'
      : inline
      ? 'shrink-0 rounded-xl border border-primary/50 bg-black px-3 py-1.5 text-center'
      : compact
      ? 'fixed top-3 left-1/2 -translate-x-1/2 z-[55] rounded-lg border border-primary/60 bg-black/90 px-3 py-1.5 text-center '
      : 'fixed z-40 flex items-center gap-2 rounded-full border border-primary/60 bg-black/90 px-3 py-1 text-center max-sm:left-3 max-sm:top-[68px] sm:right-3 sm:top-16 sm:block sm:rounded-lg sm:px-3 sm:py-2 '}>
      <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-primary/80">ΣΥΝΟΛΙΚΟΣ ΧΡΟΝΟΣ</div>
      <div className={`font-mono font-black tabular-nums ${compact ? 'text-lg sm:text-xl' : corner ? 'text-3xl' : 'text-2xl'} ${expired ? 'text-red-500' : remaining <= 300 ? 'text-amber-400' : 'text-white'}`}>{label}</div>
      {expired && <div className="text-[9px] font-bold text-red-400">Ο ΧΡΟΝΟΣ ΕΛΗΞΕ</div>}
      {(state.stopActive || state.mg?.stop) && !expired && <div className="text-[9px] font-bold text-amber-300">ΠΑΥΣΗ</div>}
    </div>
  );
}
