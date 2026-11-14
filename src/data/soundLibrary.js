// Sound effects generated via Web Audio API — no external files needed.
// Each sound is a function that takes an AudioContext and plays a tone sequence.

const activeContexts = new Set();

export function stopAllSounds() {
  activeContexts.forEach((ctx) => {
    try { ctx.close().catch(() => {}); } catch { /* already closed */ }
  });
  activeContexts.clear();
}

function closeCtx(ctx) {
  activeContexts.delete(ctx);
  return ctx.close().catch(() => {});
}

function createCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  activeContexts.add(ctx);
  return ctx;
}

function tone(ctx, dest, freq, start, duration, type = 'sine', volume = 0.3) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(dest);
  gain.gain.setValueAtTime(0, ctx.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration);
}

export const SOUNDS = {
  dramatic_sting: {
    name: 'Dramatic Sting', icon: '🎭', duration: 2,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      [220, 330, 440, 550].forEach((f, i) => tone(ctx, dest, f, i * 0.15, 0.4, 'sawtooth', 0.2));
      setTimeout(() => closeCtx(ctx), 2500);
    },
  },
  suspense: {
    name: 'Suspense', icon: '😰', duration: 3,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      tone(ctx, dest, 110, 0, 3, 'sine', 0.15);
      tone(ctx, dest, 165, 0, 3, 'sine', 0.1);
      [0.5, 1, 1.5, 2, 2.5].forEach((t) => tone(ctx, dest, 880, t, 0.1, 'square', 0.08));
      setTimeout(() => ctx.close(), 3500);
    },
  },
  celebration: {
    name: 'Celebration', icon: '🎉', duration: 2,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      [523, 659, 784, 1047].forEach((f, i) => tone(ctx, dest, f, i * 0.1, 0.3, 'triangle', 0.2));
      setTimeout(() => ctx.close(), 2500);
    },
  },
  buzzer: {
    name: 'Buzzer', icon: '🚫', duration: 1,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      tone(ctx, dest, 150, 0, 1, 'sawtooth', 0.3);
      setTimeout(() => ctx.close(), 1500);
    },
  },
  reveal: {
    name: 'Reveal', icon: '✨', duration: 2,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      tone(ctx, dest, 200, 0, 1.5, 'sine', 0.15);
      tone(ctx, dest, 400, 0.3, 1.2, 'sine', 0.15);
      tone(ctx, dest, 800, 0.6, 1, 'sine', 0.2);
      tone(ctx, dest, 1200, 0.9, 0.8, 'triangle', 0.25);
      setTimeout(() => ctx.close(), 2500);
    },
  },
  heartbeat: {
    name: 'Heartbeat', icon: '💓', duration: 2,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      [0, 0.4, 0.8, 1.2, 1.6].forEach((t) => {
        tone(ctx, dest, 60, t, 0.15, 'sine', 0.3);
        tone(ctx, dest, 50, t + 0.1, 0.1, 'sine', 0.2);
      });
      setTimeout(() => ctx.close(), 2500);
    },
  },
  transition: {
    name: 'Transition', icon: '🎬', duration: 1.5,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      tone(ctx, dest, 440, 0, 0.3, 'sine', 0.15);
      tone(ctx, dest, 554, 0.2, 0.3, 'sine', 0.15);
      tone(ctx, dest, 659, 0.4, 0.3, 'sine', 0.15);
      tone(ctx, dest, 880, 0.6, 0.8, 'triangle', 0.2);
      setTimeout(() => ctx.close(), 2000);
    },
  },
  applause: {
    name: 'Applause', icon: '👏', duration: 3,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      for (let i = 0; i < 20; i++) {
        const t = i * 0.08 + Math.random() * 0.05;
        tone(ctx, dest, 200 + Math.random() * 300, t, 0.05, 'square', 0.05);
      }
      setTimeout(() => ctx.close(), 3500);
    },
  },
  drumroll: {
    name: 'Drumroll', icon: '🥁', duration: 3,
    play: () => {
      const ctx = createCtx(); if (!ctx) return;
      const dest = ctx.destination;
      for (let i = 0; i < 30; i++) {
        tone(ctx, dest, 80 + (i % 2) * 20, i * 0.08, 0.06, 'sawtooth', 0.15);
      }
      tone(ctx, dest, 880, 2.4, 0.6, 'triangle', 0.25);
      setTimeout(() => ctx.close(), 3500);
    },
  },
};

export const SOUND_LIST = Object.entries(SOUNDS).map(([id, s]) => ({ id, ...s }));