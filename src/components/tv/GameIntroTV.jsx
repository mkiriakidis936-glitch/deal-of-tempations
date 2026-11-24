import React, { useEffect, useRef, useState } from 'react';
import { MODE_MEDIA, FILM } from '@/data/brandArt';

// Intro παιχνιδιού στην TV: παίζει μία φορά στην αρχή κάθε νέας παρτίδας (state.mg.introAt),
// πριν από τους κανόνες. Το βίντεο ορίζεται από το Admin: πρώτα το intro του mode (MODE MEDIA CENTER),
// αλλιώς το γενικό «Intro παιχνιδιού» (Site & TV). Το Tablet μπορεί να το ξαναπαίξει.
const MAX_AGE_MS = 30 * 60 * 1000;
export const introVideoFor = (modeId) => MODE_MEDIA[modeId]?.intro || FILM.gameIntroVideo || '';

export default function GameIntroTV({ state, sessionCode, disabled = false }) {
  const introAt = Number(state?.mg?.introAt || 0);
  const src = introVideoFor(state?.mode);
  const stopped = !!(state?.stopActive || state?.mg?.stop);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (disabled || !introAt || !src || !sessionCode || Date.now() - introAt > MAX_AGE_MS) return;
    // Κάθε εντολή intro παίζει μία φορά ανά TV (και όχι ξανά σε κάθε ανανέωση της σελίδας).
    const key = `dot_intro_${sessionCode}_${introAt}`;
    try {
      if (localStorage.getItem(key) === '1') return;
      localStorage.setItem(key, '1');
    } catch { /* χωρίς storage: απλώς παίζει */ }
    setPlaying(true);
  }, [disabled, introAt, src, sessionCode]);

  // Ξεκινά με ήχο· αν ο browser το μπλοκάρει, σε σίγαση. Αν δεν ξεκινήσει σε 12″, κλείνει για να μην κολλήσει η TV.
  useEffect(() => {
    const video = videoRef.current;
    if (!playing || !video) return undefined;
    let started = false;
    const onPlaying = () => { started = true; };
    video.addEventListener('playing', onPlaying);
    video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
    const guard = setTimeout(() => { if (!started) setPlaying(false); }, 12000);
    return () => { clearTimeout(guard); video.removeEventListener('playing', onPlaying); };
  }, [playing, src]);

  // ΣΤΟΠ: το βίντεο παγώνει μαζί με όλο το παιχνίδι.
  useEffect(() => {
    const video = videoRef.current;
    if (!playing || !video) return;
    if (stopped) video.pause();
    else video.play().catch(() => {});
  }, [stopped, playing]);

  if (!playing || !src) return null;
  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black" role="dialog" aria-label="Intro παιχνιδιού">
      <video
        key={`${introAt}-${src}`}
        ref={videoRef}
        src={src}
        playsInline
        preload="auto"
        className="h-full w-full object-contain"
        onEnded={() => setPlaying(false)}
        onError={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={() => setPlaying(false)}
        className="absolute right-5 top-5 rounded-full border border-white/30 bg-black/70 px-4 py-2 text-sm font-semibold text-white"
      >
        Παράλειψη
      </button>
    </div>
  );
}
