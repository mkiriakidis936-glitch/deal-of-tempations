import React from 'react';

export default function InterrogationTV({ state }) {
  const currentPlayer = state.players?.[state.currentPlayerIndex];
  const card = state.activeCard;

  return (
    <div className="w-full max-w-3xl space-y-3">
      <div className="comic-panel bg-tarot-royal text-center py-4">
        <div className="font-heading text-4xl text-tarot-gold comic-text-stroke">🔍 ΑΝΑΚΡΙΣΗ</div>
        <div className="text-sm text-foreground/70 mt-1 font-body">Στάδιο 2 — Οι παγιδευμένες ανακρίνονται</div>
      </div>

      {currentPlayer && (
        <div className="comic-panel bg-card p-6 text-center">
          <div className="text-xs text-foreground/50 uppercase tracking-widest mb-2">Ανακρινόμενη</div>
          <div className="font-heading text-4xl text-primary mb-2">{currentPlayer.name}</div>
          <div className="text-sm text-foreground/60 font-body">
            ⭐ {currentPlayer.penaltyStep || 0} ποινές · 💰 ${(currentPlayer.loot || 0).toLocaleString()}
          </div>
        </div>
      )}

      {card ? (
        <div className="comic-panel bg-destructive p-6 comic-pop">
          <div className="text-center">
            <div className="text-5xl mb-2">{card.icon || '🎴'}</div>
            <div className="font-heading text-2xl text-foreground mb-2">{card.name}</div>
            <div className="text-xs font-bold text-foreground/70 mb-3">
              {state.cardAction === 'street_truth' ? '💬 ΑΛΗΘΕΙΑ' : state.cardAction === 'street_dare' ? '🔥 ΤΟΛΜΗ' : state.cardAction || 'ΚΑΡΤΑ'}
            </div>
            <div className="comic-panel-sm bg-background p-4">
              <p className="text-lg text-foreground font-body">{card.text}</p>
            </div>
            {card.duration && (
              <div className="mt-3 font-heading text-4xl text-tarot-gold comic-pulse">⏱ {card.duration}″</div>
            )}
          </div>
        </div>
      ) : (
        <div className="comic-panel bg-card p-6 text-center">
          <div className="text-foreground/50 font-body">Αναμονή επόμενης ανάκρισης...</div>
        </div>
      )}
    </div>
  );
}