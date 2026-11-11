import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function MobileMiniGame({ state, selectedPlayerId, updateState }) {
  const mg = state.activeMiniGame;
  if (!mg) return null;

  const myVote = state.miniGameVotes?.[selectedPlayerId];
  const myRating = state.miniGameRatings?.[selectedPlayerId];
  const volunteers = state.miniGameVolunteers || {};
  const isVolunteer = volunteers[selectedPlayerId];

  async function handleVolunteer() {
    const v = { ...volunteers, [selectedPlayerId]: true };
    await updateState({ miniGameVolunteers: v });
  }

  async function handleVote(targetId) {
    const v = { ...(state.miniGameVotes || {}), [selectedPlayerId]: targetId };
    await updateState({ miniGameVotes: v });
  }

  async function handleRating(rating) {
    const r = { ...(state.miniGameRatings || {}), [selectedPlayerId]: rating };
    await updateState({ miniGameRatings: r });
  }

  const voteCounts = {};
  Object.values(state.miniGameVotes || {}).forEach((tid) => { voteCounts[tid] = (voteCounts[tid] || 0) + 1; });

  const volunteerCount = Object.keys(volunteers).length;

  return (
    <ComicPanel className="bg-tarot-royal/30 comic-pop">
      <div className="text-center mb-2">
        <div className="text-4xl">{mg.icon}</div>
        <div className="font-heading text-lg text-primary">{mg.name}</div>
      </div>
      <div className="comic-panel-sm p-2 bg-secondary mb-2">
        <div className="text-xs font-bold text-primary font-body">ΣΕΤΥΠ:</div>
        <div className="text-sm text-foreground font-body">{mg.setup}</div>
      </div>
      <div className="comic-panel-sm p-2 bg-tarot-wine/30 mb-3">
        <div className="text-xs font-bold text-primary font-body">ΔΡΑΣΗ:</div>
        <div className="text-sm text-foreground font-body">{mg.action}</div>
      </div>

      <ComicButton
        variant={isVolunteer ? 'green' : 'magenta'}
        size="sm"
        onClick={handleVolunteer}
        className="w-full mb-3"
        disabled={isVolunteer}
      >
        {isVolunteer ? `✓ ΕΘΕΛΟΝΤΗΣ (${volunteerCount})` : `🙋 ΕΘΕΛΟΝΤΗΣ (${volunteerCount})`}
      </ComicButton>

      <div className="text-xs font-bold mb-1 text-foreground font-body">ΨΗΦΟΣ ΘΥΜΑΤΟΣ:</div>
      <div className="space-y-1 mb-3">
        {state.players?.filter((p) => p.id !== selectedPlayerId).map((p) => (
          <button
            key={p.id}
            onClick={() => handleVote(p.id)}
            className={`comic-panel-sm p-1.5 w-full text-left flex items-center justify-between text-sm text-foreground ${
              myVote === p.id ? 'bg-tarot-royal ring-2 ring-primary' : 'bg-secondary'
            }`}
          >
            <span className="font-bold">{p.name}</span>
            <span className="flex items-center gap-1">
              {voteCounts[p.id] > 0 && <span className="text-xs bg-background text-primary px-1.5 rounded font-bold">{voteCounts[p.id]}</span>}
              {myVote === p.id && <span className="text-primary">✓</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="text-xs font-bold mb-1 text-center text-foreground font-body">ΒΑΘΜΟΛΟΓΙΑ ΕΚΤΕΛΕΣΗΣ:</div>
      <div className="flex justify-center gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            onClick={() => handleRating(r)}
            className={`text-3xl transition-all ${myRating >= r ? 'text-primary' : 'text-foreground/20'}`}
          >
            ★
          </button>
        ))}
      </div>
      {myRating && <div className="text-xs text-center font-bold text-foreground font-body">Βαθμολόγησες: {myRating}/5</div>}
    </ComicPanel>
  );
}