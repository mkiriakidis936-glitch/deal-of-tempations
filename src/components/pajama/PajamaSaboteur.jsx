import React, { useState } from 'react';
import { PAJAMA_SABOTAGE_ACTIONS } from '@/data/pajamaSabotage';

export default function PajamaSaboteur({ players, pj, onSabotage, onCompleteOrder, onClose }) {
  const [me, setMe] = useState(null);
  const [action, setAction] = useState(null);
  const [target, setTarget] = useState(null);

  const isSaboteur = !!me && me === pj.saboteurId;
  const used = pj.sabotageRound === pj.round;
  const others = players.filter((p) => p.id !== me);

  function submit() {
    onSabotage(me, target.id, action.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-fuchsia-500/50 bg-purple-950 p-4 space-y-3 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="font-heading text-lg text-fuchsia-200">😈 SECRET SABOTEUR</div>
          <button onClick={onClose} className="text-pink-300 text-sm px-2">✕</button>
        </div>

        {!me && (
          <>
            <p className="text-sm text-pink-200/80">Ποια κρατάει το tablet; Καμία άλλη δεν κοιτάει.</p>
            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setMe(p.id)}
                  className="py-2 rounded-lg bg-pink-900/60 border border-pink-500/40 text-sm"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </>
        )}

        {me && !isSaboteur && (
          <div className="rounded-lg border border-pink-500/30 bg-pink-950/60 p-3 text-sm text-pink-100/90 space-y-2">
            <div>🔒 Δεν έχεις σαμποτάζ.</div>
            <div className="text-xs text-pink-300/80">Κλείσε αμέσως — ο πραγματικός Saboteur κυκλοφορεί ανάμεσά σας.</div>
            <button onClick={() => { setMe(null); setAction(null); setTarget(null); }} className="text-xs underline text-pink-300">
              Πίσω
            </button>
          </div>
        )}

        {isSaboteur && pj.secretOrder && (
          <div className="rounded-lg border border-fuchsia-400/60 bg-fuchsia-950/60 p-3 space-y-1.5">
            <div className="text-[11px] uppercase tracking-widest text-fuchsia-300">🔒 Κρυφή οδηγία · γύρος {pj.round}</div>
            <div className="font-heading text-base text-fuchsia-100">
              {pj.secretOrder.icon} {pj.secretOrder.title}
            </div>
            <div className="text-xs text-fuchsia-100/80">{pj.secretOrder.text}</div>
            {pj.secretOrderDone ? (
              <div className="text-xs font-bold text-emerald-300">✅ Ολοκληρώθηκε · +{pj.secretOrder.points} πόντοι</div>
            ) : (
              <button
                onClick={() => onCompleteOrder(me)}
                className="w-full py-2 rounded-lg font-heading text-sm bg-emerald-600 text-white"
              >
                ✅ ΤΟ ΕΚΑΝΑ (+{pj.secretOrder.points})
              </button>
            )}
            {pj.secretOrders?.length > 0 && (
              <div className="text-[10px] text-fuchsia-200/70">
                Μέχρι τώρα: {pj.secretOrders.map((o) => `Γ${o.round} ${o.icon}`).join(' · ')}
              </div>
            )}
          </div>
        )}

        {isSaboteur && used && (
          <div className="rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/50 p-3 text-sm text-fuchsia-100 space-y-2">
            <div>🕯️ Έχεις ήδη σαμποτάρει αυτόν τον γύρο. Μία φορά ανά γύρο.</div>
            {pj.sabotages?.length > 0 && (
              <div className="text-xs text-fuchsia-200/80 space-y-0.5">
                {pj.sabotages.map((s, i) => (
                  <div key={i}>{s.icon} Γύρος {s.round}: {s.targetName} — {s.action}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {isSaboteur && !used && !action && (
          <>
            <p className="text-sm text-pink-200/80">Διάλεξε σαμποτάζ. Θα πάρεις +3, η στόχος −1.</p>
            <div className="space-y-2">
              {PAJAMA_SABOTAGE_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAction(a)}
                  className="w-full text-left rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/40 hover:bg-fuchsia-900/50 px-3 py-2"
                >
                  <div className="font-heading text-sm text-fuchsia-100">{a.icon} {a.title}</div>
                  <div className="text-xs text-fuchsia-200/70 mt-0.5">{a.text}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {isSaboteur && !used && action && !target && (
          <>
            <div className="text-xs text-fuchsia-300/80">{action.icon} {action.title} — διάλεξε στόχο</div>
            <div className="grid grid-cols-2 gap-2">
              {others.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTarget(p)}
                  className="py-2 rounded-lg bg-pink-900/60 border border-pink-500/40 text-sm"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button onClick={() => setAction(null)} className="text-xs underline text-pink-300">Αλλαγή σαμποτάζ</button>
          </>
        )}

        {isSaboteur && !used && action && target && (
          <div className="space-y-2">
            <div className="rounded-lg border border-fuchsia-500/50 bg-fuchsia-950/60 p-3 text-sm text-fuchsia-50">
              {action.icon} <b>{action.title}</b> → <b>{target.name}</b>
              <div className="text-xs text-fuchsia-200/80 mt-1">{action.text}</div>
            </div>
            <button onClick={submit} className="w-full py-3 rounded-lg font-heading bg-fuchsia-600 text-white">
              ΕΚΤΕΛΕΣΗ ΣΑΜΠΟΤΑΖ (+3)
            </button>
            <button onClick={() => setTarget(null)} className="text-xs underline text-pink-300">Πίσω</button>
          </div>
        )}
      </div>
    </div>
  );
}