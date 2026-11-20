import React from 'react';
import GameCard from '@/components/shared/GameCard';

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
        <GameCard
          variant="tv"
          kicker={state.cardAction === 'street_truth' ? 'Αλήθεια' : state.cardAction === 'street_dare' ? 'Τόλμη' : (state.cardAction || 'Κάρτα')}
          icon={card.icon || '🎴'}
          image={card.image}
          accent={state.cardAction === 'street_dare' ? '#FF453A' : '#E8C26B'}
          title={card.name}
          text={card.text}
          footRight={card.duration ? `⏱ ${card.duration}″` : null}
        />
      ) : (
        <div className="comic-panel bg-card p-6 text-center">
          <div className="text-foreground/50 font-body">Αναμονή επόμενης ανάκρισης...</div>
        </div>
      )}
    </div>
  );
}