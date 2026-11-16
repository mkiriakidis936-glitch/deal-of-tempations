import React from 'react';
import { fmt, useTick } from '@/lib/modeKit';

export default function GameDurationClock({ state, compact = false }) {
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
    <div className={compact
      ? 'fixed top-3 left-1/2 -translate-x-1/2 z-[55] rounded-lg border border-primary/60 bg-black/90 px-3 py-1.5 text-center shadow-lg'
      : 'fixed top-16 right-3 z-40 rounded-lg border border-primary/60 bg-black/90 px-3 py-2 text-center shadow-lg'}>
      <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-primary/80">ΣΥΝΟΛΙΚΟΣ ΧΡΟΝΟΣ</div>
      <div className={`font-mono font-black tabular-nums ${compact ? 'text-lg sm:text-xl' : 'text-2xl'} ${expired ? 'text-red-500 animate-pulse' : remaining <= 300 ? 'text-amber-400' : 'text-white'}`}>{label}</div>
      {expired && <div className="text-[9px] font-bold text-red-400">Ο ΧΡΟΝΟΣ ΕΛΗΞΕ</div>}
      {(state.stopActive || state.mg?.stop || state.extra4?.control?.status === 'paused') && !expired && <div className="text-[9px] font-bold text-amber-300">ΠΑΥΣΗ</div>}
    </div>
  );
}
