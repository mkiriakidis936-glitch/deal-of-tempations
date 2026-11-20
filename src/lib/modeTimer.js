// Συγχρονισμένο χρονόμετρο (ίδιο σε tablet / TV / κινητά). Καθαρές συναρτήσεις — δοκιμάζονται από tests.
export const timerStart = (seconds, now = Date.now()) => ({ total: seconds, endsAt: now + seconds * 1000, remaining: seconds });
export const timerLeft = (t, now = Date.now()) => (!t ? 0 : t.endsAt ? Math.max(0, (t.endsAt - now) / 1000) : Math.max(0, t.remaining || 0));
export const timerAdd = (t, sec) => {
  if (!t) return t;
  if (t.endsAt) return { ...t, endsAt: t.endsAt + sec * 1000, total: (t.total || 0) + sec };
  return { ...t, remaining: (t.remaining || 0) + sec, total: (t.total || 0) + sec };
};
export const timerPause = (t, now = Date.now()) => (t && t.endsAt ? { ...t, remaining: timerLeft(t, now), endsAt: null } : t);
export const timerResume = (t, now = Date.now()) => (t && !t.endsAt ? { ...t, endsAt: now + (t.remaining || 0) * 1000 } : t);
