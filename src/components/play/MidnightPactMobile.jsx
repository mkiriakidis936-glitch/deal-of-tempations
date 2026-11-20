import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { MIDNIGHT_PACT_OFFER } from '@/data/gameContent';

export default function MidnightPactMobile({ state, selectedPlayerId, updateState }) {
  const pact = state.midnightPact;
  const [submitting, setSubmitting] = useState(false);

  if (!pact || pact.phase !== 'active') return null;
  if (!selectedPlayerId) return null;

  const myDecision = pact.offers?.[selectedPlayerId];

  async function decide(accepted) {
    setSubmitting(true);
    const offers = { ...(pact.offers || {}), [selectedPlayerId]: accepted };
    await updateState({ midnightPact: { ...pact, offers } });
    setSubmitting(false);
  }

  if (myDecision !== undefined) {
    return (
      <ComicPanel className={`text-center py-4 ${myDecision ? 'bg-destructive text-foreground' : 'bg-secondary text-foreground'} comic-pop`}>
        <div className="text-3xl mb-1">{myDecision ? '🩸' : '✋'}</div>
        <div className="font-heading text-lg text-primary">{myDecision ? 'ΥΠΕΓΡΑΨΕΣ' : 'ΑΡΝΗΘΗΚΕΣ'}</div>
        <div className="text-xs mt-1 text-foreground/70 font-body">
          {myDecision ? '15′ Hogtie Lock τώρα — 2 ποινές επιλογής σου στον επόμενο γύρο.' : 'Η απόφαση είναι κρυφή. Περίμενε την αποκάλυψη.'}
        </div>
      </ComicPanel>
    );
  }

  return (
    <ComicPanel className="bg-background text-foreground border-primary comic-pop">
      <div className="text-center mb-2">
        <div className="text-3xl">🌙</div>
        <div className="font-heading text-xl text-primary comic-text-stroke">ΣΥΜΒΟΛΑΙΟ ΤΩΝ ΜΕΣΑΝΥΧΤΩΝ</div>
      </div>
      <p className="text-sm text-foreground/90 mb-3 font-body">{MIDNIGHT_PACT_OFFER}</p>
      <div className="grid grid-cols-2 gap-2">
        <ComicButton variant="red" size="md" onClick={() => decide(true)} disabled={submitting}>
          🩸 ΔΕΧΟΜΑΙ
        </ComicButton>
        <ComicButton variant="dark" size="md" onClick={() => decide(false)} disabled={submitting}>
          ✋ ΑΡΝΟΥΜΑΙ
        </ComicButton>
      </div>
      <div className="text-xs text-center mt-2 text-foreground/50 font-body">Η απόφασή σου είναι μυστική — καμία δεν μαθαίνει.</div>
    </ComicPanel>
  );
}