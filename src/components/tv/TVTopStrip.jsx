import React from 'react';

function Stat({ label, children, accent }) {
  return (
    <div className="comic-panel flex items-center gap-3 px-4 py-2">
      <div className="min-w-0">
        <div className={accent ? 'ds-eyebrow text-primary/80' : 'ds-eyebrow'}>{label}</div>
        <div className="ds-value mt-1 text-2xl leading-none text-foreground">{children}</div>
      </div>
    </div>
  );
}

export default function TVTopStrip({ wantedLevel, mostWantedName, totalLoot, playerCount, sessionCode, stopActive }) {
  return (
    <div className="flex items-stretch gap-2 flex-wrap">
      <div className="comic-panel flex items-center gap-3 px-4 py-2 flex-1 min-w-[220px]">
        <div className="min-w-0">
          <div className="ds-eyebrow text-primary/80">Καταζήτηση</div>
          <div className="mt-1 text-xl leading-none tracking-[0.18em] text-primary">
            {'★'.repeat(wantedLevel)}{'☆'.repeat(Math.max(0, 5 - wantedLevel))}
          </div>
          <div className="ds-value mt-1 truncate text-sm text-foreground/75">{mostWantedName || '—'}</div>
        </div>
      </div>
      <Stat label="Λεία">${totalLoot.toLocaleString()}</Stat>
      <Stat label="Παίκτριες">{playerCount}</Stat>
      <div className="comic-panel flex items-center gap-3 px-4 py-2">
        <div>
          <div className="ds-eyebrow text-primary/80">Κωδικός</div>
          <div className="ds-value mt-1 text-2xl leading-none tracking-[0.14em] text-primary">{sessionCode}</div>
        </div>
        {stopActive && (
          <div className="comic-pulse rounded-md border border-destructive/50 bg-destructive/20 px-3 py-1 ds-label text-foreground">ΠΑΥΣΗ</div>
        )}
      </div>
    </div>
  );
}