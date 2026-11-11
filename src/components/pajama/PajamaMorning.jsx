import React, { useState } from 'react';
import PajamaTimer from '@/components/pajama/PajamaTimer';

const AUDIT_OPTIONS = [
  { id: 'both', label: 'Και οι δύο ✓', delta: 1, tone: 'bg-emerald-700' },
  { id: 'one', label: 'Μία μόνο', delta: -1, tone: 'bg-amber-700' },
  { id: 'none', label: 'Καμία', delta: -2, tone: 'bg-rose-800' },
  { id: 'tampered', label: 'Κόμπος / γκλίτερ', delta: -1, tone: 'bg-fuchsia-800' },
];

export default function PajamaMorning({ players, pj, onScore, onFinish }) {
  const [step, setStep] = useState('walk');
  const [judged, setJudged] = useState({});

  function judge(playerId, key, delta) {
    const tag = `${step}-${playerId}`;
    if (judged[tag]) return;
    setJudged({ ...judged, [tag]: key });
    onScore(playerId, delta);
  }

  function sabotageFor(name) {
    return (pj.sabotages || []).filter((s) => s.targetName === name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-pink-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="text-center pt-2">
          <div className="text-4xl">☀️</div>
          <div className="font-heading text-2xl text-amber-200">ΠΡΩΙΝΗ ΦΑΣΗ</div>
          <div className="text-xs text-pink-300">Ζώνη 2 · Ξύπνημα, κάλτσες, επιθεώρηση</div>
        </div>

        <div className="flex gap-2 text-xs">
          <div className={`flex-1 rounded-lg px-2 py-1 text-center border ${step === 'walk' ? 'border-amber-300 bg-amber-900/40 text-amber-100' : 'border-pink-500/30 text-pink-300/70'}`}>
            1 · ZOMBIE WALK
          </div>
          <div className={`flex-1 rounded-lg px-2 py-1 text-center border ${step === 'audit' ? 'border-amber-300 bg-amber-900/40 text-amber-100' : 'border-pink-500/30 text-pink-300/70'}`}>
            2 · SOCK AUDIT
          </div>
        </div>

        {step === 'walk' ? (
          <div className="rounded-xl border border-amber-400/50 bg-amber-950/40 p-3 space-y-3">
            <div className="font-heading text-xl text-amber-100">🧟 THE ZOMBIE WALK</div>
            <p className="text-sm text-amber-50/90">
              Όλες σηκώνονται από το κρεβάτι με κλειστά μάτια και περπατούν σαν ζόμπι μέχρι την κουζίνα,
              με τις πιο άβολες παντόφλες. Όποια ανοίξει τα μάτια ή βγει από τη γραμμή, χάνει.
            </p>
            <PajamaTimer seconds={90} />
            <div className="space-y-2">
              {players.map((p) => {
                const key = judged[`walk-${p.id}`];
                return (
                  <div key={p.id} className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading text-sm text-amber-100">{p.name}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => judge(p.id, 'pass', 2)}
                          disabled={!!key}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${key === 'pass' ? 'bg-emerald-600' : 'bg-emerald-800/70'} disabled:opacity-60`}
                        >
                          ✅ +2
                        </button>
                        <button
                          onClick={() => judge(p.id, 'fail', -1)}
                          disabled={!!key}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${key === 'fail' ? 'bg-rose-700' : 'bg-rose-900/70'} disabled:opacity-60`}
                        >
                          ❌ −1
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setStep('audit')} className="w-full py-3 rounded-lg font-heading text-lg bg-amber-600 text-white">
              ΕΠΟΜΕΝΟ: SOCK AUDIT →
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-400/50 bg-amber-950/40 p-3 space-y-3">
            <div className="font-heading text-xl text-amber-100">🧦 THE SOCK AUDIT</div>
            <p className="text-sm text-amber-50/90">
              Ελέγξτε τις κάλτσες όλων. Ό,τι βρεθεί — χαμένες, ανάποδες, δεμένες, γεμάτες γκλίτερ — μετράει.
            </p>
            <div className="space-y-2">
              {players.map((p) => {
                const key = judged[`audit-${p.id}`];
                const evidence = sabotageFor(p.name);
                return (
                  <div key={p.id} className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-2 space-y-1.5">
                    <div className="font-heading text-sm text-amber-100">{p.name}</div>
                    {evidence.length > 0 && (
                      <div className="text-[11px] text-fuchsia-200/90">
                        {evidence.map((s, i) => (
                          <div key={i}>😈 Γύρος {s.round}: {s.icon} {s.action}</div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      {AUDIT_OPTIONS.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => judge(p.id, o.id, o.delta)}
                          disabled={!!key}
                          className={`py-1.5 rounded-lg text-xs font-bold ${key === o.id ? o.tone : 'bg-slate-800/60'} disabled:opacity-60`}
                        >
                          {o.label} {o.delta > 0 ? `+${o.delta}` : o.delta}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={onFinish} className="w-full py-3 rounded-lg font-heading text-lg bg-pink-600 text-white">
              ΤΕΛΟΣ ΠΡΩΙΝΗΣ ΦΑΣΗΣ → ΦΙΝΑΛΕ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}