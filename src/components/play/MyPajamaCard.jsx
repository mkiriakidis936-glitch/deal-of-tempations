import React from 'react';

export default function MyPajamaCard({ pj = {}, me }) {
  if (!me) return null;
  const isSab = pj.saboteurId === me.id;
  const team = pj.teams?.[me.id];
  const order = pj.secretOrder;
  if (!isSab && !team) return null;

  return (
    <div className={`comic-panel p-3 ${isSab ? 'bg-fuchsia-950/80 border-fuchsia-400/60' : 'bg-secondary'}`}>
      <div className="text-[10px] uppercase tracking-widest text-foreground/60">Η κάρτα μου</div>
      {team && (
        <div className="text-sm text-foreground mt-1">
          Ομάδα <b className="text-primary">{team}</b>
        </div>
      )}
      {isSab && (
        <div className="space-y-1 mt-1">
          <div className="font-heading text-base text-fuchsia-200">😈 SECRET SABOTEUR</div>
          <div className="text-xs text-fuchsia-100/85">Μην το πεις σε καμία. Ένα σαμποτάζ ανά γύρο.</div>
          {order && !pj.secretOrderDone && (
            <div className="rounded bg-fuchsia-900/50 px-2 py-1 text-xs text-fuchsia-100">
              🔒 {order.icon} {order.title} · +{order.points || 3}
            </div>
          )}
          {pj.secretOrderDone && <div className="text-xs text-emerald-300">✓ Κρυφή εντολή ολοκληρώθηκε.</div>}
        </div>
      )}
    </div>
  );
}