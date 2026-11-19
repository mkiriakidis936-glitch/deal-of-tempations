import React, { useState } from 'react';

export default function PajamaSleep({ players, pj, act, onWake }) {
  const [confirm, setConfirm] = useState(false);
  const ranking = [...players].sort((a, b) => (pj.scores[b.id] || 0) - (pj.scores[a.id] || 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-pink-50 p-4 pb-16 flex items-center">
      <div className="max-w-xl mx-auto w-full space-y-3">
        <div className="text-center">
          <div className="text-6xl">🌙</div>
          <div className="font-heading text-3xl text-indigo-100 mt-2">Η ΝΥΧΤΑ ΕΚΛΕΙΣΕ</div>
          <div className="text-sm text-indigo-200/80">Πράξη IV ολοκληρώθηκε · το παιχνίδι κλειδώνει μέχρι το πρωί</div>
        </div>

        <div className="rounded-xl border border-indigo-400/40 bg-indigo-950/50 p-3">
          <div className="text-[10px] uppercase tracking-widest text-indigo-200 mb-1.5">Κατάταξη μέχρι τώρα</div>
          <div className="space-y-1">
            {ranking.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-indigo-100">{i + 1}. {p.name}</span>
                <b className="text-indigo-50">{pj.scores[p.id] || 0}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-indigo-400/30 bg-indigo-950/40 p-3 text-xs text-indigo-100/80 space-y-1">
          <div>😴 Ύπνος. Κλειστά τα φώτα, κλειστά τα τηλέφωνα.</div>
          <div>🧦 Τα σαμποτάζ μένουν κρυφά μέχρι την επιθεώρηση.</div>
          <div>☀️ Το πρωί ανοίγει η Πράξη {act?.roman} · «{act?.title}».</div>
        </div>

        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            className="w-full py-3 rounded-lg font-heading text-lg border border-indigo-400/60 bg-indigo-900/60 text-indigo-100"
          >
            🌅 ΞΥΠΝΗΣΑΜΕ
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-center text-xs text-amber-200">
              Σίγουρα; Το παιχνίδι θα συνεχίσει στην πρωινή Πράξη {act?.roman}.
            </div>
            <button onClick={onWake} className="w-full py-3 rounded-lg font-heading text-lg bg-amber-600 text-white">
              ΝΑΙ — ΑΝΟΙΓΜΑ ΠΡΩΙΝΗΣ ΠΡΑΞΗΣ {act?.roman}
            </button>
            <button onClick={() => setConfirm(false)} className="w-full py-2 rounded-lg text-sm text-indigo-200/70">
              Άκυρο, ακόμη νύστα
            </button>
          </div>
        )}
      </div>
    </div>
  );
}