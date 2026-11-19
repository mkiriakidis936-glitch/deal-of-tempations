import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';

export default function GrandJuryVote({ state, selectedPlayerId, updateState }) {
  const gj = state.grandJury;
  if (!gj || gj.phase !== 'voting') return null;

  const queenVotes = gj.queenVotes || {};
  const championVotes = gj.championVotes || {};
  const myQueen = queenVotes[selectedPlayerId];
  const myChampion = championVotes[selectedPlayerId];

  async function voteQueen(targetId) {
    await updateState({
      grandJury: { ...gj, queenVotes: { ...queenVotes, [selectedPlayerId]: targetId } },
    });
  }

  async function voteChampion(targetId) {
    await updateState({
      grandJury: { ...gj, championVotes: { ...championVotes, [selectedPlayerId]: targetId } },
    });
  }

  const others = (state.players || []).filter((p) => p.id !== selectedPlayerId);

  return (
    <>
      <ComicPanel className="bg-destructive/30">
        <div className="font-heading text-lg mb-1 text-primary">👑 QUEEN OF SHAME</div>
        <div className="text-xs mb-3 font-bold text-foreground/70 font-body">Ψήφισε ποια δέχεται την τελική μεγάλη ποινή</div>
        <div className="space-y-2">
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() => voteQueen(p.id)}
              className={`comic-panel-sm p-2 w-full text-left flex items-center justify-between transition-all text-foreground ${
                myQueen === p.id ? 'bg-destructive ring-2 ring-primary' : 'bg-secondary'
              }`}
            >
              <span className="font-bold">{p.name}</span>
              {myQueen === p.id && <span className="font-heading text-primary">✓</span>}
            </button>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-tarot-forest/30">
        <div className="font-heading text-lg mb-1 text-primary">🏆 CHAMPION OF SECRETS</div>
        <div className="text-xs mb-3 font-bold text-foreground/70 font-body">Ψήφισε ποια κερδίζει την επιβράβευση</div>
        <div className="space-y-2">
          {others.map((p) => (
            <button
              key={p.id}
              onClick={() => voteChampion(p.id)}
              className={`comic-panel-sm p-2 w-full text-left flex items-center justify-between transition-all text-foreground ${
                myChampion === p.id ? 'bg-tarot-forest ring-2 ring-primary' : 'bg-secondary'
              }`}
            >
              <span className="font-bold">{p.name}</span>
              {myChampion === p.id && <span className="font-heading text-primary">✓</span>}
            </button>
          ))}
        </div>
      </ComicPanel>
    </>
  );
}