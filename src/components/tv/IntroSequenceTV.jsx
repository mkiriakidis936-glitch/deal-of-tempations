import React, { useEffect, useState } from 'react';
import { getPlayerColor } from '@/components/shared/BoardView';

const TITLE_SECS = 4;
const GAP = 2.4;
const OUTRO_SECS = 3.5;

// Cinematic intro for the TV — reveals the players one by one.
export default function IntroSequenceTV({ state }) {
  const intro = state.intro;
  const startedAt = intro?.startedAt || 0;
  const players = state.players || [];
  const [now, setNow] = useState(Date.now());
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
  }, [startedAt]);

  useEffect(() => {
    if (!intro?.active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(id);
  }, [intro?.active, startedAt]);

  const elapsed = (now - startedAt) / 1000;
  const total = TITLE_SECS + players.length * GAP + OUTRO_SECS;

  useEffect(() => {
    if (intro?.active && elapsed > total) setHidden(true);
  }, [elapsed, total, intro?.active]);

  if (!intro?.active || hidden) return null;

  const activeIdx = Math.floor((elapsed - TITLE_SECS) / GAP);
  const isTitle = elapsed < TITLE_SECS;
  const isOutro = activeIdx >= players.length;
  const current = !isTitle && !isOutro ? players[activeIdx] : null;

  return (
    <div
      onClick={() => setHidden(true)}
      className="fixed inset-0 z-[85] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-background p-8 text-center"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 45%, hsl(var(--primary) / 0.12), transparent 62%)' }}
      />

      {isTitle && (
        <div className="relative animate-fade-up">
          <div className="ds-eyebrow text-primary/70">Απόψε</div>
          <h1 className="ds-title mt-6 text-5xl leading-[1.05] sm:text-7xl">Deal of<br />Temptation</h1>
          <div className="ds-rule mx-auto mt-8 w-40" />
          <div className="ds-label mt-6 text-foreground/45">Η νύχτα ξεκινά</div>
        </div>
      )}

      {current && (
        <div className="relative animate-fade-up">
          <div className="ds-eyebrow text-primary/70">Παίκτρια {activeIdx + 1}</div>
          <div
            className="mt-6 font-display text-6xl leading-none tracking-[0.04em] sm:text-8xl"
            style={{ color: getPlayerColor(current.id) }}
          >
            {current.name}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {players.slice(0, activeIdx).map((p) => (
              <span key={p.id} className="font-body text-sm text-foreground/35">{p.name}</span>
            ))}
          </div>
        </div>
      )}

      {isOutro && (
        <div className="relative animate-fade-up">
          <div className="ds-eyebrow text-primary/70">Έναρξη</div>
          <h2 className="ds-title mt-6 text-6xl">Ας αρχίσουμε</h2>
          <div className="ds-lede mt-4 text-sm">
            {players.length} παίκτριες · μία νύχτα · καμία ασφάλεια
          </div>
        </div>
      )}

      <div className="ds-label absolute bottom-8 text-foreground/25">
        Πάτα για παράλειψη
      </div>
    </div>
  );
}