import React, { useEffect, useRef, useState } from 'react';
import { FILM } from '@/data/brandArt';

// Βίντεο «εκπομπής» στην TV: stingers, διάλειμμα (έξοδος/επιστροφή), φινάλε (recap → winner reveal).
// Οποιοδήποτε σημείο του κώδικα ζητά βίντεο με playShowVideo('stinger_arrest') κ.λπ.
// Παίζει μόνο αν έχει ανέβει αρχείο στη θέση του (Admin → Χάρτης media → Βίντεο TV). Δεν κολλάει ποτέ την TV:
// κλείνει μόλις τελειώσει, σε σφάλμα, με κλικ, ή το πολύ σε 15″.
const EVENT = 'dt-show-video';
let lastAt = 0;
export function playShowVideo(...ids) {
  if (typeof window === 'undefined') return;
  const list = ids.flat().filter((id) => FILM[id]);
  if (!list.length) return;
  // Stingers: όχι πιο συχνά από 1 ανά 6″, για να μη «σκεπάζουν» το παιχνίδι.
  const stinger = list.every((id) => id.startsWith('stinger_'));
  const now = Date.now();
  if (stinger && now - lastAt < 6000) return;
  lastAt = now;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: list }));
}

export default function TVShowVideos({ disabled = false, cue = null }) {
  const [queue, setQueue] = useState([]);
  const ref = useRef(null);
  useEffect(() => {
    const on = (e) => { if (!disabled) setQueue((q) => (q.length ? q : [...e.detail])); };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [disabled]);
  // Εντολή από το Στούντιο (state.showCue): παίζει μία φορά, αν είναι πρόσφατη.
  useEffect(() => {
    if (!cue?.id || !cue.at || disabled || Date.now() - cue.at > 15000) return;
    if (FILM[cue.id]) setQueue((q) => (q.length ? q : [cue.id]));
  }, [cue?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  const id = queue[0];
  const src = id ? FILM[id] : '';
  const next = () => setQueue((q) => q.slice(1));
  useEffect(() => {
    const v = ref.current;
    if (!src || !v) return undefined;
    v.play().catch(() => { v.muted = true; v.play().catch(() => next()); });
    const guard = setTimeout(next, id.startsWith('stinger_') ? 15000 : 180000);
    return () => clearTimeout(guard);
  }, [src, id]);
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[94] flex items-center justify-center bg-black" onClick={next} role="presentation">
      <video key={id + src} ref={ref} src={src} playsInline preload="auto" className="h-full w-full object-cover" onEnded={next} onError={next} />
    </div>
  );
}
