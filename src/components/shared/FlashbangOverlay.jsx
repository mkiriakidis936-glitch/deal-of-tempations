import React, { useState, useEffect } from 'react';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory } from '@/lib/gameLogic';

export default function FlashbangOverlay({ state, updateState }) {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('flash');

  useEffect(() => {
    if (!active) return;
    setPhase('flash');
    const t1 = setTimeout(() => setPhase('blackout'), 600);
    const t2 = setTimeout(() => { setPhase('done'); }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);

  async function handleCaught(playerId) {
    const players = state.players.map((p) => (p.id === playerId ? { ...p, penaltyStep: p.penaltyStep + 1 } : p));
    const p = state.players.find((x) => x.id === playerId);
    const history = addHistory({ ...state, players }, { type: 'flashbang_caught', player: p?.name });
    await updateState({ players, history });
    setActive(false);
  }

  function trigger() { setActive(true); }

  if (typeof window !== 'undefined') window.__triggerFlashbang = trigger;

  if (!active) return null;

  return (
    <div className={`fixed inset-0 z-[60] flex flex-col items-center justify-center ${phase === 'flash' ? 'bg-foreground' : 'bg-background'}`}>
      {phase === 'flash' && <div className="font-heading text-5xl text-background comic-pulse">⚡ FLASHBANG ⚡</div>}
      {phase === 'blackout' && (
        <div className="text-center text-foreground px-4">
          <div className="font-heading text-4xl text-destructive comic-pulse mb-3">🚨 BLACKOUT 🚨</div>
          <div className="text-sm mb-4 max-w-md font-body">ΟΛΕΣ ΑΚΙΝΗΤΕΣ σαν αγάλματα! Όποια μετακινηθεί, γελάσει ή μιλήσει πρώτη → +1 ποινή (ένα παπούτσι/κάλτσα).</div>
          <div className="text-xs mb-4 text-foreground/60 font-body">Ο Game Master πατάει ποια έκανε κίνηση:</div>
          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
            {state.players.map((p) => (
              <button key={p.id} onClick={() => handleCaught(p.id)} className="comic-panel-sm p-2 bg-destructive text-foreground font-bold text-sm">
                {p.name}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <ComicButton variant="white" size="sm" onClick={() => setActive(false)}>ΚΑΜΙΑ ΕΚΙΝΗΘΗ — ΣΥΝΕΧΕΙΑ</ComicButton>
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div className="text-center text-foreground">
          <div className="font-heading text-3xl mb-3 text-primary">💡 ΦΩΤΑ ΑΝΑΨΑΝ</div>
          <ComicButton variant="yellow" size="lg" onClick={() => setActive(false)}>ΣΥΝΕΧΕΙΑ ΠΑΙΧΝΙΔΙΟΥ</ComicButton>
        </div>
      )}
    </div>
  );
}