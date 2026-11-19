import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';

export default function JuryVote({ state, selectedPlayerId, updateState }) {
  const trial = state.juryTrial;
  if (!trial || trial.phase !== 'voting') return null;
  if (trial.defendantId === selectedPlayerId) {
    return (
      <ComicPanel className="bg-tarot-royal/30 text-center py-4">
        <div className="font-heading text-lg text-primary">⚖️ ΔΙΚΗ ΣΕ ΕΞΕΛΙΞΗ</div>
        <div className="text-xs text-foreground/70 font-body">Είσαι η κατηγορούμενη — περίμενε την ετυμηγορία</div>
      </ComicPanel>
    );
  }

  const votes = trial.votes || {};
  const myVote = votes[selectedPlayerId];
  const defendant = state.players.find((p) => p.id === trial.defendantId);

  async function vote(verdict) {
    const newVotes = { ...votes, [selectedPlayerId]: verdict };
    await updateState({ juryTrial: { ...trial, votes: newVotes } });
  }

  return (
    <ComicPanel className="bg-tarot-royal/30">
      <div className="font-heading text-lg mb-1 text-primary">⚖️ ΔΙΚΗ: {defendant?.name}</div>
      <div className="text-xs mb-1 font-bold text-foreground font-body">Κατηγορία: {trial.charge}</div>
      {trial.defenseText && (
        <div className="comic-panel-sm p-2 bg-card text-xs mb-2 text-foreground font-body">🛡️ {trial.defenseText}</div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => vote('guilty')}
          className={`comic-panel-sm p-3 font-heading text-lg transition-all ${myVote === 'guilty' ? 'bg-destructive text-foreground ring-2 ring-primary' : 'bg-secondary text-foreground'}`}
        >
          ⛔ ΕΝΟΧΗ
        </button>
        <button
          onClick={() => vote('innocent')}
          className={`comic-panel-sm p-3 font-heading text-lg transition-all ${myVote === 'innocent' ? 'bg-tarot-forest text-foreground ring-2 ring-primary' : 'bg-secondary text-foreground'}`}
        >
          ✅ ΑΘΩΑ
        </button>
      </div>
      {myVote && <div className="text-xs mt-2 text-center font-bold text-foreground font-body">Ψήφισες: {myVote === 'guilty' ? 'ΕΝΟΧΗ' : 'ΑΘΩΑ'}</div>}
    </ComicPanel>
  );
}