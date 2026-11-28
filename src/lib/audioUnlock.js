import { useEffect, useState } from 'react';
import { unlockAudioContexts } from '@/data/soundLibrary';
import { unlockModeAudio } from '@/lib/modeKit';

let unlocked = false;
const listeners = new Set();

export function isAudioUnlocked() {
  return unlocked;
}

export function unlockAudio() {
  unlockAudioContexts();
  unlockModeAudio();
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      ctx.resume().catch(() => {}).finally(() => setTimeout(() => ctx.close().catch(() => {}), 500));
    }
  } catch { /* χωρίς WebAudio */ }
  if (!unlocked) {
    unlocked = true;
    listeners.forEach((fn) => fn(true));
  }
}

if (typeof document !== 'undefined') {
  const onGesture = () => unlockAudio();
  document.addEventListener('pointerdown', onGesture, { capture: true, passive: true });
  document.addEventListener('keydown', onGesture, { capture: true });
}

// 12.0.0 · Ειδοποίηση μία φορά όταν ξεκλειδωθεί ο ήχος (για το σήμα της TV).
export function onAudioUnlocked(fn) {
  const once = (v) => { if (v) fn(); };
  listeners.add(once);
  return () => listeners.delete(once);
}

export function useAudioUnlocked() {
  const [value, setValue] = useState(unlocked);
  useEffect(() => {
    listeners.add(setValue);
    return () => listeners.delete(setValue);
  }, []);
  return value;
}
