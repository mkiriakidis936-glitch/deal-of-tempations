import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { calculateMostWanted, addHistory } from '@/lib/gameLogic';

export function TimeCapsuleInput({ state, updateState, onContinue }) {
  const capsule = state.timeCapsule || {};
  const submitted = Object.keys(capsule).length;

  async function skip() {
    await updateState({ timeCapsule: capsule });
    onContinue();
  }

  return (
    <ComicPanel className="bg-card text-center py-6 comic-pop">
      <div className="text-5xl mb-2">⏳</div>
      <div className="font-heading text-2xl mb-1 text-primary">ΧΡΟΝΟΚΑΨΟΥΛΑ</div>
      <p className="text-sm mb-3 max-w-md mx-auto text-foreground/70 font-body">
        Κάθε παίκτρια γράφει στο κινητό της 3 προβλέψεις: ποια θα πιαστεί πρώτη,
        ποια θα φτάσει στο φινάλε, ποια θα προδώσει. Αποκαλύπτονται στο Φινάλε!
      </p>
      <div className="font-heading text-xl mb-3 text-primary">{submitted}/{state.players.length} έχουν απαντήσει</div>
      <div className="flex flex-wrap gap-1 justify-center mb-4">
        {state.players.map((p) => (
          <span key={p.id} className={`text-xs px-2 py-1 rounded-full border-2 border-border font-bold text-foreground ${capsule[p.id] ? 'bg-tarot-forest' : 'bg-secondary'}`}>
            {capsule[p.id] ? '✓' : '⏳'} {p.name}
          </span>
        ))}
      </div>
      <ComicButton variant="green" size="lg" onClick={skip}>
        {submitted >= state.players.length ? '▶ ΕΝΑΡΞΗ ΠΑΙΧΝΙΔΙΟΥ' : '▶ ΠΑΡΑΛΕΙΨΗ & ΕΝΑΡΞΗ'}
      </ComicButton>
    </ComicPanel>
  );
}

export function TimeCapsuleReveal({ state, updateState, onClose }) {
  const [revealed, setRevealed] = React.useState(false);
  const capsule = state.timeCapsule || {};
  const players = state.players || [];
  const mostWanted = calculateMostWanted(players);
  const firstArrested = [...players].sort((a, b) => (a.penaltyStep || 0) - (b.penaltyStep || 0))[0];

  const actual = {
    finalist: mostWanted?.name,
    firstArrest: firstArrested?.name,
    traitor: '—',
  };

  function check(pred) {
    if (!pred) return null;
    let correct = 0;
    if (pred.finalist && pred.finalist === actual.finalist) correct++;
    if (pred.firstArrest && pred.firstArrest === actual.firstArrest) correct++;
    return correct;
  }

  async function awardTokens() {
    const players = state.players.map((p) => {
      const pred = capsule[p.id];
      const correct = check(pred) || 0;
      return { ...p, tokens: (p.tokens || 0) + correct };
    });
    const history = addHistory({ ...state, players }, { type: 'capsule_reveal', detail: 'Αποκάλυψη Χρονοκάψουλας' });
    await updateState({ players, history });
    setRevealed(true);
  }

  return (
    <ComicPanel className="bg-tarot-royal text-foreground text-center py-6 comic-pop">
      <div className="text-5xl mb-2">⏳</div>
      <div className="font-heading text-3xl comic-text-stroke text-tarot-gold mb-3">ΧΡΟΝΟΚΑΨΟΥΛΑ</div>
      {!revealed ? (
        <>
          <div className="text-sm mb-3 text-foreground/80 font-body">Προβλέψεις vs Πραγματικότητα:</div>
          <div className="space-y-2 text-left max-w-md mx-auto">
            {players.map((p) => {
              const pred = capsule[p.id];
              const correct = check(pred) || 0;
              return (
                <div key={p.id} className="comic-panel-sm p-2 bg-card text-foreground text-xs">
                  <div className="font-heading text-sm text-primary">{p.name}</div>
                  {pred ? (
                    <div className="space-y-0.5 font-body">
                      <div>Φιναλίστ: <span className={pred.finalist === actual.finalist ? 'text-tarot-forest font-bold' : 'text-destructive'}>{pred.finalist || '—'} {pred.finalist === actual.finalist ? '✓' : `(${actual.finalist})`}</span></div>
                      <div>1η Σύλληψη: <span className={pred.firstArrest === actual.firstArrest ? 'text-tarot-forest font-bold' : 'text-destructive'}>{pred.firstArrest || '—'} {pred.firstArrest === actual.firstArrest ? '✓' : `(${actual.firstArrest})`}</span></div>
                      <div className="font-bold text-primary">+{correct} tokens</div>
                    </div>
                  ) : <div className="text-foreground/50 font-body">Δεν συμμετείχε</div>}
                </div>
              );
            })}
          </div>
          <ComicButton variant="yellow" size="md" onClick={awardTokens} className="mt-3">💰 ΑΠΟΔΟΣΗ TOKENS</ComicButton>
        </>
      ) : (
        <>
          <div className="font-heading text-2xl mb-2 text-tarot-gold">✅ TOKENS ΑΠΟΔΟΘΗΚΑΝ!</div>
          <ComicButton variant="yellow" size="md" onClick={onClose}>ΣΥΝΕΧΕΙΑ</ComicButton>
        </>
      )}
    </ComicPanel>
  );
}