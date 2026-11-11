import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { MIDNIGHT_PACT_OFFER } from '@/data/gameContent';
import { addHistory } from '@/lib/gameLogic';

export default function MidnightPact({ state, updateState, onClose }) {
  const pact = state.midnightPact;
  const offers = pact?.offers || {};
  const signers = Object.values(offers).filter((v) => v === true);
  const signerCount = signers.length;
  const totalPlayers = (state.players || []).length;
  const allAnswered = Object.keys(offers).length >= totalPlayers;

  async function handleTrigger() {
    await updateState({
      midnightPact: { phase: 'active', offers: {}, timestamp: Date.now() },
    });
  }

  async function handleReveal() {
    const history = addHistory(state, { type: 'midnight_pact', detail: `${signerCount} υπέγραψαν το Συμβόλαιο` });
    const players = (state.players || []).map((p) => ({
      ...p,
      pactReward: offers[p.id] === true ? 2 : 0,
    }));
    await updateState({
      midnightPact: { ...pact, phase: 'revealed', signerCount },
      players,
      history,
    });
    onClose();
  }

  async function handleCancel() {
    await updateState({ midnightPact: null });
    onClose();
  }

  if (!pact || pact.phase === 'inactive') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/90 flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-background text-foreground text-center py-6 border-primary">
            <div className="text-5xl mb-2">🌙</div>
            <div className="font-heading text-3xl comic-text-stroke text-primary">ΣΥΜΒΟΛΑΙΟ ΤΩΝ ΜΕΣΑΝΥΧΤΩΝ</div>
            <div className="text-sm mt-2 text-foreground/80 font-body">{MIDNIGHT_PACT_OFFER}</div>
            <div className="text-xs mt-3 text-primary font-body">
              Ενεργοποιείται αυτόματα στις 00:00, ή χειροκίνητα τώρα. Η TV μαυρίζει. Κάθε κινητό δείχνει την προσφορά κρυφά.
            </div>
          </ComicPanel>
          <ComicButton variant="magenta" size="lg" onClick={handleTrigger} className="w-full">
            🌙 ΕΝΕΡΓΟΠΟΙΗΣΗ ΤΩΡΑ
          </ComicButton>
          <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  if (pact.phase === 'active') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/95 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-background text-foreground text-center py-6 border-primary">
            <div className="text-5xl mb-2 comic-pulse">🌙</div>
            <div className="font-heading text-2xl comic-text-stroke text-primary">ΣΥΜΒΟΛΑΙΟ ΕΝΕΡΓΟ</div>
            <div className="text-sm mt-2 text-foreground/80 font-body">Η TV είναι μαύρη. Κάθε κινητό δείχνει την προσφορά.</div>
          </ComicPanel>
          <ComicPanel className="bg-card">
            <div className="font-heading text-lg text-center mb-2 text-primary">ΑΠΑΝΤΗΣΕΙΣ ΚΙΝΗΤΩΝ</div>
            <div className="space-y-1">
              {(state.players || []).map((p) => {
                const answered = offers[p.id] !== undefined;
                return (
                  <div key={p.id} className="text-sm flex items-center justify-between comic-panel-sm p-2 text-foreground">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-xs">
                      {!answered ? '⏳ Εκκρεμεί...' : offers[p.id] ? '🩸 Δέχτηκε' : '✋ Αρνήθηκε'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-2 text-xs font-bold text-foreground/60 font-body">
              {Object.keys(offers).length}/{totalPlayers} απάντησαν
            </div>
          </ComicPanel>
          <ComicButton
            variant="yellow"
            size="lg"
            onClick={handleReveal}
            className="w-full"
            disabled={!allAnswered}
          >
            🔏 ΑΠΟΚΑΛΥΨΗ (μόνο αριθμός)
          </ComicButton>
          {!allAnswered && (
            <div className="text-xs text-center text-foreground/60 font-body">Περίμενε να απαντήσουν όλες, ή αποκάλυψε νωρίς.</div>
          )}
          <ComicButton variant="red" size="sm" onClick={handleCancel} className="w-full">✕ ΑΚΥΡΩΣΗ</ComicButton>
        </div>
      </div>
    );
  }

  if (pact.phase === 'revealed') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/95 flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3">
          <ComicPanel className="bg-background text-foreground text-center py-8 border-primary comic-pop">
            <div className="text-6xl mb-3">🌗</div>
            <div className="font-heading text-2xl text-primary comic-text-stroke">ΤΟ ΠΡΩΙΝΟ ΦΩΣ</div>
            <div className="text-sm mt-2 text-foreground/80 font-body">Η TV αποκαλύπτει μόνο τον αριθμό:</div>
            <div className="font-heading text-7xl text-primary comic-text-stroke my-4">{signerCount || (pact.signerCount || 0)}</div>
            <div className="text-sm text-foreground/80 font-body">παίκτριες υπέγραψαν το Συμβόλαιο των Μεσανύχτων</div>
            <div className="text-xs mt-3 text-foreground/60 font-body">
              Όσες δέχτηκαν: +2 ποινές επιλογής τους στον επόμενο γύρο. Όσες δεν δέχτηκαν: δεν μαθαίνουν ποτέ ποιες δέχτηκαν.
            </div>
          </ComicPanel>
          <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  return null;
}