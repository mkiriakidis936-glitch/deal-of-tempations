import React, { useEffect, useRef, useState } from 'react';
import { FILM } from '@/data/brandArt';
import { firstArt } from '@/lib/movieArt';
import { introVideoFor } from '@/components/tv/GameIntroTV';

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

// Πηγή βίντεο για ένα id: βίντεο εκπομπής (FILM), βίντεο της Ταινίας (vid_*), ή το intro του mode.
export const showVideoSrc = (id, mode) => (id === 'modeIntro' ? introVideoFor(mode) : FILM[id] || (id?.startsWith('vid_') ? firstArt(id) : '')) || '';

// manual: σε «Μόνο με Play» αγνοούνται τα αυτόματα αιτήματα (stingers, διάλειμμα, φινάλε)· παίζει μόνο το cue.
export default function TVShowVideos({ disabled = false, cue = null, manual = false, mode = '' }) {
  const [queue, setQueue] = useState([]);
  const ref = useRef(null);
  useEffect(() => {
    const on = (e) => { if (!disabled && !manual) setQueue((q) => (q.length ? q : [...e.detail])); };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [disabled, manual]);
  // Εντολή από Tablet/Στούντιο (state.showCue): ▶ παίζει μία φορά αν είναι πρόσφατη, ■ σταματά ό,τι παίζει.
  useEffect(() => {
    if (!cue?.at || disabled || Date.now() - cue.at > 15000) return;
    if (cue.stop) { setQueue([]); return; }
    if (cue.id && showVideoSrc(cue.id, mode)) setQueue([cue.id]);
  }, [cue?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  const id = queue[0];
  const src = id ? showVideoSrc(id, mode) : '';
  const next = () => setQueue((q) => q.slice(1));
  // 10.5.2 · Ειδοποίηση για το μουσικό χαλί: όσο παίζει βίντεο, η μουσική χαμηλώνει.
  useEffect(() => {
    try { window.dispatchEvent(new CustomEvent('dot-show-video-playing', { detail: !!src })); } catch { /* χωρίς window */ }
  }, [src]);
  useEffect(() => {
    const v = ref.current;
    if (!src || !v) return undefined;
    v.play().catch(() => { v.muted = true; v.play().catch(() => next()); });
    const guard = setTimeout(next, id.startsWith('stinger_') ? 15000 : 300000);
    return () => clearTimeout(guard);
  }, [src, id]);
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[94] flex items-center justify-center bg-black" onClick={next} role="presentation">
      <video key={id + src} ref={ref} src={src} playsInline preload="auto" className="h-full w-full object-cover" onEnded={next} onError={next} />
    </div>
  );
}
