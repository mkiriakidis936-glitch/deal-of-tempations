// Shared helpers for the synchronized countdown timer (Tablet / TV / Mobile).

export function getRemaining(timer, now = Date.now()) {
  if (!timer) return 0;
  if (timer.running) return Math.max(0, Math.ceil(((timer.endsAt || 0) - now) / 1000));
  return Math.max(0, timer.remaining || 0);
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}