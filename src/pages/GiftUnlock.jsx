import React, { useEffect, useState } from 'react';

// /gift-unlock — η καλεσμένη βάζει τον κωδικό που της δίνει η διοργανώτρια και «ανοίγει» το δώρο.
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

const vibrate = (pattern = [30, 40, 30]) => { try { navigator.vibrate?.(pattern); } catch { /* δεν υποστηρίζεται */ } };
const reduceMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

const STYLE = `
@keyframes gift-shake { 0%,100% { transform: rotate(0) } 20% { transform: rotate(-7deg) } 40% { transform: rotate(6deg) } 60% { transform: rotate(-4deg) } 80% { transform: rotate(3deg) } }
@keyframes gift-lid { to { transform: translateY(-70px) rotate(-18deg); opacity: 0 } }
@keyframes gift-burst { 0% { transform: scale(.2); opacity: 0 } 40% { opacity: 1 } 100% { transform: scale(1.8); opacity: 0 } }
@keyframes gift-rise { from { transform: translateY(18px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes gift-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
.gift-float { animation: gift-float 3.2s ease-in-out infinite }
.gift-shake { animation: gift-shake .6s ease-in-out }
.gift-lid-open { animation: gift-lid .7s cubic-bezier(.32,.72,0,1) forwards }
.gift-burst { animation: gift-burst 1.1s ease-out forwards }
.gift-rise { animation: gift-rise .7s cubic-bezier(.32,.72,0,1) both }
@media (prefers-reduced-motion: reduce) { .gift-float, .gift-shake, .gift-lid-open, .gift-burst, .gift-rise { animation: none !important } }
`;

function GiftBox({ open = false, shake = false }) {
  return (
    <div className={`relative mx-auto h-40 w-40 ${shake ? 'gift-shake' : open ? '' : 'gift-float'}`} aria-hidden="true">
      {open && <div className="gift-burst absolute inset-[-40px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(247,227,168,.75), rgba(232,194,107,0) 65%)' }} />}
      <div className="absolute inset-x-3 bottom-0 h-24 rounded-[22px]" style={{ background: 'linear-gradient(180deg,#2A2112,#17140C)', border: '1px solid rgba(232,194,107,.55)' }} />
      <div className="absolute bottom-0 left-1/2 h-24 w-5 -translate-x-1/2" style={{ background: 'linear-gradient(180deg,#F5DC9A,#D4A94A)' }} />
      <div className={`absolute inset-x-0 top-6 h-10 rounded-[16px] ${open ? 'gift-lid-open' : ''}`} style={{ background: 'linear-gradient(180deg,#3A2D16,#211A0C)', border: '1px solid rgba(232,194,107,.7)' }}>
        <div className="absolute left-1/2 top-0 h-full w-5 -translate-x-1/2" style={{ background: 'linear-gradient(180deg,#F5DC9A,#D4A94A)' }} />
        <div className="absolute -top-7 left-1/2 flex -translate-x-1/2 gap-1">
          <span className="block h-7 w-9 rounded-full border-[5px] border-[#E8C26B]" style={{ transform: 'rotate(-25deg)' }} />
          <span className="block h-7 w-9 rounded-full border-[5px] border-[#E8C26B]" style={{ transform: 'rotate(25deg)' }} />
        </div>
      </div>
    </div>
  );
}

export default function GiftUnlock() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [gift, setGift] = useState(null);
  const [opening, setOpening] = useState(false);
  const [shake, setShake] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { document.title = 'Το δώρο σας — Deal of Temptation'; }, []);

  async function unlock(event) {
    event?.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/entities/gift-unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Ο κωδικός δεν είναι σωστός.');
      setOpening(true);
      playChime();
      vibrate();
      setTimeout(() => { setGift(data); vibrate([20, 30, 20, 30, 60]); }, reduceMotion() ? 0 : 900);
    } catch (e) {
      setError(e.message || 'Δεν ήταν δυνατός ο έλεγχος. Δοκίμασε ξανά.');
      setShake(true);
      vibrate([80]);
      setTimeout(() => setShake(false), 650);
    } finally {
      setBusy(false);
    }
  }

  if (!gift) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black p-5 text-[#F5F1E8]" style={{ backgroundImage: 'radial-gradient(600px 380px at 50% 28%, rgba(232,194,107,.14), transparent 70%)' }}>
        <style>{STYLE}</style>
        <form onSubmit={unlock} className="w-full max-w-sm space-y-6 text-center">
          <GiftBox open={opening} shake={shake} />
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.25em] text-[#E8C26B]">Deal of Temptation</div>
            <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">Ένα δώρο σας περιμένει</h1>
            <p className="mt-2 text-[15px] text-white/60">Γράψτε τον μυστικό κωδικό που σας έδωσε η διοργανώτρια όταν περάσατε τη δοκιμασία.</p>
          </div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="one-time-code"
            spellCheck={false}
            placeholder="Μυστικός κωδικός"
            aria-label="Μυστικός κωδικός"
            className="h-16 w-full rounded-2xl bg-[#1C1C1E] px-4 text-center text-2xl font-bold tracking-[0.3em] text-[#F7E3A8] placeholder:text-base placeholder:font-medium placeholder:tracking-normal placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#E8C26B]"
          />
          <button type="submit" disabled={busy || opening || !code.trim()} className="h-14 w-full rounded-full bg-[#E8C26B] text-[17px] font-bold text-black transition active:scale-[0.98] disabled:opacity-40">
            {opening ? 'Ανοίγει…' : busy ? 'Έλεγχος…' : 'Άνοιξε το δώρο'}
          </button>
          {error && <div role="alert" className="rounded-2xl bg-[#FF453A]/12 px-4 py-3 text-[15px] font-semibold text-[#FF8A80]">{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black p-5 pb-14 text-[#F5F1E8]" style={{ backgroundImage: 'radial-gradient(700px 420px at 50% 0%, rgba(232,194,107,.18), transparent 70%)' }}>
      <style>{STYLE}</style>
      <div className="mx-auto max-w-md space-y-4">
        <div className="gift-rise pt-6 text-center">
          <div className="text-[13px] font-semibold uppercase tracking-[0.25em] text-[#E8C26B]">Ξεκλειδώθηκε</div>
          <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-tight text-[#F7E3A8]">{gift.title || 'Το δώρο σας'}</h1>
        </div>
        <div className="gift-rise rounded-3xl bg-gradient-to-b from-[#2A2112] to-[#17140C] p-6 text-center ring-1 ring-[#E8C26B]/50" style={{ animationDelay: '.12s' }}>
          <div className="text-5xl">🎁</div>
          <div className="mt-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">Το ομαδικό δώρο</div>
          <div className="mt-1 text-[30px] font-bold leading-tight">{gift.giftName}</div>
          {gift.giftText && <p className="mt-2 text-[15px] leading-relaxed text-white/85">{gift.giftText}</p>}
        </div>
        {gift.vow && <p className="gift-rise rounded-3xl bg-[#1C1C1E] p-5 text-center text-[15px] leading-relaxed text-white/85" style={{ animationDelay: '.24s' }}>{gift.vow}</p>}
        <div className="gift-rise space-y-2 rounded-3xl bg-[#1C1C1E] p-5 text-center" style={{ animationDelay: '.36s' }}>
          <div className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/50">Προσωπικό πάσο</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Γράψε το όνομά σου" aria-label="Το όνομά σου"
            className="w-full rounded-2xl bg-black/40 px-4 py-3 text-center text-2xl font-bold placeholder:text-base placeholder:font-medium placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#E8C26B]" />
          {gift.passTitle && <div className="pt-1 text-[17px] font-semibold text-[#E8C26B]">{gift.passTitle}</div>}
          <p className="text-xs text-white/40">Κράτα στιγμιότυπο οθόνης — είναι το πάσο σου.</p>
        </div>
      </div>
    </div>
  );
}
