import { useEffect, useRef } from 'react';
import { SOUNDS } from '@/data/soundLibrary';

// Cross-device audio sync: watches state.audioSync and plays the triggered effect on all devices.
export function useAudioSync(state) {
  const lastEffectRef = useRef(null);
  const lastMusicRef = useRef(null);

  useEffect(() => {
    if (!state?.audioSync) return;

    // Sound effect sync
    const effect = state.audioSync.effect;
    if (effect && effect.id !== lastEffectRef.current) {
      lastEffectRef.current = effect.id;
      const sound = SOUNDS[effect.name];
      if (sound) {
        try { sound.play(); } catch (e) { /* best-effort */ }
      }
    }

    // Music sync — simple on/off with generated ambient tone
    const music = state.audioSync.music;
    if (music) {
      const musicKey = `${music.track}_${music.playing}_${music.timestamp}`;
      if (musicKey !== lastMusicRef.current) {
        lastMusicRef.current = musicKey;
        // Music is handled by AudioControl on the Tablet; TV/Play just play effects
      }
    }
  }, [state?.audioSync]);
}