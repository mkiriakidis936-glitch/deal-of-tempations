import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { DIGITAL_CARDS } from '@/data/gameContent';
import { addHistory } from '@/lib/gameLogic';

export default function DigitalCardsPanel({ state, updateState }) {
  const [open, setOpen] = useState(false);
  const [prisonerTarget, setPrisonerTarget] = useState(null);
  const [prisonerChoice, setPrisonerChoice] = useState(null);
  const [hackTarget, setHackTarget] = useState(null);

  const currentPlayer = state.players?.[state.currentPlayerIndex];

  async function handleUseCard(card) {
    if (!currentPlayer) return;
    let patch = {};
    const history = addHistory(state, { type: 'digital_card', card: card.name, player: currentPlayer.name });

    switch (card.id) {
      case 'DC-01':
        patch = { history, currentPlayerIndex: state.players.length - 1 - state.currentPlayerIndex };
        break;
      case 'DC-02':
        patch = {
          history,
          players: state.players.map((p) => p.id === currentPlayer.id ? { ...p, immunity: true } : p),
        };
        break;
      case 'DC-03':
        if (!prisonerTarget || !prisonerChoice) return;
        {
          const myChoice = prisonerChoice;
          const theirChoice = Math.random() < 0.5 ? 'cooperate' : 'betray';
          let players = state.players.map((p) => ({ ...p }));
          if (myChoice === 'betray' && theirChoice === 'cooperate') {
            players = players.map((p) => p.id === prisonerTarget ? { ...p, penaltyStep: p.penaltyStep + 1 } : p);
          } else if (myChoice === 'cooperate' && theirChoice === 'betray') {
            players = players.map((p) => p.id === currentPlayer.id ? { ...p, penaltyStep: p.penaltyStep + 1 } : p);
          } else if (myChoice === 'betray' && theirChoice === 'betray') {
            players = players.map((p) => (p.id === currentPlayer.id || p.id === prisonerTarget) ? { ...p, penaltyStep: p.penaltyStep + 1 } : p);
          }
          patch = { history, players };
        }
        break;
      case 'DC-04':
        if (!hackTarget) return;
        patch = {
          history,
          players: state.players.map((p) => p.id === hackTarget ? { ...p, penaltyStep: Math.max(0, p.penaltyStep - 1) } : p),
        };
        break;
    }
    await updateState(patch);
    setOpen(false);
    setPrisonerTarget(null);
    setPrisonerChoice(null);
    setHackTarget(null);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="comic-panel-sm px-3 py-1.5 text-sm font-bold bg-tarot-forest/30 text-foreground">
        💳 ΨΗΦΙΑΚΕΣ ΚΑΡΤΕΣ
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <ComicPanel className="bg-card max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="font-heading text-xl mb-3 text-center text-primary">💳 ΨΗΦΙΑΚΕΣ ΚΑΡΤΕΣ (4)</div>
        <div className="space-y-3">
          {DIGITAL_CARDS.map((card) => (
            <div key={card.id} className="comic-panel-sm p-3 bg-tarot-forest/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{card.icon}</span>
                <div className="flex-1">
                  <div className="font-heading text-sm text-foreground">{card.name}</div>
                  <div className="text-xs text-foreground/70 font-body">{card.desc}</div>
                </div>
                <span className="text-xs font-bold bg-background text-primary px-2 py-0.5 rounded font-body">{card.cost}</span>
              </div>
              {card.id === 'DC-03' && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs font-bold text-foreground">Στόχος:</div>
                  <div className="flex flex-wrap gap-1">
                    {state.players.filter((p) => p.id !== currentPlayer?.id).map((p) => (
                      <button key={p.id} onClick={() => setPrisonerTarget(p.id)} className={`text-xs px-2 py-1 border-2 border-border rounded ${prisonerTarget === p.id ? 'bg-primary/20' : 'bg-secondary'} text-foreground`}>{p.name}</button>
                    ))}
                  </div>
                  {prisonerTarget && (
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => setPrisonerChoice('cooperate')} className={`text-xs px-2 py-1 border-2 border-border rounded ${prisonerChoice === 'cooperate' ? 'bg-tarot-forest' : 'bg-secondary'} text-foreground`}>🤝 Συνεργασία</button>
                      <button onClick={() => setPrisonerChoice('betray')} className={`text-xs px-2 py-1 border-2 border-border rounded ${prisonerChoice === 'betray' ? 'bg-destructive' : 'bg-secondary'} text-foreground`}>🐍 Προδοσία</button>
                    </div>
                  )}
                </div>
              )}
              {card.id === 'DC-04' && (
                <div className="mt-2">
                  <div className="text-xs font-bold text-foreground">Δεμένη παίκτρια για απελευθέρωση:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {state.players.filter((p) => p.penaltyStep > 0).map((p) => (
                      <button key={p.id} onClick={() => setHackTarget(p.id)} className={`text-xs px-2 py-1 border-2 border-border rounded ${hackTarget === p.id ? 'bg-primary/20' : 'bg-secondary'} text-foreground`}>{p.name} ({p.penaltyStep})</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-2 text-right">
                <ComicButton
                  variant="green"
                  size="sm"
                  onClick={() => handleUseCard(card)}
                  disabled={(card.id === 'DC-03' && (!prisonerTarget || !prisonerChoice)) || (card.id === 'DC-04' && !hackTarget)}
                >
                  ▶ ΧΡΗΣΗ
                </ComicButton>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-3">
          <ComicButton variant="white" size="sm" onClick={() => setOpen(false)}>ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </ComicPanel>
    </div>
  );
}