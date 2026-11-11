import React from 'react';

// TV display for FinalePresentation — mirrors the Tablet's presentation phase for the audience.
export default function FinaleTV({ state }) {
  const finale = state.finalePresentation;
  if (!finale?.active) return null;

  const awards = finale.awards || [];
  const players = state.players || [];

  if (finale.phase === 'recap') {
    return (
      <div className="fixed inset-0 z-[65] bg-background flex flex-col items-center justify-center">
        <div className="font-heading text-2xl text-tarot-gold mb-6">📜 RECAP ΣΤΙΓΜΩΝ</div>
        <div className="text-9xl comic-pulse">🎬</div>
        <div className="font-body text-xl text-foreground/50 mt-6 italic">Αναπαράσταση γεγονότων...</div>
      </div>
    );
  }

  if (finale.phase === 'awards') {
    const award = awards[finale.awardIndex];
    if (!award) return null;
    return (
      <div className="fixed inset-0 z-[65] bg-background flex flex-col items-center justify-center">
        <div className="cinv-sealglow absolute" style={{ width: 500, height: 500 }} />
        <div className="font-heading text-2xl text-tarot-gold mb-4">🏅 ΤΕΛΕΤΗ ΒΡΑΒΕΩΝ</div>
        <div className="text-9xl mb-4 comic-pulse">{award.icon}</div>
        <div className="font-heading text-4xl comic-text-stroke text-tarot-gold mb-3">{award.title}</div>
        <div className="font-heading text-7xl text-primary comic-text-stroke mb-4">{award.winner}</div>
        <div className="text-lg text-foreground/70 font-body max-w-xl text-center px-4">{award.description}</div>
      </div>
    );
  }

  if (finale.phase === 'stats') {
    const sorted = [...players].sort((a, b) => (b.penaltyStep || 0) - (a.penaltyStep || 0));
    return (
      <div className="fixed inset-0 z-[65] bg-background flex flex-col items-center justify-center p-8">
        <div className="font-heading text-4xl comic-text-stroke text-tarot-gold mb-6">📊 ΑΠΟΤΕΛΕΣΜΑΤΑ</div>
        <div className="space-y-2 max-w-2xl w-full">
          {sorted.map((p, i) => (
            <div key={p.id} className="comic-panel bg-card p-3 flex items-center gap-4">
              <div className="font-heading text-3xl text-primary w-10">{i + 1}.</div>
              <div className="flex-1">
                <div className="font-heading text-2xl text-foreground">{p.name}</div>
                <div className="text-sm text-foreground/60 font-body">{p.penaltyStep || 0} ποινές · ${p.loot || 0}</div>
              </div>
              <div className="text-3xl">{i === 0 ? '👑' : i === sorted.length - 1 ? '😇' : '🎭'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (finale.phase === 'complete') {
    return (
      <div className="fixed inset-0 z-[65] bg-background flex flex-col items-center justify-center">
        <div className="text-9xl mb-4">🥂</div>
        <div className="font-heading text-6xl comic-text-stroke text-tarot-gold">ΕΥΧΑΡΙΣΤΟΥΜΕ!</div>
        <div className="text-xl text-foreground/60 font-body mt-4">Η βραδιά ολοκληρώθηκε</div>
      </div>
    );
  }

  return null;
}