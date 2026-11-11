import React, { useRef, useState } from 'react';
import PajamaTimer from '@/components/pajama/PajamaTimer';

export default function PajamaActBreak({ nextAct, minutes, onContinue }) {
  const [left, setLeft] = useState((minutes || 0) * 60);
  const doneRef = useRef(false);

  function go() {
    if (doneRef.current) return;
    doneRef.current = true;
    onContinue();
  }

  const clock = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-pink-50 p-4 pb-16 flex items-center">
      <div className="max-w-xl mx-auto w-full space-y-3">
        <div className="text-center">
          <div className="text-5xl">🫖</div>
          <div className="font-heading text-3xl text-pink-100 mt-1">ΔΙΑΛΕΙΜΜΑ</div>
          <div className="text-sm text-pink-300">
            {minutes}′ για νερό, τουαλέτα και κουτσομπολιό.
          </div>
        </div>

        <div className="rounded-xl border-2 border-amber-400/60 bg-amber-950/40 px-3 py-2 text-center">
          <div className="text-[10px] uppercase tracking-widest text-amber-300/80">Επόμενη πράξη σε</div>
          <div className="font-heading text-2xl text-amber-100">
            {nextAct ? `ΠΡΑΞΗ ${nextAct.roman} · ${clock}` : clock}
          </div>
        </div>

        <PajamaTimer seconds={(minutes || 0) * 60} autoStart onTick={setLeft} onComplete={go} />

        {nextAct && (
          <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3 text-center">
            <div className="text-[10px] uppercase tracking-widest text-pink-300">Αμέσως μετά</div>
            <div className="font-heading text-xl text-pink-100">
              ΠΡΑΞΗ {nextAct.roman} · {nextAct.title}
            </div>
            <div className="text-xs text-pink-300">{nextAct.subtitle}</div>
          </div>
        )}

        <button onClick={go} className="w-full py-3 rounded-lg font-heading text-lg bg-pink-600 text-white">
          ΣΥΝΕΧΕΙΑ →
        </button>
        <div className="text-center text-[11px] text-pink-300/60">Ξεκινά αυτόματα μόλις τελειώσει το χρονόμετρο.</div>
      </div>
    </div>
  );
}