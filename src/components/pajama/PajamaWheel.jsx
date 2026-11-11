import React, { useState } from 'react';
import { PAJAMA_WHEEL } from '@/data/pajamaContent';
import PajamaTimer from '@/components/pajama/PajamaTimer';

export default function PajamaWheel({ player, players = [], index, total, onScore, onDouble, onSwap, onNext }) {
  const [highlight, setHighlight] = useState(null);
  const [result, setResult] = useState(null);
  const [resolved, setResolved] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [coin, setCoin] = useState(null);

  function spin() {
    setResult(null);
    setResolved(false);
    setSwapTarget(null);
    setCoin(null);
    let ticks = 0;
    const timer = setInterval(() => {
      setHighlight(Math.floor(Math.random() * PAJAMA_WHEEL.length));
      ticks += 1;
      if (ticks > 14) {
        clearInterval(timer);
        const finalIdx = Math.floor(Math.random() * PAJAMA_WHEEL.length);
        const seg = PAJAMA_WHEEL[finalIdx];
        setHighlight(finalIdx);
        setResult(seg);
        if (seg.id === 'double') onDouble();
        if (!['tickle', 'swap', 'allornothing'].includes(seg.id)) setResolved(true);
      }
    }, 110);
  }

  const others = players.filter((p) => p.id !== player?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="text-center">
          <div className="font-heading text-2xl text-pink-100">🎡 LUCKY SLIPPER WHEEL</div>
          <div className="text-sm text-pink-300">{index + 1}/{total} · {player?.name}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PAJAMA_WHEEL.map((seg, i) => (
            <div
              key={seg.id}
              className={`rounded-xl border p-3 text-center transition-all ${PAJAMA_WHEEL.length % 2 === 1 && i === PAJAMA_WHEEL.length - 1 ? 'col-span-2' : ''} ${highlight === i ? 'border-pink-300 bg-pink-600 scale-[1.03]' : 'border-pink-500/30 bg-pink-950/50'}`}
            >
              <div className="text-2xl">{seg.icon}</div>
              <div className="text-sm font-bold mt-1">{seg.label}</div>
            </div>
          ))}
        </div>

        {!result ? (
          <button onClick={spin} className="w-full py-3 rounded-lg font-heading text-xl bg-pink-600 text-white">
            ΓΥΡΙΣΕ ΤΟΝ ΤΡΟΧΟ
          </button>
        ) : (
          <div className="rounded-xl border border-pink-500/50 bg-pink-950/60 p-4 space-y-3">
            <div className="font-heading text-xl text-pink-100">{result.icon} {result.label}</div>
            {result.id === 'swap' && (
              <>
                <p className="text-sm text-pink-100/80">
                  Διάλεξε με ποιαν ανταλλάσσει παντόφλες για τους επόμενους δύο γύρους.
                </p>
                {others.length === 0 && <p className="text-sm text-rose-200">Χρειάζεται τουλάχιστον μία ακόμη παίκτρια.</p>}
                <div className="grid grid-cols-2 gap-2">
                  {others.map((p) => (
                    <button
                      key={p.id}
                      disabled={!!swapTarget}
                      onClick={() => { setSwapTarget(p); onSwap(p.id); setResolved(true); }}
                      className="py-3 rounded-lg font-heading bg-pink-800/70 hover:bg-pink-700 text-white disabled:opacity-40"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                {swapTarget && (
                  <p className="text-sm font-bold text-pink-100">👟 {player?.name} ⇄ {swapTarget.name} — δύο γύροι.</p>
                )}
              </>
            )}
            {result.id === 'safe' && <p className="text-sm text-pink-100/80">Δεν συμβαίνει τίποτα. Ασφαλής.</p>}
            {result.id === 'double' && <p className="text-sm text-pink-100/80">Ο επόμενος βαθμολογούμενος πόντος της {player?.name} μετράει διπλός.</p>}
            {result.id === 'allornothing' && (
              <>
                <p className="text-sm text-pink-100/80">
                  Ρίχνει το νόμισμα: <b className="text-emerald-200">+4</b> ή <b className="text-rose-200">-2</b>. Καμία επιλογή.
                </p>
                {!resolved ? (
                  <button
                    onClick={() => {
                      const win = Math.random() < 0.5;
                      setCoin(win ? 'win' : 'lose');
                      onScore(win ? 4 : -2);
                      setResolved(true);
                    }}
                    className="w-full py-3 rounded-lg font-heading text-lg bg-amber-500 text-pink-950"
                  >
                    🪙 ΡΙΞΕ ΤΟ ΝΟΜΙΣΜΑ
                  </button>
                ) : (
                  <div className={`rounded-lg px-3 py-2 text-center font-heading text-xl ${coin === 'win' ? 'bg-emerald-800/70 text-emerald-100' : 'bg-rose-900/70 text-rose-100'}`}>
                    {coin === 'win' ? '💥 ΔΙΠΛΟ — +4' : '🕳️ ΤΙΠΟΤΑ — -2'}
                  </div>
                )}
              </>
            )}
            {result.id === 'tickle' && (
              <>
                <p className="text-sm text-pink-100/80">Δέσε τα χέρια της με κορδέλα πιτζάμας. Αντέχει 15″ χωρίς να γελάσει;</p>
                <PajamaTimer seconds={result.timer} />
                {!resolved && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { onScore(2); setResolved(true); }} className="py-3 rounded-lg font-heading bg-emerald-600 text-white">
                      ΑΝΤΕΞΕ +2
                    </button>
                    <button onClick={() => { onScore(-1); setResolved(true); }} className="py-3 rounded-lg font-heading bg-rose-700 text-white">
                      ΓΕΛΑΣΕ -1
                    </button>
                  </div>
                )}
              </>
            )}
            {resolved && (
              <button onClick={onNext} className="w-full py-3 rounded-lg font-heading bg-pink-600 text-white">
                ΕΠΟΜΕΝΗ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}