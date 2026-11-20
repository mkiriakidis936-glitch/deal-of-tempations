import React from 'react';
import { unlockAudio, useAudioUnlocked } from '@/lib/audioUnlock';

export default function SoundUnlock({ variant = 'pill' }) {
  const unlocked = useAudioUnlocked();
  if (unlocked) return null;
  if (variant === 'screen') {
    return (
      <button
        type="button"
        onClick={unlockAudio}
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-black/85 text-white"
      >
        <img src="/icons/icon-192.png" alt="" className="h-20 w-20 rounded-3xl" />
        <span className="text-2xl font-semibold">Πάτα για να ενεργοποιηθεί ο ήχος</span>
        <span className="text-sm text-white/60">Χρειάζεται μία φορά σε κάθε άνοιγμα της οθόνης.</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={unlockAudio}
      className="fixed left-1/2 top-3 z-[300] -translate-x-1/2 rounded-full border border-[#E8C26B]/50 bg-[#1C1C1E] px-4 py-2 text-sm font-semibold text-white"
    >
      🔊 Πάτα για ήχο
    </button>
  );
}
