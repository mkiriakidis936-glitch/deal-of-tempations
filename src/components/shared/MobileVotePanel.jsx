import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function MobileVotePanel({ state, updateState }) {
  const [open, setOpen] = useState(false);

  const mobileVotes = state.mobileVotes || {};
  const electricChairVotes = state.electricChairVotes || {};
  const miniGameVotes = state.miniGameVotes || {};
  const miniGameVolunteers = state.miniGameVolunteers || {};
  const miniGameRatings = state.miniGameRatings || {};

  function countVotes(votes) {
    const counts = {};
    Object.values(votes).forEach((tid) => { counts[tid] = (counts[tid] || 0) + 1; });
    return counts;
  }

  const betrayalCounts = countVotes(mobileVotes);
  const zapCounts = countVotes(electricChairVotes);
  const mgCounts = countVotes(miniGameVotes);

  const totalVoters = Object.keys(mobileVotes).length;
  const totalZapVoters = Object.keys(electricChairVotes).length;
  const totalMgVoters = Object.keys(miniGameVotes).length;
  const totalAll = totalVoters + totalZapVoters + totalMgVoters;

  const players = state.players || [];

  const betrayalWinner = Object.entries(betrayalCounts).sort((a, b) => b[1] - a[1])[0];
  const zapWinner = Object.entries(zapCounts).sort((a, b) => b[1] - a[1])[0];

  async function resolveBetrayal() {
    if (!betrayalWinner) return;
    const targetId = betrayalWinner[0];
    const target = players.find((p) => p.id === targetId);
    const updatedPlayers = players.map((p) =>
      p.id === targetId ? { ...p, penaltyStep: (p.penaltyStep || 0) + 1 } : p
    );
    const history = [...(state.history || []), { type: 'betrayal_resolved', player: target?.name, detail: `${betrayalWinner[1]} ψήφοι → +1 ποινή` }];
    await updateState({ players: updatedPlayers, mobileVotes: {}, history });
  }

  async function resolveZap() {
    if (!zapWinner) return;
    const targetId = zapWinner[0];
    const target = players.find((p) => p.id === targetId);
    const updatedPlayers = players.map((p) =>
      p.id === targetId ? { ...p, penaltyStep: (p.penaltyStep || 0) + 2 } : p
    );
    const history = [...(state.history || []), { type: 'electric_chair_resolved', player: target?.name, detail: `${zapWinner[1]} ψήφοι → +2 ποινές (Electric Chair)` }];
    await updateState({ players: updatedPlayers, electricChairVotes: {}, history });
  }

  async function clearMiniGameVotes() {
    await updateState({ miniGameVotes: {}, miniGameVolunteers: {}, miniGameRatings: {} });
  }

  const ratings = Object.values(miniGameRatings);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  if (totalAll === 0 && !state.activeMiniGame) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50">
      <ComicButton variant="dark" size="sm" onClick={() => setOpen(!open)}>
        📱 ΨΗΦΟΙ ({totalAll})
      </ComicButton>
      {open && (
        <ComicPanel className="bg-card mt-2 max-w-xs max-h-[70vh] overflow-y-auto text-foreground">
          {totalVoters > 0 && (
            <div className="mb-3 border-b-2 border-border pb-2">
              <div className="font-heading text-sm mb-1 text-primary">🗳️ ΨΗΦΟΣ ΘΥΣΙΑΣ</div>
              {Object.entries(betrayalCounts).sort((a, b) => b[1] - a[1]).map(([tid, count]) => {
                const p = players.find((pl) => pl.id === tid);
                return (
                  <div key={tid} className="text-xs flex justify-between">
                    <span>{p?.name}</span>
                    <span className="font-bold">{count} ψήφοι</span>
                  </div>
                );
              })}
              {betrayalWinner && (
                <ComicButton variant="red" size="sm" onClick={resolveBetrayal} className="w-full mt-1">
                  ⚡ {players.find((p) => p.id === betrayalWinner[0])?.name} → +1 ΠΟΙΝΗ
                </ComicButton>
              )}
            </div>
          )}

          {totalZapVoters > 0 && (
            <div className="mb-3 border-b-2 border-border pb-2">
              <div className="font-heading text-sm mb-1 text-primary">⚡ ELECTRIC CHAIR</div>
              {Object.entries(zapCounts).sort((a, b) => b[1] - a[1]).map(([tid, count]) => {
                const p = players.find((pl) => pl.id === tid);
                return (
                  <div key={tid} className="text-xs flex justify-between">
                    <span>⚡ {p?.name}</span>
                    <span className="font-bold">{count} ψήφοι</span>
                  </div>
                );
              })}
              {zapWinner && (
                <ComicButton variant="purple" size="sm" onClick={resolveZap} className="w-full mt-1">
                  ⚡ {players.find((p) => p.id === zapWinner[0])?.name} → +2 ΠΟΙΝΕΣ
                </ComicButton>
              )}
            </div>
          )}

          {state.activeMiniGame && (
            <div className="mb-3">
              <div className="font-heading text-sm mb-1 text-primary">🎮 {state.activeMiniGame.name}</div>
              <div className="text-xs">Εθελοντές: {Object.keys(miniGameVolunteers).length}</div>
              {totalMgVoters > 0 && (
                <>
                  <div className="text-xs font-bold mt-1">Ψήφοι θύματος:</div>
                  {Object.entries(mgCounts).sort((a, b) => b[1] - a[1]).map(([tid, count]) => {
                    const p = players.find((pl) => pl.id === tid);
                    return (
                      <div key={tid} className="text-xs flex justify-between">
                        <span>{p?.name}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    );
                  })}
                </>
              )}
              {avgRating && <div className="text-xs font-bold mt-1">⭐ Μέσος βαθμός: {avgRating}/5</div>}
              <ComicButton variant="dark" size="sm" onClick={clearMiniGameVotes} className="w-full mt-1">
                🗹 ΚΑΘΑΡΙΣΜΑ ΨΗΦΩΝ
              </ComicButton>
            </div>
          )}
        </ComicPanel>
      )}
    </div>
  );
}