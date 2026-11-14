import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { GIFT_CODE, VOW_TEXT, GIFT_NAME, GIFT_TEXT, PASS_TITLE } from '@/data/giftVault';

function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch (e) {
    // audio is optional
  }
}

function celebrate() {
  const colors = ['#ff4d9d', '#ffd700', '#8b5cf6', '#ffffff'];
  confetti({ particleCount: 170, spread: 100, origin: { y: 0.6 }, colors });
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 140, origin: { y: 0.35 }, colors });
  }, 300);
  if (confetti.shapeFromText) {
    const heart = confetti.shapeFromText({ text: '❤️', scalar: 2.2 });
    setTimeout(() => {
      confetti({ particleCount: 40, spread: 120, origin: { y: 0.5 }, shapes: [heart], scalar: 2 });
    }, 550);
  }
}

export default function GiftUnlock() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState('');

  function handleUnlock() {
    if (code.trim().toUpperCase() !== GIFT_CODE) {
      setError('Λάθος κωδικός. Ο κωδικός δίνεται μόνο όταν περάσει η δοκιμασία.');
      return;
    }
    setError('');
    setUnlocked(true);
    playChime();
    celebrate();
    setTimeout(celebrate, 900);
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-5">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="text-7xl drop-shadow-[0_0_28px_rgba(222,184,96,0.9)] animate-pulse">🔒</div>
          <div className="font-heading text-2xl text-foreground drop-shadow-[0_0_18px_rgba(222,184,96,0.85)]">
            The Night Trial Passed!
          </div>
          <p className="text-sm text-muted-foreground">
            Εισάγετε τον Μυστικό Κωδικό της Παρέας για να ξεκλειδώσετε το Vault.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
            placeholder="ΜΥΣΤΙΚΟΣ ΚΩΔΙΚΟΣ"
            className="w-full text-center tracking-[0.25em] font-heading uppercase px-3 py-3 rounded-xl bg-input border-2 border-primary/60 text-primary focus:outline-none focus:border-primary focus:shadow-[0_0_28px_rgba(222,184,96,0.6)]"
          />
          <button
            onClick={handleUnlock}
            className="w-full py-3 rounded-xl font-heading text-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_35px_rgba(222,184,96,0.5)]"
          >
            ENTER
          </button>
          {error && <div className="text-sm text-destructive font-bold">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-14">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center pt-4">
          <div className="text-6xl animate-bounce">🎁✨</div>
          <div className="font-heading text-2xl text-primary mt-1 drop-shadow-[0_0_22px_rgba(222,184,96,0.95)]">
            ΤΟ VAULT ΑΝΟΙΞΕ
          </div>
        </div>

        <p className="text-sm text-foreground/90 leading-relaxed text-center rounded-xl border border-primary/40 bg-surface-2 p-3">
          {VOW_TEXT}
        </p>

        <div className="rounded-2xl border-2 border-primary/70 bg-surface-2 p-4 space-y-1 text-center shadow-[0_0_45px_rgba(222,184,96,0.45)]">
          <div className="text-[10px] tracking-[0.35em] font-bold text-muted-foreground">VIP ΠΑΣΟ ΠΑΡΑΣΚΗΝΙΩΝ</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Γράψε το όνομά σου"
            className="w-full text-center font-heading text-2xl bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-primary/40 py-1"
          />
          <div className="font-heading text-base text-primary leading-tight pt-1">{PASS_TITLE}</div>
          <div className="text-[11px] text-muted-foreground">Νυχτερινή Δοκιμασία · Έκδοση Πεδι-Glam</div>
        </div>

        <div className="rounded-xl border-2 border-primary bg-primary/15 p-4 text-center space-y-2 shadow-[0_0_55px_rgba(222,184,96,0.55)]">
          <div className="text-xs tracking-[0.3em] font-bold text-primary">ΤΟ ΟΜΑΔΙΚΟ ΔΩΡΟ</div>
          <div className="font-heading text-3xl text-foreground drop-shadow-[0_0_22px_rgba(222,184,96,0.95)]">
            {GIFT_NAME}
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{GIFT_TEXT}</p>
        </div>
      </div>
    </div>
  );
}