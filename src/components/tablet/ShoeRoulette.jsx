import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { FOOTWEAR_LEVELS } from '@/data/gameConfig';
import { addHistory } from '@/lib/gameLogic';

export default function ShoeRoulette({ state, updateState, onClose }) {
  const roulette = state.shoeRoulette;
  const [spinning, setSpinning] = useState(false);

  async function spin() {
    const eligible = state.players.filter((p) => p.penaltyStep < 7);
    if (eligible.length < 2) return;
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const playerA = shuffled[0];
    const playerB = shuffled[1];
    setSpinning(true);
    await updateState({ shoeRoulette: { spinning: true, playerA: playerA.id, playerB: playerB.id, done: false } });
    setTimeout(async () => {
      const players = state.players.map((p) => {
        if (p.id === playerA.id) return { ...p, footwearLevel: playerB.footwearLevel };
        if (p.id === playerB.id) return { ...p, footwearLevel: playerA.footwearLevel };
        return p;
      });
      const history = addHistory({ ...state, players }, {
        type: 'shoe_roulette',
        player: playerA.name,
        target: playerB.name,
        detail: 'Ανταλλαγή παπουτσιών',
      });
      await updateState({
        players,
        history,
        shoeRoulette: { spinning: false, playerA: playerA.id, playerB: playerB.id, done: true },
      });
      setSpinning(false);
    }, 3000);
  }

  async function close() {
    await updateState({ shoeRoulette: null });
    onClose();
  }

  if (!roulette) {
    return (
      <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4" onClick={close}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-md w-full space-y-3">
          <ComicPanel className="text-center py-6">
            <div className="ds-eyebrow text-primary/80">Ρουλέτα</div>
            <div className="ds-title mt-2 text-3xl">Παπούτσια</div>
            <div className="ds-label mt-2 leading-relaxed">Τυχαία ανταλλαγή footwear μεταξύ 2 παίκτριων</div>
          </ComicPanel>
          <ComicButton variant="magenta" size="lg" onClick={spin} className="w-full">🎰 ΤΡΕΞΕ ΡΟΥΛΕΤΑ</ComicButton>
          <ComicButton variant="red" size="sm" onClick={close} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  const playerA = state.players.find((p) => p.id === roulette.playerA);
  const playerB = state.players.find((p) => p.id === roulette.playerB);
  const fwA = FOOTWEAR_LEVELS.find((f) => f.level === playerA?.footwearLevel);
  const fwB = FOOTWEAR_LEVELS.find((f) => f.level === playerB?.footwearLevel);

  return (
    <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-3">
        <ComicPanel className="text-center py-6">
          <div className="ds-eyebrow text-primary/80">
            {roulette.spinning ? 'Περιστρέφεται' : 'Ανταλλαγή'}
          </div>
          <div className="ds-title mt-2 text-2xl">Παπούτσια</div>
          {roulette.spinning ? (
            <div className="text-5xl comic-pulse">👟👠👢👡</div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <div className="comic-panel-sm p-3 text-center">
                <div className="font-heading text-lg">{playerA?.name}</div>
                <div className="text-3xl">{fwA?.icon}</div>
                <div className="text-xs font-body">{fwA?.label}</div>
              </div>
              <div className="text-3xl text-primary">⇄</div>
              <div className="comic-panel-sm p-3 text-center">
                <div className="font-heading text-lg">{playerB?.name}</div>
                <div className="text-3xl">{fwB?.icon}</div>
                <div className="text-xs font-body">{fwB?.label}</div>
              </div>
            </div>
          )}
        </ComicPanel>
        {!roulette.spinning && (
          <ComicButton variant="dark" size="lg" onClick={close} className="w-full">✅ ΕΠΙΣΤΡΟΦΗ</ComicButton>
        )}
      </div>
    </div>
  );
}