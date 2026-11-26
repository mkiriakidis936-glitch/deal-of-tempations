import React, { useState } from 'react';

// /gift-unlock — η καλεσμένη βάζει τον κωδικό που της δίνει η διοργανώτρια και βλέπει το δώρο.
// Ο κωδικός και τα κείμενα ορίζονται στο Admin → Σύνδεσμοι & QR → Δώρο, και ελέγχονται στον server.

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
  } catch { /* ο ήχος είναι προαιρετικός */ }
}

const vibrate = () => { try { navigator.vibrate?.([30, 40, 30]); } catch { /* δεν υποστηρίζεται */ } };

export default function GiftUnlock() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [gift, setGift] = useState(null);
  const [name, setName] = useState('');

  async function unlock(event) {
    event?.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/entities/gift-unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Ο κωδικός δεν είναι σωστός.');
      setGift(data);
      playChime();
      vibrate();
      setTimeout(vibrate, 900);
    } catch (e) {
      setError(e.message || 'Δεν ήταν δυνατός ο έλεγχος. Δοκίμασε ξανά.');
    } finally {
      setBusy(false);
    }
  }

  if (!gift) {
    return (
      <div className="min-h-[100dvh] bg-black text-[#F5F1E8] flex items-center justify-center p-5">
        <form onSubmit={unlock} className="max-w-md w-full space-y-5 text-center">
          <div className="text-7xl drop-shadow-[0_0_28px_rgba(232,194,107,0.8)]">🔒</div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E8C26B]">Deal of Temptation</div>
            <h1 className="mt-2 text-3xl font-bold">Ξεκλείδωσε το δώρο</h1>
            <p className="mt-2 text-sm text-white/60">Γράψε τον μυστικό κωδικό που σας έδωσε η διοργανώτρια όταν περάσατε τη δοκιμασία.</p>
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ΜΥΣΤΙΚΟΣ ΚΩΔΙΚΟΣ"
            aria-label="Μυστικός κωδικός"
            className="h-14 w-full rounded-2xl border border-[#E8C26B]/50 bg-[#1C1C1E] px-4 text-center text-lg font-bold uppercase tracking-[0.25em] text-[#E8C26B] focus:border-[#E8C26B] focus:outline-none"
          />
          <button type="submit" disabled={busy || !code.trim()} className="h-14 w-full rounded-full bg-[#E8C26B] text-lg font-bold text-black disabled:opacity-50">
            {busy ? 'Έλεγχος…' : 'Ξεκλείδωμα'}
          </button>
          {error && <div role="alert" className="text-sm font-semibold text-[#FF8A80]">{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-[#F5F1E8] p-5 pb-14">
      <div className="mx-auto max-w-md space-y-4">
        <div className="pt-4 text-center">
          <div className="text-6xl">🎁✨</div>
          <h1 className="mt-2 text-3xl font-bold text-[#E8C26B]">{gift.title || 'Το δώρο ξεκλειδώθηκε'}</h1>
        </div>
        {gift.vow && <p className="rounded-2xl border border-[#E8C26B]/30 bg-[#1C1C1E] p-4 text-center text-sm leading-relaxed text-white/85">{gift.vow}</p>}
        <div className="space-y-1 rounded-3xl border border-[#E8C26B]/60 bg-[#17140C] p-5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/50">Προσωπικό πάσο</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Γράψε το όνομά σου"
            className="w-full border-b border-[#E8C26B]/40 bg-transparent py-1 text-center text-2xl font-bold placeholder:text-white/30 focus:outline-none" />
          {gift.passTitle && <div className="pt-1 text-base font-semibold text-[#E8C26B]">{gift.passTitle}</div>}
        </div>
        <div className="space-y-2 rounded-3xl border border-[#E8C26B] bg-[#E8C26B]/10 p-5 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#E8C26B]">Το ομαδικό δώρο</div>
          <div className="text-3xl font-bold">{gift.giftName}</div>
          {gift.giftText && <p className="text-sm leading-relaxed text-white/85">{gift.giftText}</p>}
        </div>
      </div>
    </div>
  );
}
