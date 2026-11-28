import { useEffect, useRef } from 'react';
import { announceKey, announcerLine } from '@/lib/announcer';

// 12.0.0 · Φωνή εκφωνητή στην TV (ελληνική φωνή της συσκευής, αν υπάρχει). Κλειστή από προεπιλογή.
// Σιωπά σε ΣΤΟΠ, σε προεπισκόπηση, και όταν δεν υπάρχει ελληνική φωνή (δεν διαβάζει ελληνικά με ξένη προφορά).
export function greekVoice() {
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    return voices.find((v) => /^el(-|_|$)/i.test(v.lang)) || null;
  } catch { return null; }
}

export default function TVAnnouncer({ cg, players = [], enabled, muted }) {
  const prev = useRef(null);
  useEffect(() => {
    if (!cg) return;
    const before = prev.current;
    prev.current = announceKey(cg);
    if (!enabled || muted || !before) return;
    const nameOf = (id) => players.find((p) => p.id === id)?.name || '';
    const leader = (() => {
      const ps = Object.entries(cg.players || {}).map(([id, s]) => [id, s.points || 0]).sort((a, b) => b[1] - a[1]);
      return ps[0] ? nameOf(ps[0][0]) : null;
    })();
    const line = announcerLine(before, cg, nameOf, leader);
    const voice = greekVoice();
    if (!line || !voice) return;
    try {
      const u = new SpeechSynthesisUtterance(line);
      u.voice = voice; u.lang = voice.lang; u.rate = 1.02; u.pitch = 0.9; u.volume = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* χωρίς φωνή */ }
  });
  useEffect(() => { if (muted) { try { window.speechSynthesis?.cancel(); } catch { /* */ } } }, [muted]);
  return null;
}
