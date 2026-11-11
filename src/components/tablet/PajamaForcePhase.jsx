import React, { useState } from 'react';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';

export default function PajamaForcePhase({ pj, updateState }) {
  const [open, setOpen] = useState(false);

  function jump(patch) {
    updateState({ pajama: { ...pj, ...patch } });
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-40 px-3 py-2 rounded-xl font-heading text-sm bg-slate-900/90 border border-amber-400/60 text-amber-100"
      >
        ⏭ ΑΛΛΑΓΗ ΦΑΣΗΣ
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-amber-400/50 bg-purple-950 p-4 space-y-2 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="font-heading text-lg text-amber-100">⏭ ΧΕΙΡΟΚΙΝΗΤΗ ΑΛΛΑΓΗ</div>
              <button onClick={() => setOpen(false)} className="text-pink-300 text-sm px-2">✕</button>
            </div>
            <p className="text-xs text-pink-200/70">
              Τρέχουσα φάση: <b className="text-pink-100">{pj.phase}</b> · πράξη {(pj.actIndex || 0) + 1}
            </p>

            {PAJAMA_ACTS.map((a, i) => (
              <button
                key={a.id}
                onClick={() => jump({ phase: 'act-intro', actIndex: i, actRound: 1, activeCard: null })}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                  i === (pj.actIndex || 0)
                    ? 'border-amber-400/70 bg-amber-900/40 text-amber-100'
                    : 'border-pink-500/40 bg-pink-950/60 text-pink-100'
                }`}
              >
                <b>ΠΡΑΞΗ {a.roman}</b> · {a.title}
                <div className="text-[11px] text-pink-300/80">{a.zone === 'night' ? '🌙 βράδυ' : '☀️ πρωί'} · {a.kind}</div>
              </button>
            ))}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => jump({ phase: 'setup' })}
                className="py-2 rounded-lg font-heading text-sm bg-slate-800 text-pink-100"
              >
                ↩ SETUP
              </button>
              <button
                onClick={() => jump({ phase: 'finale' })}
                className="py-2 rounded-lg font-heading text-sm bg-amber-600 text-white"
              >
                👑 ΦΙΝΑΛΕ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}