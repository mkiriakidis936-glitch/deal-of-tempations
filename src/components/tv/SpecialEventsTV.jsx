import React from 'react';
import WantedPosterDisplay from '@/components/shared/WantedPosterDisplay';

export default function SpecialEventsTV({ state }) {
  const bn = state.breakingNews;
  const sr = state.shoeRoulette;
  const ps = state.penaltySlots;
  const trial = state.juryTrial;
  const wish = state.lastWish;
  const posters = state.wantedPosters || {};
  const posterPlayer = state.players?.find((p) => posters[p.id]);
  const oracle = state.blindOracle;
  const crypt = state.barefootCrypt;
  const pact = state.midnightPact;

  if (pact?.phase === 'active') {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center">
        <div className="text-7xl mb-4 comic-pulse">🌙</div>
        <div className="font-heading text-4xl text-primary comic-text-stroke">ΤΟ ΣΥΜΒΟΛΑΙΟ ΤΩΝ ΜΕΣΑΝΥΧΤΩΝ</div>
        <div className="text-sm mt-4 text-foreground/50 font-body">Κάθε κινητό λαμβάνει κρυφή προσφορά...</div>
        <div className="text-xs mt-2 text-foreground/30 font-body">Η TV παραμένει σκοτεινή</div>
      </div>
    );
  }

  if (pact?.phase === 'revealed') {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center">
        <div className="text-6xl mb-3">🌗</div>
        <div className="font-heading text-3xl text-primary comic-text-stroke">ΤΟ ΠΡΩΙΝΟ ΦΩΣ</div>
        <div className="font-heading text-8xl text-primary comic-text-stroke my-4">{pact.signerCount || 0}</div>
        <div className="text-lg text-foreground/80 font-body">παίκτριες υπέγραψαν</div>
      </div>
    );
  }

  if (oracle?.phase === 'sealed') {
    const oraclePlayer = state.players?.find((p) => p.id === oracle.oracleId);
    return (
      <div className="fixed inset-0 z-[55] bg-tarot-royal/95 flex flex-col items-center justify-center">
        <div className="text-7xl mb-3 comic-pulse">🔮</div>
        <div className="font-heading text-4xl text-primary comic-text-stroke">ΤΟ ΤΥΦΛΟ ΜΑΝΤΕΙΟ ΕΜΙΛΗΣΕ</div>
        <div className="text-lg mt-2 text-foreground/80 font-body">Oracle: {oraclePlayer?.name || '—'}</div>
        <div className="text-sm mt-3 text-foreground/50 font-body">3 μοίρες σφραγίστηκαν · Αποκάλυψη στον επόμενο γύρο</div>
      </div>
    );
  }

  if (crypt?.active) {
    return (
      <div className="fixed inset-0 z-[55] bg-background/95 flex flex-col items-center justify-center p-8">
        <div className="text-6xl mb-3">🗝️</div>
        <div className="font-heading text-3xl text-primary comic-text-stroke mb-4">Ο ΓΡΙΦΟΣ ΤΗΣ ΚΡΥΠΤΗΣ</div>
        <div className="bg-card text-foreground border-4 border-border p-6 max-w-2xl text-center">
          <p className="text-xl font-medium italic font-body">{crypt.riddle || 'Συνδυάστε τα φυσικά στοιχεία...'}</p>
        </div>
        <div className="text-sm mt-4 text-foreground/60 font-body">Χρώμα νυχιών + νούμερο παπουτσιού + QR σαγιονάρας</div>
      </div>
    );
  }

  if (bn?.active) {
    return (
      <div className="fixed inset-0 z-[55] bg-tarot-crimson flex flex-col items-center justify-center comic-strobe">
        <div className="bg-primary text-tarot-dark px-6 py-2 border-4 border-border font-heading text-2xl comic-text-stroke mb-4">
          📡 BREAKING NEWS
        </div>
        <div className="bg-card text-foreground px-8 py-6 border-4 border-border max-w-2xl text-center">
          <div className="font-heading text-3xl comic-text-stroke text-primary">{bn.announcement}</div>
        </div>
      </div>
    );
  }

  if (ps) {
    const target = state.players?.find((p) => p.id === ps.targetId);
    return (
      <div className="fixed inset-0 z-[55] bg-tarot-royal/90 flex flex-col items-center justify-center">
        <div className="font-heading text-4xl text-primary comic-text-stroke mb-4">🎰 ΚΟΥΛΟΧΕΡΗΣ ΠΟΙΝΩΝ</div>
        <div className="text-foreground text-xl mb-6 font-body">Στόχος: {target?.name}</div>
        {ps.spinning ? (
          <div className="text-8xl comic-pulse">🎲🎲🎲</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card text-foreground border-4 border-border p-4 text-center">
              <div className="text-xs font-bold text-primary font-body">ΣΗΜΕΙΟ</div>
              <div className="font-heading text-2xl">{ps.reels?.body}</div>
            </div>
            <div className="bg-card text-foreground border-4 border-border p-4 text-center">
              <div className="text-xs font-bold text-primary font-body">ΕΝΕΡΓΕΙΑ</div>
              <div className="font-heading text-2xl">{ps.reels?.action}</div>
            </div>
            <div className="bg-card text-foreground border-4 border-border p-4 text-center">
              <div className="text-xs font-bold text-primary font-body">ΔΙΑΡΚΕΙΑ</div>
              <div className="font-heading text-2xl">{ps.reels?.duration}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (sr) {
    const playerA = state.players?.find((p) => p.id === sr.playerA);
    const playerB = state.players?.find((p) => p.id === sr.playerB);
    return (
      <div className="fixed inset-0 z-[55] bg-tarot-sienna/90 flex flex-col items-center justify-center">
        <div className="font-heading text-4xl text-foreground comic-text-stroke mb-6">👟 ΡΟΥΛΕΤΑ ΠΑΠΟΥΤΣΙΩΝ</div>
        {sr.spinning ? (
          <div className="text-8xl comic-pulse">👟👠👢👡</div>
        ) : (
          <div className="flex items-center gap-8">
            <div className="bg-card text-foreground border-4 border-border p-6 text-center">
              <div className="font-heading text-2xl">{playerA?.name}</div>
              <div className="text-5xl mt-2 text-primary">⇄</div>
            </div>
            <div className="bg-card text-foreground border-4 border-border p-6 text-center">
              <div className="font-heading text-2xl">{playerB?.name}</div>
              <div className="text-5xl mt-2 text-primary">⇄</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (trial && trial.phase === 'voting') {
    const defendant = state.players?.find((p) => p.id === trial.defendantId);
    const votes = trial.votes || {};
    const guilty = Object.values(votes).filter((v) => v === 'guilty').length;
    const innocent = Object.values(votes).filter((v) => v === 'innocent').length;
    return (
      <div className="fixed inset-0 z-[55] bg-tarot-royal/90 flex flex-col items-center justify-center">
        <div className="font-heading text-5xl text-foreground comic-text-stroke mb-4">⚖️ ΔΙΚΗ ΣΕ ΕΞΕΛΙΞΗ</div>
        <div className="bg-card text-foreground border-4 border-border p-6 text-center max-w-xl">
          <div className="font-heading text-3xl text-primary">{defendant?.name}</div>
          <div className="text-sm font-bold mt-1 text-foreground/80 font-body">{trial.charge}</div>
          {trial.defenseText && <div className="text-xs mt-2 italic font-body">🛡️ {trial.defenseText}</div>}
          <div className="flex justify-center gap-8 mt-4 text-4xl font-heading">
            <span className="text-destructive">⛔ {guilty}</span>
            <span className="text-tarot-forest">✅ {innocent}</span>
          </div>
        </div>
      </div>
    );
  }

  if (trial && trial.phase === 'verdict') {
    return (
      <div className={`fixed inset-0 z-[55] flex flex-col items-center justify-center ${trial.verdict === 'guilty' ? 'bg-tarot-crimson' : 'bg-tarot-forest'}`}>
        <div className="text-9xl mb-4">{trial.verdict === 'guilty' ? '⛔' : '✅'}</div>
        <div className="font-heading text-6xl text-tarot-gold comic-text-stroke">
          {trial.verdict === 'guilty' ? 'ΕΝΟΧΗ!' : 'ΑΘΩΗ!'}
        </div>
      </div>
    );
  }

  if (wish && wish.phase === 'vote') {
    return (
      <div className="fixed inset-0 z-[55] bg-tarot-sienna/90 flex flex-col items-center justify-center">
        <div className="font-heading text-4xl text-primary comic-text-stroke mb-4">🕯️ ΤΕΛΕΥΤΑΙΑ ΕΠΙΘΥΜΙΑ</div>
        <div className="bg-card text-foreground border-4 border-border p-6 text-center max-w-xl">
          <div className="font-heading text-2xl text-primary">{wish.wish}</div>
        </div>
      </div>
    );
  }

  if (wish && wish.phase === 'result') {
    return (
      <div className={`fixed inset-0 z-[55] flex flex-col items-center justify-center ${wish.accepted ? 'bg-tarot-forest' : 'bg-tarot-crimson'}`}>
        <div className="text-9xl mb-4">{wish.accepted ? '✅' : '🚫'}</div>
        <div className="font-heading text-5xl text-tarot-gold comic-text-stroke">
          {wish.accepted ? 'ΑΠΟΔΕΧΘΗΚΕ!' : 'ΑΠΟΡΡΙΦΘΗΚΕ!'}
        </div>
      </div>
    );
  }

  if (posterPlayer) {
    return (
      <div className="fixed inset-0 z-[55] bg-background/80 flex items-center justify-center p-8">
        <div className="max-w-sm w-full comic-pop">
          <WantedPosterDisplay player={posterPlayer} state={state} />
        </div>
      </div>
    );
  }

  return null;
}