import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory, applyPenaltyStep } from '@/lib/gameLogic';
import { STREET_TRUTHS, STREET_DARES } from '@/data/gameContent';

const SUITS = {
  truth: { id: 'truth', name: 'ΑΛΗΘΕΙΕΣ', icon: '💬' },
  dare: { id: 'dare', name: 'ΤΟΛΜΕΣ', icon: '🔥' },
};

function dealHands(participants) {
  return participants.map((p) => {
    const suit = Math.random() < 0.5 ? 'truth' : 'dare';
    const deck = suit === 'truth' ? STREET_TRUTHS : STREET_DARES;
    const card = deck[Math.floor(Math.random() * deck.length)];
    return { playerId: p.id, name: p.name, suit, card };
  });
}

export default function LiarsPoker({ state, updateState, onClose }) {
  const allPlayers = (state.players || []).filter((p) => p.name);
  const [phase, setPhase] = useState('setup'); // setup | deal | bid | reveal
  const [selectedIds, setSelectedIds] = useState(allPlayers.slice(0, 6).map((p) => p.id));
  const [hands, setHands] = useState([]);
  const [peekId, setPeekId] = useState(null);
  const [bid, setBid] = useState(null); // { count, suit, bidderIdx }
  const [bidderIdx, setBidderIdx] = useState(0);
  const [count, setCount] = useState(1);
  const [suit, setSuit] = useState('truth');
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);

  const participants = allPlayers.filter((p) => selectedIds.includes(p.id));
  const total = hands.length || participants.length;
  const canBid = total > 0 && (!bid || count > bid.count || (count === bid.count && suit === 'dare' && bid.suit === 'truth'));

  function togglePlayer(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function startRound() {
    const list = participants;
    setHands(dealHands(list));
    setBid(null);
    setBidderIdx(0);
    setCount(1);
    setSuit('truth');
    setPeekId(null);
    setResult(null);
    setApplied(false);
    setPhase('deal');
  }

  function placeBid() {
    if (!canBid) return;
    setBid({ count, suit, bidderIdx });
    setBidderIdx((bidderIdx + 1) % total);
  }

  function challenge() {
    if (!bid) return;
    const truths = hands.filter((h) => h.suit === 'truth').length;
    const dares = hands.length - truths;
    const actual = bid.suit === 'truth' ? truths : dares;
    const bidTrue = actual >= bid.count;
    const accused = hands[bid.bidderIdx];
    const challenger = hands[(bid.bidderIdx + 1) % hands.length];
    const loser = bidTrue ? challenger : accused;
    setResult({ actual, bidTrue, accused, challenger, loser, truths, dares });
    setPhase('reveal');
  }

  async function applyPenalty() {
    if (!result || applied) return;
    const updatedPlayers = state.players.map((p) => (p.id === result.loser.playerId ? applyPenaltyStep(p) : p));
    const history = addHistory({ ...state, players: updatedPlayers }, {
      type: 'liars_poker',
      player: result.loser.name,
      detail: `${result.loser.name} έχασε — η προσφορά «${result.accused ? SUITS[bid.suit].name : ''} ≥ ${bid.count}» ήταν ${result.bidTrue ? 'ΑΛΗΘΙΝΗ' : 'ΨΕΜΑ'} (πραγματικό: ${result.actual})`,
    });
    await updateState({ players: updatedPlayers, history });
    setApplied(true);
  }

  return (
    <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-md w-full max-h-[88vh] overflow-y-auto space-y-3">
        <ComicPanel className="bg-tarot-forest text-center py-4">
          <div className="text-4xl mb-1">🃏</div>
          <div className="font-heading text-2xl comic-text-stroke text-tarot-gold">ΠΟΚΕΡ ΨΕΜΑΤΩΝ</div>
          <div className="text-xs font-bold text-foreground/70 font-body">Μπλόφαρε με τις κάρτες σου — ποια θα τολμήσει;</div>
        </ComicPanel>

        {phase === 'setup' && (
          <>
            <ComicPanel className="bg-card">
              <div className="font-heading text-sm mb-2">👥 ΠΑΙΚΤΡΙΕΣ ({participants.length})</div>
              <p className="text-xs text-foreground/70 font-body mb-2">
                Κάθε παίκτρια παίρνει μία κρυφή κάρτα (Αλήθεια ή Τολμηρία). Στη συνέχεια μπλοφάρετε για το πόσες υπάρχουν στο τραπέζι. Όποια αμφισβητηθεί και χάσει, τρώει +1 ποινή και εκτελεί την κάρτα της.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {allPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`comic-panel-sm p-2 text-left ${selectedIds.includes(p.id) ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}
                  >
                    <span className="font-bold text-sm text-foreground">{p.name}</span>
                  </button>
                ))}
              </div>
            </ComicPanel>
            <ComicButton variant="green" size="lg" className="w-full" onClick={startRound} disabled={participants.length < 2}>
              🎴 ΜΟΙΡΑΣΕ ΚΑΡΤΕΣ
            </ComicButton>
          </>
        )}

        {phase === 'deal' && (
          <>
            <ComicPanel className="bg-card">
              <div className="font-heading text-sm mb-2">🙈 ΙΔΙΩΤΙΚΗ ΜΑΤΙΑ</div>
              <p className="text-xs text-foreground/70 font-body mb-2">Κάθε παίκτρια πατάει το όνομά της για να δει μόνο εκείνη την κάρτα της.</p>
              <div className="space-y-1">
                {hands.map((h) => (
                  <button
                    key={h.playerId}
                    onClick={() => setPeekId(peekId === h.playerId ? null : h.playerId)}
                    className={`comic-panel-sm w-full p-2 text-left ${peekId === h.playerId ? 'bg-background' : 'bg-secondary'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{h.name}</span>
                      {peekId !== h.playerId && <span className="text-xs text-foreground/50 font-body">πάτα για κάρτα</span>}
                    </div>
                    {peekId === h.playerId && (
                      <div className="mt-1 comic-pop">
                        <div className="font-heading text-sm text-primary">
                          {SUITS[h.suit].icon} {SUITS[h.suit].name}
                        </div>
                        <div className="text-xs font-body text-foreground/80">{h.card?.text}</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ComicPanel>
            {peekId && (
              <ComicButton variant="dark" size="sm" className="w-full" onClick={() => setPeekId(null)}>👁 ΕΠΟΜΕΝΗ ΜΑΤΙΑ</ComicButton>
            )}
            <ComicButton variant="magenta" size="lg" className="w-full" onClick={() => setPhase('bid')}>
              🔥 ΞΕΚΙΝΑ Η ΔΗΜΟΠΡΑΣΙΑ
            </ComicButton>
          </>
        )}

        {phase === 'bid' && (
          <>
            <ComicPanel className="bg-card">
              <div className="font-heading text-xs text-foreground/60 mb-1">ΤΡΕΧΟΥΣΑ ΠΡΟΣΦΟΡΑ</div>
              <div className="font-heading text-xl text-primary mb-1">
                {bid ? `${bid.count} × ${SUITS[bid.suit].name}` : 'Καμία ακόμα'}
              </div>
              {bid && <div className="text-xs font-bold text-foreground/70 font-body">από {hands[bid.bidderIdx]?.name}</div>}
            </ComicPanel>

            <ComicPanel className="bg-tarot-wine text-center py-4">
              <div className="font-heading text-xs tracking-widest text-tarot-gold">ΣΕΙΡΑ</div>
              <div className="font-heading text-3xl text-foreground comic-pop">{hands[bidderIdx]?.name}</div>
              <div className="text-xs text-foreground/60 font-body">Συνολικές κάρτες στο τραπέζι: {total}</div>
            </ComicPanel>

            <ComicPanel className="bg-card">
              <div className="font-heading text-sm mb-2">Η ΠΡΟΣΦΟΡΑ ΣΟΥ</div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <button onClick={() => setCount(Math.max(1, count - 1))} className="comic-panel-sm w-10 h-10 bg-secondary font-heading text-xl">−</button>
                <div className="font-heading text-4xl text-primary w-16 text-center">{count}</div>
                <button onClick={() => setCount(Math.min(total, count + 1))} className="comic-panel-sm w-10 h-10 bg-secondary font-heading text-xl">+</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(SUITS).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSuit(s.id)}
                    className={`comic-panel-sm p-2 text-center font-heading ${suit === s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
              <div className="text-xs text-center text-foreground/60 font-body mt-2">
                «Υπάρχουν τουλάχιστον {count} {SUITS[suit].name} στο τραπέζι»
              </div>
            </ComicPanel>

            <div className="grid grid-cols-2 gap-2">
              <ComicButton variant="green" size="md" onClick={placeBid} disabled={!canBid}>📈 ΠΡΟΣΦΟΡΑ</ComicButton>
              <ComicButton variant="red" size="md" onClick={challenge} disabled={!bid}>🛑 ΨΕΥΔΟΣ!</ComicButton>
            </div>
            <ComicButton variant="dark" size="sm" className="w-full" onClick={() => setPeekId(null)}>👁 ΕΛΕΓΞΕ ΤΗΝ ΚΑΡΤΑ ΣΟΥ</ComicButton>
            <div className="grid grid-cols-2 gap-1">
              {hands.map((h) => (
                <button
                  key={h.playerId}
                  onClick={() => setPeekId(peekId === h.playerId ? null : h.playerId)}
                  className={`comic-panel-sm p-1.5 text-left text-xs ${peekId === h.playerId ? 'bg-background' : 'bg-secondary'}`}
                >
                  <div className="font-bold text-foreground">{h.name}</div>
                  {peekId === h.playerId && <div className="text-primary font-bold">{SUITS[h.suit].icon} {SUITS[h.suit].name}</div>}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === 'reveal' && result && (
          <>
            <ComicPanel className={`text-center py-4 ${result.bidTrue ? 'bg-tarot-gold' : 'bg-destructive'}`}>
              <div className="font-heading text-2xl">
                {result.bidTrue ? '✅ Η ΠΡΟΣΦΟΡΑ ΗΤΑΝ ΑΛΗΘΙΝΗ' : '🤥 ΗΤΑΝ ΨΕΜΑ'}
              </div>
              <div className="text-sm font-bold font-body">
                Δηλώθηκαν {bid.count} × {SUITS[bid.suit].name} · Βρέθηκαν {result.actual} (💬{result.truths} / 🔥{result.dares})
              </div>
            </ComicPanel>

            <ComicPanel className="bg-card">
              <div className="font-heading text-sm mb-2">🃏 ΑΠΟΚΑΛΥΨΗ ΤΡΑΠΕΖΙΟΥ</div>
              <div className="space-y-1">
                {hands.map((h) => (
                  <div key={h.playerId} className={`comic-panel-sm p-2 ${h.playerId === result.loser.playerId ? 'bg-destructive/40 ring-2 ring-primary' : 'bg-secondary'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{h.name}</span>
                      <span className="font-heading text-xs text-primary">{SUITS[h.suit].icon} {SUITS[h.suit].name}</span>
                    </div>
                    <div className="text-xs text-foreground/70 font-body">{h.card?.text}</div>
                  </div>
                ))}
              </div>
            </ComicPanel>

            <ComicPanel className="bg-tarot-crimson text-center py-3">
              <div className="font-heading text-xs tracking-widest text-tarot-gold">ΧΑΝΕΙ</div>
              <div className="font-heading text-3xl text-foreground">{result.loser.name}</div>
              <div className="text-xs font-bold text-foreground/70 font-body mt-1">
                +1 ποινή και εκτελεί την κάρτα της: «{result.loser.card?.text?.slice(0, 90)}…»
              </div>
            </ComicPanel>

            <div className="grid grid-cols-2 gap-2">
              <ComicButton variant="red" size="md" onClick={applyPenalty} disabled={applied}>
                {applied ? '✓ ΕΦΑΡΜΟΣΤΗΚΕ' : '⚠️ ΕΠΙΒΟΛΗ ΠΟΙΝΗΣ'}
              </ComicButton>
              <ComicButton variant="magenta" size="md" onClick={startRound}>🔄 ΝΕΟΣ ΓΥΡΟΣ</ComicButton>
            </div>
          </>
        )}

        <ComicButton variant="dark" size="sm" className="w-full" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
      </div>
    </div>
  );
}