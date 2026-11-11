import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function SealedVote({ state, updateState, selectedPlayerId }) {
  const sealed = state.sealedVotes || {};
  const activeVotes = Object.entries(sealed).filter(([_, v]) => !v.revealed);

  if (activeVotes.length === 0) return null;

  async function castVote(voteId, optionId) {
    const vote = sealed[voteId];
    const newVotes = { ...vote.votes, [selectedPlayerId]: optionId };
    await updateState({
      sealedVotes: { ...sealed, [voteId]: { ...vote, votes: newVotes } },
    });
  }

  return (
    <div className="space-y-2">
      {activeVotes.map(([vid, vote]) => {
        const myVote = vote.votes[selectedPlayerId];
        return (
          <ComicPanel key={vid} className="bg-tarot-crimson/30 comic-pop">
            <div className="font-heading text-lg text-primary mb-1">🗳️ ΣΦΡΑΓΙΣΜΕΝΗ ΨΗΦΟΦΟΡΙΑ</div>
            <div className="text-sm font-bold text-foreground mb-3 font-body">{vote.question}</div>
            <div className="space-y-2">
              {vote.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => castVote(vid, opt.id)}
                  className={`comic-panel-sm p-3 w-full text-left flex items-center justify-between transition-all ${
                    myVote === opt.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'
                  }`}
                >
                  <span className="font-bold text-foreground">{opt.label}</span>
                  {myVote === opt.id && <span className="text-primary text-xl">✓</span>}
                </button>
              ))}
            </div>
            {myVote && (
              <div className="text-center mt-2 text-xs font-bold text-primary comic-pulse">
                🔒 Ψήφισες — Αποκάλυψη στην TV!
              </div>
            )}
          </ComicPanel>
        );
      })}
    </div>
  );
}