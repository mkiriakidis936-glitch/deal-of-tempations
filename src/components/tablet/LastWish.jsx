import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { calculateMostWanted } from '@/lib/gameLogic';

export default function LastWish({ state, updateState, onClose }) {
  const wish = state.lastWish;
  const mostWanted = calculateMostWanted(state.players);

  async function startWish() {
    await updateState({ lastWish: { playerId: mostWanted?.id, wish: '', phase: 'input', votes: {}, accepted: null } });
  }

  async function voteWish(accept) {
    const players = state.players;
    const history = [...(state.history || [])];
    history.unshift({ type: 'last_wish', player: mostWanted?.name, wish: wish?.wish, accepted: accept, timestamp: Date.now() });
    await updateState({
      lastWish: { ...wish, phase: 'result', accepted: accept },
      history: history.slice(0, 50),
    });
  }

  async function close() {
    await updateState({ lastWish: null });
    onClose();
  }

  if (!wish) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm" onClick={close}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3">
          <div className="comic-panel ds-sheen px-5 py-6 text-center">
            <div className="ds-eyebrow text-primary/80">Πριν την τελική ποινή</div>
            <div className="ds-title mt-2 text-2xl text-foreground">Τελευταία επιθυμία</div>
            <div className="ds-label mt-3">{mostWanted?.name || '—'}</div>
          </div>
          <ComicButton variant="magenta" size="lg" onClick={startWish} className="w-full">Ζήτησε επιθυμία</ComicButton>
          <ComicButton variant="red" size="sm" onClick={close} className="w-full">Κλείσιμο</ComicButton>
        </div>
      </div>
    );
  }

  if (wish.phase === 'input') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-3">
          <div className="comic-panel px-5 py-6 text-center">
            <div className="ds-eyebrow text-primary/80">Γράψε την επιθυμία σου</div>
            <div className="ds-title mt-2 text-2xl text-foreground">{mostWanted?.name}</div>
            <div className="ds-label mt-3">Γράψε στο κινητό σου</div>
          </div>
          <ComicButton variant="red" size="sm" onClick={close} className="w-full">Ακύρωση</ComicButton>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-3">
        <div className={`comic-panel px-5 py-6 text-center comic-pop ${wish.accepted ? 'border-primary/35' : 'border-destructive/45'}`}>
          <div className="ds-eyebrow text-primary/80">{wish.accepted ? 'Εγκρίθηκε' : 'Απορρίφθηκε'}</div>
          <div className="comic-panel-sm mt-3 px-3 py-2 ds-lede text-sm text-foreground">{wish.wish}</div>
        </div>
        <ComicButton variant="dark" size="lg" onClick={close} className="w-full">Συνέχεια</ComicButton>
      </div>
    </div>
  );
}