import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

// Κινητό: «Τελευταία επιθυμία».
// phase 'input'  -> η Most Wanted γράφει την επιθυμία της
// phase 'vote'   -> οι υπόλοιπες ψηφίζουν αποδοχή / απόρριψη
// phase 'result' -> το αποτέλεσμα εμφανίζεται στο tablet και στην TV
export default function LastWishMobile({ state, selectedPlayerId, updateState }) {
  const wish = state.lastWish;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  if (!wish || !selectedPlayerId) return null;

  const wisher = state.players?.find((p) => p.id === wish.playerId);
  const isWisher = selectedPlayerId === wish.playerId;
  const voters = (state.players || []).filter((p) => p.id !== wish.playerId);
  const votes = wish.votes || {};

  async function submitWish() {
    const clean = text.trim();
    if (!clean) return;
    setBusy(true);
    await updateState({ lastWish: { ...wish, wish: clean, phase: 'vote', votes: {} } });
    setBusy(false);
  }

  async function finish(finalVotes) {
    const yes = Object.values(finalVotes).filter(Boolean).length;
    const no = Object.values(finalVotes).filter((v) => v === false).length;
    const accepted = yes > no;
    const history = [...(state.history || [])];
    history.unshift({ type: 'last_wish', player: wisher?.name, wish: wish.wish, accepted, timestamp: Date.now() });
    await updateState({
      lastWish: { ...wish, votes: finalVotes, phase: 'result', accepted },
      history: history.slice(0, 50),
    });
  }

  async function vote(accept) {
    setBusy(true);
    const nextVotes = { ...votes, [selectedPlayerId]: accept };
    if (voters.every((p) => nextVotes[p.id] !== undefined)) {
      await finish(nextVotes);
    } else {
      await updateState({ lastWish: { ...wish, votes: nextVotes } });
    }
    setBusy(false);
  }

  if (wish.phase === 'input') {
    if (!isWisher) {
      return (
        <ComicPanel className="text-center py-4 bg-background border-primary">
          <div className="text-3xl mb-1">🕯️</div>
          <div className="font-heading text-lg text-primary">ΤΕΛΕΥΤΑΙΑ ΕΠΙΘΥΜΙΑ</div>
          <div className="text-sm mt-1 text-foreground/70 font-body">
            Η {wisher?.name || '—'} γράφει την επιθυμία της…
          </div>
        </ComicPanel>
      );
    }
    return (
      <ComicPanel className="bg-background border-primary comic-pop">
        <div className="text-center mb-2">
          <div className="text-3xl">🕯️</div>
          <div className="font-heading text-xl text-primary">Η ΤΕΛΕΥΤΑΙΑ ΣΟΥ ΕΠΙΘΥΜΙΑ</div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="Γράψε την επιθυμία σου…"
          className="w-full rounded-md border border-input bg-secondary p-3 text-sm text-foreground font-body focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <ComicButton variant="magenta" size="lg" className="w-full mt-2" disabled={busy || !text.trim()} onClick={submitWish}>
          ΣΤΕΙΛΕ ΤΗΝ ΕΠΙΘΥΜΙΑ
        </ComicButton>
      </ComicPanel>
    );
  }

  if (wish.phase === 'vote') {
    const myVote = votes[selectedPlayerId];

    if (isWisher) {
      return (
        <ComicPanel className="text-center py-4 bg-background border-primary">
          <div className="font-heading text-lg text-primary">ΨΗΦΟΦΟΡΙΑ ΣΕ ΕΞΕΛΙΞΗ</div>
          <div className="text-sm mt-1 text-foreground/80 font-body">«{wish.wish}»</div>
          <div className="text-xs mt-2 text-foreground/60 font-body">
            Ψήφισαν {Object.keys(votes).length} από {voters.length}
          </div>
          <ComicButton variant="dark" size="sm" className="mt-3" disabled={busy || Object.keys(votes).length === 0} onClick={() => finish(votes)}>
            Κλείσιμο ψηφοφορίας
          </ComicButton>
        </ComicPanel>
      );
    }

    if (myVote !== undefined) {
      return (
        <ComicPanel className="text-center py-4 bg-secondary">
          <div className="text-3xl mb-1">{myVote ? '✅' : '🚫'}</div>
          <div className="font-heading text-lg text-primary">Η ΨΗΦΟΣ ΣΟΥ ΚΑΤΑΧΩΡΗΘΗΚΕ</div>
          <div className="text-xs mt-1 text-foreground/60 font-body">
            Ψήφισαν {Object.keys(votes).length} από {voters.length}
          </div>
        </ComicPanel>
      );
    }

    return (
      <ComicPanel className="bg-background border-primary comic-pop">
        <div className="text-center mb-2">
          <div className="text-3xl">🕯️</div>
          <div className="font-heading text-xl text-primary">ΤΕΛΕΥΤΑΙΑ ΕΠΙΘΥΜΙΑ — {wisher?.name}</div>
        </div>
        <p className="text-base text-center text-foreground mb-3 font-body">«{wish.wish}»</p>
        <div className="grid grid-cols-2 gap-2">
          <ComicButton variant="green" size="md" disabled={busy} onClick={() => vote(true)}>✅ ΕΓΚΡΙΝΩ</ComicButton>
          <ComicButton variant="red" size="md" disabled={busy} onClick={() => vote(false)}>🚫 ΑΠΟΡΡΙΠΤΩ</ComicButton>
        </div>
      </ComicPanel>
    );
  }

  // phase === 'result'
  return (
    <ComicPanel className={`text-center py-4 comic-pop ${wish.accepted ? 'bg-tarot-forest' : 'bg-tarot-crimson'} text-foreground`}>
      <div className="text-4xl mb-1">{wish.accepted ? '✅' : '🚫'}</div>
      <div className="font-heading text-xl">{wish.accepted ? 'ΑΠΟΔΕΧΘΗΚΕ' : 'ΑΠΟΡΡΙΦΘΗΚΕ'}</div>
      <div className="text-sm mt-1 font-body">«{wish.wish}»</div>
    </ComicPanel>
  );
}
