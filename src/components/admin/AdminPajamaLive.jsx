import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PAJAMA_BOARD, PAJAMA_NIGHT_LENGTH, SQUARE_META } from '@/data/pajamaBoard';

const PHASE_LABEL = {
  setup: 'SETUP',
  dashboard: 'ΤΑΜΠΛΟ',
  wheel: 'ΤΡΟΧΟΣ',
  confessions: 'ΕΞΟΜΟΛΟΓΗΣΕΙΣ',
  morning: 'ΠΡΩΙΝΗ ΦΑΣΗ',
  finale: 'ΦΙΝΑΛΕ',
};

export default function AdminPajamaLive() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let unsub = null;

    (async () => {
      try {
        const { items } = await base44.entities.GameSession.filter(
          { mode: 'pajama' },
          { sort: '-created_date', limit: 1 }
        );
        if (!alive) return;
        const found = items?.[0] || null;
        setSession(found);
        setLoading(false);
        if (found) {
          unsub = base44.entities.GameSession.subscribe((event) => {
            if (event.id === found.id) {
              setSession((prev) => (prev ? { ...prev, ...event.data } : prev));
            }
          });
        }
      } catch (e) {
        console.error('pajama live load error', e);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      if (unsub) unsub();
    };
  }, []);

  if (loading) return <div className="text-center font-heading text-xl comic-pulse">ΦΟΡΤΩΣΗ...</div>;

  if (!session) {
    return (
      <div className="comic-panel bg-secondary p-4 text-center text-sm text-foreground/70">
        Δεν υπάρχει ενεργή συνεδρία Pajama Mode. Ξεκίνα παιχνίδι από το Tablet με διάρκεια «Διανυκτέρευση».
      </div>
    );
  }

  const state = session.state || {};
  const pj = state.pajama || {};
  const players = state.players || [];
  const positions = pj.positions || {};
  const scores = pj.scores || {};
  const saboteur = players.find((p) => p.id === pj.saboteurId);

  return (
    <div className="space-y-3">
      <div className="comic-panel bg-fuchsia-950/60 p-3 space-y-1">
        <div className="font-heading text-xl text-pink-200">📡 ΖΩΝΤΑΝΗ ΣΥΝΕΔΡΙΑ · {session.sessionCode}</div>
        <div className="text-xs text-pink-200/80">
          Γύρος {pj.round || 1}/4 · Φάση: {PHASE_LABEL[pj.phase] || PHASE_LABEL.setup}
          {pj.boardFinish ? ` · 🏁 Τερματισμός: ${pj.boardFinish.name} (γύρος ${pj.boardFinish.round})` : ''}
        </div>
        {saboteur && (
          <div className="text-xs text-fuchsia-200">
            😈 Saboteur (ορατή μόνο σε σένα): <b>{saboteur.name}</b>
          </div>
        )}
      </div>

      <div className="comic-panel bg-card p-3 space-y-1">
        <div className="font-heading text-lg text-primary">Παίκτριες</div>
        {players.length === 0 && <div className="text-xs text-foreground/60">Καμία παίκτρια ακόμη.</div>}
        {players.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm text-foreground">
            <span>
              {p.name}
              {pj.bindings?.[p.id] ? ' 🎀' : ''}
            </span>
            <span className="flex items-center gap-3 text-xs">
              <span className="text-foreground/60">#{((positions[p.id] || 0) + 1)}</span>
              <b>{scores[p.id] || 0} π.</b>
            </span>
          </div>
        ))}
      </div>

      <div className="comic-panel bg-card p-3">
        <div className="font-heading text-lg text-primary mb-2">🗺️ Ταμπλό 44</div>
        <div className="grid grid-cols-11 gap-1">
          {PAJAMA_BOARD.map((sq) => {
            const meta = SQUARE_META[sq.type] || SQUARE_META.nails;
            const here = players.filter((p) => (positions[p.id] || 0) === sq.index);
            return (
              <div
                key={sq.index}
                className={`relative aspect-square rounded border flex items-center justify-center text-[9px] ${
                  sq.type === 'finish' ? 'bg-yellow-300 text-tarot-dark border-yellow-100' : 'bg-secondary border-border'
                }`}
                title={`#${sq.index + 1} · ${meta.label}`}
              >
                {meta.icon}
                {here.length > 0 && (
                  <span className="absolute bottom-0 right-0 text-[7px] font-bold bg-primary text-primary-foreground rounded px-0.5">
                    {here.map((p) => p.name.slice(0, 1)).join('')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-foreground/60 mt-1">
          Νύχτα: 1–{PAJAMA_NIGHT_LENGTH} · Πρωί: {PAJAMA_NIGHT_LENGTH + 1}–44
        </div>
      </div>

      <div className="comic-panel bg-card p-3 space-y-1">
        <div className="font-heading text-lg text-primary">Εξομολογήσεις &amp; Σαμποτάζ</div>
        <div className="text-xs text-foreground/80">
          Μυστικά: {pj.confessions?.length || 0}/{players.length} · Σαμποτάζ: {pj.sabotages?.length || 0} · Κρυφές οδηγίες: {pj.secretOrders?.length || 0}
        </div>
        {(pj.sabotages || []).map((s, i) => (
          <div key={i} className="text-xs text-foreground/70">
            Γύρος {s.round}: {s.icon} {s.action} → {s.targetName}
          </div>
        ))}
        {(pj.swaps || []).length > 0 && (
          <div className="text-xs text-foreground/70">
            👟 {pj.swaps.map((s) => `${s.playerName} ⇄ ${s.targetName}`).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}