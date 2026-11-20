import React from 'react';
import { ARREST_HEIST_LADDER, BOARD } from '@/data/gameConfig';
import MonopolyBoard from '@/components/tv/MonopolyBoard';
import { cn } from '@/lib/utils';

function PrisonCell({ leader, teamLabel, teamIcon, teamColor, points }) {
  const step = leader?.penaltyStep || 0;
  const max = 6;
  const cellDarkness = step / max;

  return (
    <div
      className="comic-panel p-4 relative overflow-hidden transition-all"
      style={{
        background: `linear-gradient(180deg, hsl(350 45% ${10 - cellDarkness * 6}%), hsl(350 45% ${6 - cellDarkness * 4}%))`,
      }}
    >
      {/* Team header */}
      <div className={cn('font-heading text-2xl text-center mb-3', teamColor)}>
        {teamIcon} {teamLabel}
      </div>

      {/* Mugshot area with prison bars */}
      <div className="relative bg-background/60 rounded-lg mx-auto mb-3 border-2 border-border overflow-hidden" style={{ maxWidth: 180, aspectRatio: '1' }}>
        {/* Mugshot number board */}
        <div className="absolute top-1 left-1 right-1 flex justify-between text-[10px] font-mono text-foreground/50">
          <span>FILE #{((leader?.name || 'X').charCodeAt(0) || 65) * 137 % 9000 + 1000}</span>
          <span>ROUND {step}/6</span>
        </div>

        {/* Mugshot silhouette */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
          <div className="text-5xl opacity-80">👤</div>
          <div className="font-heading text-sm text-foreground mt-1 text-center px-1 truncate max-w-full">
            {leader?.name || '—'}
          </div>
          {step >= 4 && <div className="text-xs text-foreground/50 mt-0.5">🦶 ΓΥΜΝΕΣ ΠΑΤΟΥΣΕΣ</div>}
        </div>

        {/* Prison bars — appear based on penalty */}
        <div className="absolute inset-0 grid grid-cols-6 gap-0 pointer-events-none">
          {Array.from({ length: max }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-full w-full transition-all duration-700',
                i < step ? 'bg-tarot-gold/25 border-l border-r border-tarot-gold/40' : 'bg-transparent'
              )}
            />
          ))}
        </div>

        {/* Lock overlay */}
        {step >= max && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40">
            <div className="text-5xl comic-pulse">🔒</div>
          </div>
        )}
      </div>

      {/* Locks row */}
      <div className="text-center mb-2">
        <div className="text-xl leading-tight tracking-wider">
          {Array.from({ length: max }).map((_, i) => (
            <span key={i}>{i < step ? '🔒' : '🔓'}</span>
          ))}
        </div>
        <div className="font-heading text-xs text-foreground/60 mt-0.5">{step}/{max} ΚΛΕΙΔΩΜΕΝΟ</div>
      </div>

      {/* Bounty */}
      <div className="text-center mb-3 comic-panel-sm bg-background/40 py-2">
        <div className="text-[10px] text-foreground/50 uppercase tracking-widest">💰 Bounty</div>
        <div className="font-heading text-3xl text-primary">${(points || 0).toLocaleString()}</div>
      </div>

      {/* Charges / Case File */}
      <div className="bg-background/40 rounded p-2 border border-border/50">
        <div className="font-heading text-[10px] text-primary mb-1 tracking-widest">📋 ΚΑΤΗΓΟΡΙΕΣ</div>
        <div className="space-y-0.5">
          {step === 0 && <div className="text-[10px] text-foreground/40 italic font-body">Καμία κατηγορία ακόμη</div>}
          {ARREST_HEIST_LADDER.slice(0, step).map((s) => (
            <div key={s.step} className="flex items-center gap-1 text-[11px] comic-slide-in">
              <span className="text-sm">{s.icon}</span>
              <span className="font-body text-foreground/80">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ArrestHeistTV({ state }) {
  const stage = state.stage || 1;
  const players = state.players || [];
  const leaderA = players.find((p) => p.team === 'A' && p.isLeader);
  const leaderB = players.find((p) => p.team === 'B' && p.isLeader);
  const pointsA = state.teamA?.points || 0;
  const pointsB = state.teamB?.points || 0;
  const boardPlayers = players.map((p) => ({ ...p, position: (state.heistPositions || {})[p.id] || 0 }));
  const round = state.round || 1;
  const maxRounds = 6;

  const totalPenalty = (leaderA?.penaltyStep || 0) + (leaderB?.penaltyStep || 0);
  const alarmPct = Math.min(100, (totalPenalty / 12) * 100);
  const alarmColor = alarmPct < 33 ? 'bg-tarot-forest' : alarmPct < 66 ? 'bg-tarot-gold' : 'bg-destructive';

  // Stage 2: Grand Heist
  if (stage === 2) {
    return (
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center space-y-4">
          <div className="text-8xl comic-pulse">💰</div>
          <div className="font-heading text-5xl comic-text-stroke text-primary">Μεγάλη Απόδραση</div>
          <div className="font-heading text-2xl text-foreground/70">Ξεκλείδωμα χρηματοκιβωτίου...</div>
          <div className="text-lg text-foreground/50">Σκανάρισμα QR → Ψηφιακός κωδικός</div>
        </div>
      </div>
    );
  }

  // Stage 3: Victory
  if (stage === 3) {
    const winner = state.grandHeist?.winner || 'A';
    return (
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center space-y-4">
          <div className="text-9xl comic-pulse">🎉</div>
          <div className="font-heading text-6xl comic-text-stroke text-primary">Νίκη</div>
          <div className="font-heading text-4xl text-foreground">{winner === 'A' ? '💖 TEAM ALPHA' : '💎 TEAM BETA'}</div>
        </div>
      </div>
    );
  }

  // Stage 1: Main game — Case File + Prison Cells + Vault Dial
  return (
    <div className="w-full max-w-5xl space-y-3">
      {/* Title bar */}
      <div className="comic-panel bg-destructive text-center py-3">
        <div className="font-heading text-3xl text-foreground comic-text-stroke">🚨 ARREST &amp; HEIST</div>
      </div>

      {/* Vault Dial — round indicator (D) */}
      <div className="comic-panel bg-card p-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="font-heading text-sm text-primary tracking-widest">🔐 VAULT DIAL</div>
        </div>
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: maxRounds }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-11 h-11 rounded-full border-2 flex items-center justify-center font-heading text-base transition-all',
                i < round - 1
                  ? 'bg-tarot-forest text-foreground border-tarot-forest'
                  : i === round - 1
                  ? 'bg-destructive text-foreground border-tarot-gold comic-pulse scale-110'
                  : 'bg-background text-foreground/30 border-border'
              )}
            >
              {i < round - 1 ? '✓' : i + 1}
            </div>
          ))}
        </div>
        <div className="text-center font-heading text-sm text-foreground/70 mt-2">ΓΥΡΟΣ {round} / {maxRounds}</div>
      </div>

      {/* Alarm meter (D) */}
      <div className="comic-panel bg-card p-3">
        <div className="flex items-center gap-3">
          <span className="font-heading text-sm text-primary whitespace-nowrap">🚨 ΣΥΝΑΓΕΡΜΟΣ</span>
          <div className="flex-1 h-5 bg-background rounded-full overflow-hidden border-2 border-border">
            <div className={cn('h-full transition-all duration-500', alarmColor)} style={{ width: `${alarmPct}%` }} />
          </div>
          <span className="font-heading text-sm text-foreground w-10 text-right">{Math.round(alarmPct)}%</span>
        </div>
      </div>

      <div className="comic-panel bg-card p-3 space-y-2">
        <div className="font-heading text-lg text-primary text-center">🗺️ HEIST &amp; ARREST — 44 BASES</div>
        <MonopolyBoard players={boardPlayers} board={BOARD} large />
      </div>

      {state.absoluteInterrogation?.active && (
        <div className="comic-panel bg-tarot-royal/30 p-4 space-y-2 text-center">
          <div className="font-heading text-2xl text-primary">⚖️ ABSOLUTE INTERROGATION · ΑΛΗΘΕΙΑ {state.absoluteInterrogation.step + 1}/3</div>
          <div className="text-lg">{state.players.find((p) => p.id === state.absoluteInterrogation.targetId)?.name}</div>
          <div className="text-xl">{state.absoluteInterrogation.questions?.[state.absoluteInterrogation.step]}</div>
          <div className="text-xs opacity-70">Μυστικές ψήφοι κινητών: {Object.keys(state.absoluteInterrogation.votes?.[state.absoluteInterrogation.step] || {}).length}/{Math.max(0, players.length - 1)}</div>
        </div>
      )}
      {state.interrogationVerdict && (
        <div className="comic-panel bg-tarot-gold/20 p-4 text-center">
          <div className="font-heading text-2xl text-primary">{state.interrogationVerdict.label}</div>
          <div className="text-sm">{state.interrogationVerdict.release ? 'Άμεση απελευθέρωση · +5.000€ · 1 Pass Card' : 'Ποινή ×' + state.interrogationVerdict.penaltyMultiplier + ' · Sensory Lock'}</div>
        </div>
      )}
      {state.bailoutAuction?.active && (
        <div className="comic-panel bg-tarot-forest/30 p-4 text-center">
          <div className="font-heading text-2xl text-primary">🔨 BAILOUT AUCTION LIVE</div>
          <div className="text-sm">Μυστικές προσφορές από τα κινητά · {Object.keys(state.bailoutAuction.bids || {}).length} συμμετοχές</div>
        </div>
      )}

      {/* Two prison cells (C + B) */}
      <div className="grid grid-cols-2 gap-4">
        <PrisonCell leader={leaderA} teamLabel="TEAM ALPHA" teamIcon="💖" teamColor="text-tarot-crimson" points={pointsA} />
        <PrisonCell leader={leaderB} teamLabel="TEAM BETA" teamIcon="💎" teamColor="text-tarot-teal" points={pointsB} />
      </div>
    </div>
  );
}