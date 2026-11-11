import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function SealedVoteControl({ state, updateState, onClose }) {
  const sealed = state.sealedVotes || {};
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const players = state.players || [];

  function updateOption(i, val) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  function addOption() {
    if (options.length < 6) setOptions([...options, '']);
  }

  function removeOption(i) {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  }

  async function createVote() {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    const voteId = `vote_${Date.now()}`;
    const newVote = {
      question: question.trim(),
      options: validOptions.map((label, i) => ({ id: `opt_${i}`, label })),
      votes: {},
      revealed: false,
      result: null,
      timestamp: Date.now(),
    };
    await updateState({ sealedVotes: { ...sealed, [voteId]: newVote } });
    setQuestion('');
    setOptions(['', '']);
  }

  async function revealVote(voteId) {
    const vote = sealed[voteId];
    if (!vote) return;
    const counts = {};
    Object.values(vote.votes).forEach((optId) => { counts[optId] = (counts[optId] || 0) + 1; });
    let winningOption = null;
    let maxCount = 0;
    vote.options.forEach((opt) => {
      const c = counts[opt.id] || 0;
      if (c > maxCount) { maxCount = c; winningOption = opt; }
    });
    await updateState({
      sealedVotes: {
        ...sealed,
        [voteId]: {
          ...vote,
          revealed: true,
          revealTimestamp: Date.now(),
          result: { counts, winningOption, totalVotes: Object.keys(vote.votes).length },
        },
      },
    });
  }

  async function closeVote(voteId) {
    const rest = { ...sealed };
    delete rest[voteId];
    await updateState({ sealedVotes: rest });
  }

  const activeVotes = Object.entries(sealed);

  return (
    <div className="fixed inset-0 z-[70] bg-background/85 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-3 max-h-[85vh] overflow-y-auto">
        <ComicPanel className="bg-tarot-crimson text-center py-4">
          <div className="font-heading text-3xl comic-text-stroke text-tarot-gold">🗳️ ΣΦΡΑΓΙΣΜΕΝΗ ΨΗΦΟΦΟΡΙΑ</div>
          <div className="text-sm font-bold text-foreground/80 font-body">Οι ψήφοι συγκεντρώνονται κρυφά · Αποκαλύπτονται όταν εσύ αποφασίσεις</div>
        </ComicPanel>

        {/* Create new vote */}
        <ComicPanel className="bg-card">
          <div className="font-heading text-lg mb-2 text-primary">➕ ΝΕΑ ΨΗΦΟΦΟΡΙΑ</div>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ερώτηση (π.χ. Ποια είναι η Most Wanted;)"
            className="cinp w-full text-sm mb-2"
          />
          <div className="space-y-1 mb-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-1">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Επιλογή ${i + 1}`}
                  className="cinp flex-1 text-sm"
                />
                {options.length > 2 && (
                  <ComicButton variant="red" size="sm" onClick={() => removeOption(i)}>✕</ComicButton>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <ComicButton variant="dark" size="sm" onClick={addOption} className="w-full mb-2">+ ΕΠΙΛΟΓΗ</ComicButton>
          )}
          <ComicButton
            variant="green"
            size="lg"
            onClick={createVote}
            disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
            className="w-full"
          >
            🔒 ΔΗΜΙΟΥΡΓΙΑ ΨΗΦΟΥ
          </ComicButton>
        </ComicPanel>

        {/* Active votes */}
        {activeVotes.length > 0 && (
          <ComicPanel className="bg-card">
            <div className="font-heading text-lg mb-2 text-primary">📋 ΕΝΕΡΓΕΣ ΨΗΦΟΦΟΡΙΕΣ</div>
            <div className="space-y-2">
              {activeVotes.map(([vid, vote]) => {
                const voteCount = Object.keys(vote.votes).length;
                return (
                  <div key={vid} className="comic-panel-sm p-3 bg-secondary">
                    <div className="font-heading text-sm text-foreground">{vote.question}</div>
                    <div className="text-xs text-foreground/60 font-body mb-2">
                      {vote.options.map((o) => o.label).join(' vs ')}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">
                        {vote.revealed ? '✅ Αποκαλύφθηκε' : `🔒 ${voteCount}/${players.length} ψήφισαν`}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {!vote.revealed && (
                        <ComicButton variant="yellow" size="sm" onClick={() => revealVote(vid)} className="flex-1">
                          ✨ ΑΠΟΚΑΛΥΨΗ
                        </ComicButton>
                      )}
                      <ComicButton variant="red" size="sm" onClick={() => closeVote(vid)}>
                        ✕
                      </ComicButton>
                    </div>
                    {vote.revealed && vote.result?.winningOption && (
                      <div className="mt-2 text-center font-heading text-lg text-tarot-gold comic-text-stroke">
                        🏆 {vote.result.winningOption.label} ({vote.result.totalVotes} ψήφοι)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ComicPanel>
        )}

        <ComicButton variant="red" size="sm" onClick={onClose} className="w-full">✕ ΚΛΕΙΣΙΜΟ</ComicButton>
      </div>
    </div>
  );
}