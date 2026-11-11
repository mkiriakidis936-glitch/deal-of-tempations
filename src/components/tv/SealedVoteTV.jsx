import React from 'react';

export default function SealedVoteTV({ state }) {
  const sealed = state.sealedVotes || {};
  const entries = Object.entries(sealed);
  if (entries.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[50] space-y-2 w-full max-w-xl px-4">
      {entries.map(([vid, vote]) => {
        const voteCount = Object.keys(vote.votes).length;
        const totalPlayers = state.players?.length || 0;
        if (!vote.revealed) {
          return (
            <div key={vid} className="comic-panel bg-tarot-crimson p-4 text-center comic-pop">
              <div className="font-heading text-2xl text-tarot-gold comic-text-stroke">🗳️ ΨΗΦΟΦΟΡΙΑ ΣΕ ΕΞΕΛΙΞΗ</div>
              <div className="text-sm text-foreground/80 font-body mt-1">{vote.question}</div>
              <div className="text-3xl font-heading text-foreground mt-2 comic-pulse">
                🔒 {voteCount}/{totalPlayers}
              </div>
              <div className="text-xs text-foreground/50 font-body">Ψήφοι συγκεντρώνονται κρυφά...</div>
            </div>
          );
        }
        // Reveal mode
        const result = vote.result;
        return (
          <div key={vid} className="comic-panel bg-primary p-6 text-center comic-pop">
            <div className="font-heading text-xl text-tarot-dark mb-2">🗳️ ΑΠΟΤΕΛΕΣΜΑ ΨΗΦΟΦΟΡΙΑΣ</div>
            <div className="text-sm text-tarot-dark/70 font-body mb-3">{vote.question}</div>
            <div className="space-y-1 mb-3">
              {vote.options.map((opt) => {
                const count = result.counts?.[opt.id] || 0;
                const isWinner = result.winningOption?.id === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`flex justify-between items-center p-2 rounded ${isWinner ? 'bg-tarot-dark text-tarot-gold' : 'bg-tarot-dark/30 text-tarot-dark'}`}
                  >
                    <span className="font-heading">{isWinner && '🏆 '}{opt.label}</span>
                    <span className="font-heading text-xl">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-tarot-dark/60 font-body">Σύνολο: {result.totalVotes} ψήφοι</div>
          </div>
        );
      })}
    </div>
  );
}