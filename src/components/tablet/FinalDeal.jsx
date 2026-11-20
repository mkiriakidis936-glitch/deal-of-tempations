import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory } from '@/lib/gameLogic';

const VOTE_ID = 'final_deal';

export default function FinalDeal({ state, updateState, onClose }) {
  const players = (state.players || []).filter((p) => p.name);
  const vote = state.sealedVotes?.[VOTE_ID];

  async function openDeal() {
    if (!players.length) return;
    const newVote = {
      question: 'FINAL DEAL — Ποια κρατάει το τραπέζι;',
      options: players.map((p) => ({ id: p.id, label: p.name })),
      votes: {},
      revealed: false,
      result: null,
      timestamp: Date.now(),
    };
    await updateState({ sealedVotes: { ...(state.sealedVotes || {}), [VOTE_ID]: newVote } });
  }

  async function reveal() {
    if (!vote) return;
    const counts = {};
    Object.values(vote.votes || {}).forEach((optId) => { counts[optId] = (counts[optId] || 0) + 1; });
    let winningOption = null;
    let maxCount = 0;
    vote.options.forEach((opt) => {
      const c = counts[opt.id] || 0;
      if (c > maxCount) { maxCount = c; winningOption = opt; }
    });
    const history = addHistory(state, {
      type: 'final_deal',
      detail: winningOption ? `Νικήτρια: ${winningOption.label} (${maxCount} ψήφοι)` : 'Ισοπαλία',
    });
    await updateState({
      history,
      sealedVotes: {
        ...(state.sealedVotes || {}),
        [VOTE_ID]: { ...vote, revealed: true, result: { counts, winningOption, totalVotes: Object.keys(vote.votes || {}).length } },
      },
    });
  }

  async function clearDeal() {
    const rest = { ...(state.sealedVotes || {}) };
    delete rest[VOTE_ID];
    await updateState({ sealedVotes: rest });
  }

  const cast = Object.keys(vote?.votes || {}).length;

  return (
    <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-3">
        <ComicPanel className="text-center py-5">
          <div className="ds-eyebrow text-primary/80">Τελικό</div>
          <div className="ds-title mt-2 text-3xl">Τελική Συμφωνία</div>
          <div className="text-xs font-bold font-body">Το τελευταίο τραπέζι · Κρυφή ψήφος από τα κινητά</div>
        </ComicPanel>

        {!vote ? (
          <ComicPanel className="bg-card text-center">
            <div className="text-sm text-foreground/70 font-body mb-3">
              Άνοιξε το τελευταίο τραπέζι. Κάθε παίκτρια ψηφίζει κρυφά από την καρτέλα SHOW του κινητού της.
            </div>
            <ComicButton variant="magenta" size="lg" className="w-full" onClick={openDeal} disabled={players.length < 2}>
              🎲 ΑΝΟΙΓΜΑ ΤΡΑΠΕΖΙΟΥ
            </ComicButton>
          </ComicPanel>
        ) : (
          <>
            <ComicPanel className="bg-tarot-wine text-center py-3">
              <div className="font-heading text-lg text-tarot-gold">{vote.question}</div>
              <div className="text-xs font-bold text-foreground/70 font-body mt-1">
                {vote.revealed ? '✅ Αποκαλύφθηκε' : `🔒 ${cast}/${players.length} ψήφισαν`}
              </div>
            </ComicPanel>

            <ComicPanel className="bg-card">
              <div className="space-y-1">
                {vote.options.map((opt) => {
                  const count = vote.result?.counts?.[opt.id] || 0;
                  const isWinner = vote.revealed && vote.result?.winningOption?.id === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`comic-panel-sm p-2 flex items-center justify-between ${isWinner ? 'bg-tarot-gold text-tarot-dark' : 'bg-secondary'}`}
                    >
                      <span className="font-bold text-sm">{opt.label}</span>
                      {vote.revealed && <span className="font-heading text-lg">{count}</span>}
                    </div>
                  );
                })}
              </div>
            </ComicPanel>

            <div className="grid grid-cols-2 gap-2">
              <ComicButton variant="yellow" size="lg" onClick={reveal} disabled={vote.revealed}>
                ✨ ΑΠΟΚΑΛΥΨΗ
              </ComicButton>
              <ComicButton variant="red" size="lg" onClick={clearDeal}>
                ↺ ΚΛΕΙΣΙΜΟ ΤΡΑΠΕΖΙΟΥ
              </ComicButton>
            </div>
          </>
        )}

        <ComicButton variant="dark" size="sm" className="w-full" onClick={onClose}>✕ ΕΞΟΔΟΣ</ComicButton>
      </div>
    </div>
  );
}