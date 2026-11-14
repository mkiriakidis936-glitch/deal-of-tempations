import React, { useRef, useState, useEffect } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { SOUND_LIST, SOUNDS } from '@/data/soundLibrary';

const MUSIC_TRACKS = [
  { id: 'none', label: '🔇 Σιωπή' },
  { id: 'ambient', label: '🌙 Ambient' },
  { id: 'suspense', label: '😰 Suspense' },
  { id: 'party', label: '🎉 Party' },
];

export default function AudioControl({ state, updateState, onClose }) {
  const audioSync = state.audioSync || {};
  const [musicPlaying, setMusicPlaying] = useState(false);
  const ambientRef = useRef(null);

  useEffect(() => {
    if (state.stopActive || state.mg?.stop) stopMusic();
  }, [state.stopActive, state.mg?.stop]);

  // Music playback via Web Audio API (simple ambient drone)
  useEffect(() => {
    const track = audioSync.music?.track;
    const playing = audioSync.music?.playing;
    if (!track || track === 'none' || !playing) {
      stopMusic();
      return;
    }
    startMusic(track);
  }, [audioSync.music]);

  function stopMusic() {
    if (ambientRef.current) {
      try { ambientRef.current.osc1.stop(); ambientRef.current.osc2.stop(); } catch (e) {}
      try { ambientRef.current.ctx.close(); } catch (e) {}
      ambientRef.current = null;
    }
    setMusicPlaying(false);
  }

  function startMusic(track) {
    stopMusic();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const dest = ctx.destination;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'sine';
    const freqs = { ambient: [110, 165], suspense: [55, 82], party: [220, 330] };
    const [f1, f2] = freqs[track] || [110, 165];
    osc1.frequency.value = f1;
    osc2.frequency.value = f2;
    gain.gain.value = 0.05;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);
    osc1.start();
    osc2.start();
    ambientRef.current = { ctx, osc1, osc2 };
    setMusicPlaying(true);
  }

  async function triggerEffect(name) {
    const id = `fx_${Date.now()}`;
    // Play locally
    const sound = SOUNDS[name];
    if (sound) { try { sound.play(); } catch (e) {} }
    // Sync to all devices
    await updateState({
      audioSync: { ...audioSync, effect: { name, id, timestamp: Date.now() } },
    });
  }

  async function playMusic(track) {
    if (track === 'none') {
      stopMusic();
      await updateState({ audioSync: { ...audioSync, music: { track, playing: false, timestamp: Date.now() } } });
    } else {
      await updateState({ audioSync: { ...audioSync, music: { track, playing: true, timestamp: Date.now() } } });
    }
  }

  async function stopAllMusic() {
    stopMusic();
    await updateState({ audioSync: { ...audioSync, music: { track: 'none', playing: false, timestamp: Date.now() } } });
  }

  return (
    <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3 max-h-[85vh] overflow-y-auto">
        <ComicPanel className="bg-tarot-forest text-center py-4">
          <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">🎵 ΗΧΗΤΙΚΟΣ ΣΚΗΝΟΘΕΤΗΣ</div>
          <div className="text-sm font-bold text-foreground/80 font-body">Ήχοι & μουσική — συγχρονισμένα σε όλες τις οθόνες</div>
        </ComicPanel>

        {/* Sound effects */}
        <ComicPanel className="bg-card">
          <div className="font-heading text-lg mb-2 text-primary">🔊 ΗΧΗΤΙΚΑ ΕΦΕ</div>
          <div className="grid grid-cols-3 gap-2">
            {SOUND_LIST.map((s) => (
              <ComicButton
                key={s.id}
                variant="dark"
                size="sm"
                onClick={() => triggerEffect(s.id)}
                className="flex flex-col items-center"
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs">{s.name}</span>
              </ComicButton>
            ))}
          </div>
        </ComicPanel>

        {/* Background music */}
        <ComicPanel className="bg-card">
          <div className="font-heading text-lg mb-2 text-primary">🎶 ΜΟΥΣΙΚΗ ΥΠΟΒΑΘΜΙΣΗ</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {MUSIC_TRACKS.map((m) => (
              <ComicButton
                key={m.id}
                variant={audioSync.music?.track === m.id && audioSync.music?.playing ? 'green' : 'dark'}
                size="sm"
                onClick={() => playMusic(m.id)}
              >
                {m.label}
              </ComicButton>
            ))}
          </div>
          {musicPlaying && (
            <ComicButton variant="red" size="sm" onClick={stopAllMusic} className="w-full">
              ⏹ ΣΤΟΠ ΜΟΥΣΙΚΗ
            </ComicButton>
          )}
        </ComicPanel>

        <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
      </div>
    </div>
  );
}