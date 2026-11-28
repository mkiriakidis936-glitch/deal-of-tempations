import { useEffect, useRef } from 'react';
import { useAudioUnlocked } from '@/lib/audioUnlock';
import { SOUNDSCAPES, soundIntensity, soundscapeKey } from '@/lib/soundscape';

// 10.5.2 · Μουσικό χαλί της Ταινίας στην TV, ένα ανά ήπειρο. Συντίθεται ζωντανά με WebAudio (χωρίς αρχεία).
// Ήσυχο από προεπιλογή· ανεβαίνει σε ένταση/παλμό όταν γυρίζει ο Τροχός, κυλά το ζάρι ή ανοίγει κουτί.
// Σιωπά σε ΣΤΟΠ, σε προεπισκόπηση, με «Μουσική off» από το Tablet και όσο παίζει βίντεο με δικό του ήχο.
// Μόνο ήχος· δεν αλλάζει τίποτα στο παιχνίδι.

function build(ctx, sc) {
  const out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = sc.cutoff; lp.Q.value = 0.7; lp.connect(out);
  // Απλή «αίθουσα»: δύο καθυστερήσεις με ανάδραση
  const wet = ctx.createGain(); wet.gain.value = 0.35; wet.connect(out);
  [0.23, 0.37].forEach((t) => { const d = ctx.createDelay(1); d.delayTime.value = t; const fb = ctx.createGain(); fb.gain.value = 0.35; lp.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); });
  const pad = ctx.createGain(); pad.gain.value = 0.05; pad.connect(lp);
  const oscs = [];
  sc.chord.forEach((s, i) => {
    [-6, 6].forEach((det) => {
      const o = ctx.createOscillator(); o.type = sc.wave; o.frequency.value = sc.root * Math.pow(2, s / 12) * 2; o.detune.value = det + i;
      const g = ctx.createGain(); g.gain.value = 1 / (sc.chord.length * 2); o.connect(g); g.connect(pad); o.start(); oscs.push(o);
    });
  });
  // Αργή «αναπνοή» του φίλτρου
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lfoG = ctx.createGain(); lfoG.gain.value = sc.cutoff * 0.35; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start(); oscs.push(lfo);
  const pulse = ctx.createGain(); pulse.gain.value = 1; pulse.connect(lp);
  return { out, lp, pad, pulse, oscs };
}

export default function TVSoundscape({ cg, continent, muted }) {
  const unlocked = useAudioUnlocked();
  const ref = useRef(null); // { ctx, key, nodes, timer, step }
  const live = useRef({ cg, muted });
  live.current = { cg, muted };
  const key = soundscapeKey(cg, continent);

  useEffect(() => {
    if (!unlocked || !key || muted) return undefined;
    const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!Ctx) return undefined;
    let ctx;
    try { ctx = new Ctx(); } catch { return undefined; }
    const sc = SOUNDSCAPES[key];
    const nodes = build(ctx, sc);
    nodes.out.gain.setTargetAtTime(0.55, ctx.currentTime, 2.5); // απαλό fade-in
    let step = 0; let next = ctx.currentTime + 0.2;
    // Παλμός μπάσου: πιο γρήγορος και πιο δυνατός όσο ανεβαίνει η ένταση
    const timer = setInterval(() => {
      const k = soundIntensity(live.current.cg);
      const beat = 60 / (sc.bpm * (1 + k * 0.45)) / (k > 0.7 ? 2 : 1);
      nodes.pad.gain.setTargetAtTime(0.05 + k * 0.03, ctx.currentTime, 0.4);
      nodes.lp.frequency.setTargetAtTime(sc.cutoff * (1 + k * 1.4), ctx.currentTime, 0.5);
      while (next < ctx.currentTime + 0.3) {
        const semi = sc.bass[step % sc.bass.length];
        const o = ctx.createOscillator(); o.type = k > 0.7 ? 'square' : 'sine'; o.frequency.value = sc.root * Math.pow(2, semi / 12) / 2;
        const g = ctx.createGain(); const vol = 0.04 + k * 0.16;
        g.gain.setValueAtTime(0, next); g.gain.linearRampToValueAtTime(vol, next + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, next + Math.min(0.5, beat * 0.9));
        o.connect(g); g.connect(nodes.pulse); o.start(next); o.stop(next + beat);
        if (k > 0.7) { // τικ-τακ έντασης
          const t = ctx.createOscillator(); t.type = 'square'; t.frequency.value = 1800;
          const tg = ctx.createGain(); tg.gain.setValueAtTime(0.025, next); tg.gain.exponentialRampToValueAtTime(0.0001, next + 0.03);
          t.connect(tg); tg.connect(nodes.out); t.start(next); t.stop(next + 0.04);
        }
        next += beat; step += 1;
      }
    }, 100);
    const level = (playing) => { try { nodes.out.gain.setTargetAtTime(playing ? 0 : 0.55, ctx.currentTime, playing ? 0.25 : 1.5); } catch { /* κλειστό */ } };
    const onVideo = (e) => level(!!e.detail);
    window.addEventListener('dot-show-video-playing', onVideo);
    ref.current = { ctx, nodes, timer };
    return () => {
      clearInterval(timer);
      window.removeEventListener('dot-show-video-playing', onVideo);
      try {
        nodes.out.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
        setTimeout(() => { nodes.oscs.forEach((o) => { try { o.stop(); } catch { /* ήδη σταματημένο */ } }); ctx.close().catch(() => {}); }, 1200);
      } catch { /* κλειστό */ }
      ref.current = null;
    };
  }, [unlocked, key, muted]);

  return null;
}
