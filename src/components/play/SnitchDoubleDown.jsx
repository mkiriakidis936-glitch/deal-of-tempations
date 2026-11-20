import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory } from '@/lib/gameLogic';

export default function SnitchDoubleDown({ state, selectedPlayerId, updateState }) {
  const [snitchTarget, setSnitchTarget] = useState(null);
  const [coinResult, setCoinResult] = useState(null);
  const [flipping, setFlipping] = useState(false);

  const mySnitch = state.snitchVotes?.[selectedPlayerId];

  async function handleSnitch(targetId) {
    setSnitchTarget(targetId);
    const votes = { ...(state.snitchVotes || {}), [selectedPlayerId]: targetId };
    const history = addHistory(state, { type: 'snitch_vote', voter: state.players.find((p) => p.id === selectedPlayerId)?.name, target: state.players.find((p) => p.id === targetId)?.name });
    await updateState({ snitchVotes: votes, history });
  }

  async function handleDoubleDown() {
    setFlipping(true);
    setCoinResult(null);
    setTimeout(async () => {
      const win = Math.random() < 0.5;
      setCoinResult(win ? 'win' : 'lose');
      setFlipping(false);
      const me = state.players.find((p) => p.id === selectedPlayerId);
      const history = addHistory(state, { type: 'double_down', player: me?.name, result: win ? 'ελευθερία' : 'ποινή' });
      let patch = { history };
      if (!win) {
        patch.players = state.players.map((p) => (p.id === selectedPlayerId ? { ...p, penaltyStep: p.penaltyStep + 1 } : p));
      } else {
        patch.players = state.players.map((p) => (p.id === selectedPlayerId ? { ...p, penaltyStep: Math.max(0, p.penaltyStep - 1) } : p));
      }
      await updateState(patch);
    }, 1200);
  }

  return (
    <>
      <ComicPanel className="bg-destructive/30">
        <div className="font-heading text-lg mb-1 text-primary">🐍 SNITCH'S DILEMMA</div>
        <div className="text-xs mb-3 text-foreground/70 font-body">Ψήφισε ποια προδίδει την παρέα (Triple Betrayal). Συνδέεται με linked στόχο.</div>
        <div className="space-y-1.5">
          {state.players?.filter((p) => p.id !== selectedPlayerId).map((p) => {
            const count = Object.values(state.snitchVotes || {}).filter((v) => v === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => handleSnitch(p.id)}
                className={`comic-panel-sm p-2 w-full text-left flex items-center justify-between text-foreground ${mySnitch === p.id ? 'bg-destructive ring-2 ring-primary' : 'bg-secondary'}`}
              >
                <span className="font-bold text-sm">🐍 {p.name}</span>
                <span className="flex items-center gap-1">
                  {count > 0 && <span className="text-xs bg-background text-primary px-1.5 rounded font-bold">{count}</span>}
                  {mySnitch === p.id && <span className="font-heading text-primary">✓</span>}
                </span>
              </button>
            );
          })}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-primary/20">
        <div className="font-heading text-lg mb-1 text-primary">🎰 DOUBLE-DOWN CELL</div>
        <div className="text-xs mb-3 text-foreground/70 font-body">Στρίψε το νόμισμα: Κορώνα = -1 ποινή (ελευθερία) · Γράμματα = +1 ποινή (ρίσκο).</div>
        <div className="text-center">
          <div className="text-5xl mb-2">{flipping ? '🪙' : coinResult === 'win' ? '👑' : coinResult === 'lose' ? '⚖️' : '🪙'}</div>
          {flipping && <div className="font-heading text-lg comic-pulse text-primary">ΣΤΡΙΦΕΤΑΙ...</div>}
          {coinResult === 'win' && <div className="font-heading text-lg text-tarot-forest">ΕΛΕΥΘΕΡΙΑ! -1 ποινή</div>}
          {coinResult === 'lose' && <div className="font-heading text-lg text-destructive">ΡΙΣΚΟ! +1 ποινή</div>}
          <ComicButton variant="magenta" size="sm" onClick={handleDoubleDown} disabled={flipping} className="mt-2">
            🪙 ΣΤΡΙΨΕ
          </ComicButton>
        </div>
      </ComicPanel>
    </>
  );
}