import React, { useEffect, useState } from 'react';
import { scoreOf } from '@/lib/nightDirector';

// Overlay της TV: λωρίδα προόδου, banner ανατροπής και η Μεγάλη Αποκάλυψη.
export default function NightTV({ state }) {
  const night = state?.night;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!night) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [!!night]);
  if (!night) return null;

  const players = state.players || [];
  const nameOf = (pid) => players.find((p) => p.id === pid)?.name || '—';
  const round = night.program?.[night.roundIdx || 0];
  const twistLive = night.twist && now - night.twist.at < 15000;

  if (night.reveal) {
    const ranked = [...players].map((p) => ({ p, s: scoreOf(state, p) })).sort((a, b) => b.s - a.s);
    const showPodium = ranked.length >= 3 && ranked[0].s > 0;
    const podium = [ranked[1], ranked[0], ranked[2]];
    const heights = ['h-36', 'h-52', 'h-24'];
    const places = [2, 1, 3];
    return (
      <div className="fixed inset-0 z-[95] bg-background flex flex-col p-8 gap-6 overflow-y-auto">
        <div className="text-center">
          <div className="text-sm tracking-[0.3em] text-primary font-bold">ΤΕΛΟΣ ΒΡΑΔΙΑΣ</div>
          <div className="font-heading text-6xl text-foreground comic-text-stroke">Η ΜΕΓΑΛΗ ΑΠΟΚΑΛΥΨΗ</div>
        </div>
        <div className={`grid gap-8 flex-1 ${showPodium ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {showPodium && (
            <div className="flex items-end justify-center gap-3">
              {podium.map((x, i) => (
                <div key={x.p.id} className={`w-40 ${heights[i]} flex flex-col items-center justify-center comic-panel ${i === 1 ? 'bg-primary text-tarot-dark' : 'bg-card'}`}>
                  <div className="font-heading text-4xl">{places[i]}</div>
                  <div className="font-heading text-xl">{x.p.name}</div>
                  <div className="text-sm opacity-70">{x.s}</div>
                </div>
              ))}
            </div>
          )}
          <div className="comic-panel bg-card p-5 space-y-2 self-start">
            <div className="font-heading text-2xl text-primary">ΟΙ ΚΡΥΦΟΙ ΣΤΟΧΟΙ</div>
            {Object.entries(night.agendas || {}).map(([pid, a]) => (
              <div key={pid} className="flex items-center gap-3 border-t border-border pt-2">
                <div className="font-heading text-lg w-32 shrink-0">{nameOf(pid)}</div>
                <div className="flex-1 text-sm text-foreground/80">{a.text}</div>
                <div className={`px-3 py-1 text-xs font-bold ${a.done === true ? 'bg-primary text-tarot-dark' : a.done === false ? 'bg-destructive text-foreground' : 'bg-secondary text-foreground/60'}`}>
                  {a.done === true ? 'ΕΠΙΤΥΧΙΑ' : a.done === false ? 'ΑΠΕΤΥΧΕ' : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {round && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-30 comic-panel bg-tarot-royal text-tarot-gold px-4 py-1 font-heading text-sm">
          🎭 ΓΥΡΟΣ {(night.roundIdx || 0) + 1}/{night.program.length} · {round.title}
        </div>
      )}
      {twistLive && (
        <div className="fixed inset-x-0 top-1/3 z-[90] flex justify-center px-6 pointer-events-none">
          <div className="comic-panel bg-destructive p-6 text-center comic-strobe max-w-3xl">
            <div className="font-heading text-2xl text-foreground/80">⚡ ΑΝΑΤΡΟΠΗ</div>
            <div className="font-heading text-4xl text-foreground comic-text-stroke">{night.twist.text}</div>
          </div>
        </div>
      )}
    </>
  );
}
