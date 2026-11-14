import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function HighStakesPanel({ state, updateState }) {
  const players = state.players || [];
  const current = players[state.currentPlayerIndex || 0] || players[0];
  const [offer, setOffer] = useState('10000');
  const [bribeTarget, setBribeTarget] = useState('');
  const [interrogationTarget, setInterrogationTarget] = useState('');
  const [questions, setQuestions] = useState(['', '', '']);
  const [auctionTarget, setAuctionTarget] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const inter = state.absoluteInterrogation || {};
  const voters = players.filter((p) => p.id !== inter.targetId);
  const stepVotes = inter.votes?.[inter.step] || {};
  const ready = !state.stopActive && !!inter.active && voters.length > 0 && voters.every((p) => stepVotes[p.id] === true || stepVotes[p.id] === false);
  const voteKey = JSON.stringify(stepVotes);
  useEffect(() => {
    if (!state.hogtieStartedAt) return;
    if (state.stopActive && !state.hogtiePausedAt) updateState({ hogtiePausedAt: Date.now() });
    else if (!state.stopActive && state.hogtiePausedAt) updateState({ hogtieStartedAt: state.hogtieStartedAt + (Date.now() - state.hogtiePausedAt), hogtiePausedAt: null });
  }, [state.stopActive, state.hogtieStartedAt, state.hogtiePausedAt]);
  useEffect(() => {
    if (!state.hogtieStartedAt || state.stopActive || state.bailoutAuction?.openedAt) return;
    if (now - state.hogtieStartedAt >= 15 * 60 * 1000) {
      updateState({ bailoutAuction: { active: true, targetId: state.hogtieTargetId, bids: {}, openedAt: Date.now() } });
    }
  }, [now, state.hogtieStartedAt, state.hogtieTargetId, state.stopActive, state.bailoutAuction?.openedAt]);

  useEffect(() => {
    if (!ready) return;
    const lieCount = Object.values(stepVotes).filter((v) => v === false).length;
    const truthCount = Object.values(stepVotes).filter((v) => v === true).length;
    const completed = { ...(inter.completed || {}), [inter.step]: { lieCount: lieCount > truthCount ? 1 : 0, truthCount, total: voters.length } };
    if (inter.step < 2) {
      updateState({ absoluteInterrogation: { ...inter, completed, step: inter.step + 1 } });
      return;
    }
    const all = Object.values(completed);
    const totalLies = all.reduce((sum, x) => sum + x.lieCount, 0);
    const allTruth = totalLies === 0;
    const allLie = totalLies === 3;
    const targetId = inter.targetId;
    const balances = { ...(state.moneyBalances || {}) };
    const passes = { ...(state.passCards || {}) };
    let verdict;
    if (allTruth) {
      verdict = { type: 'acquitted', label: 'ΠΛΗΡΗΣ ΑΘΩΩΣΗ', release: true, bonus: 5000 };
      balances[targetId] = (balances[targetId] || 0) + 5000;
      passes[targetId] = (passes[targetId] || 0) + 1;
    } else if (allLie) {
      verdict = { type: 'absolute', label: 'ΑΠΟΛΥΤΗ ΚΑΤΑΔΙΚΗ', release: false, penaltyMultiplier: 3, sensoryLock: true };
      const share = balances[targetId] || 0;
      balances[targetId] = 0;
      const others = players.filter((p) => p.id !== targetId);
      if (others.length && share > 0) others.forEach((p) => { balances[p.id] = (balances[p.id] || 0) + share / others.length; });
    } else {
      verdict = { type: 'partial', label: 'ΜΕΡΙΚΗ ΚΑΤΑΔΙΚΗ', release: false, penaltyMultiplier: 2, sensoryLock: true };
    }
    updateState({
      moneyBalances: balances,
      passCards: passes,
      interrogationVerdict: verdict,
      absoluteInterrogation: { ...inter, completed, active: false, verdict },
    });
  }, [ready, inter.step, voteKey]);

  function startInterrogation() {
    if (!current || questions.some((q) => !q.trim())) return;
    updateState({
      absoluteInterrogation: {
        active: true,
        targetId: interrogationTarget || current.id,
        step: 0,
        questions,
        votes: {},
        completed: {},
        startedAt: Date.now(),
      },
      interrogationVerdict: null,
    });
  }

  function applyBlackBribe() {
    const amount = Math.max(0, Number(offer) || 0);
    const targetId = bribeTarget || players.find((p) => p.id !== current?.id)?.id;
    if (!current || !targetId || !amount) return;
    const balances = { ...(state.moneyBalances || {}) };
    balances[current.id] = Math.max(0, (balances[current.id] || 0) - amount * 0.5);
    updateState({
      moneyBalances: balances,
      bankBalance: (state.bankBalance || 0) + amount * 0.5,
      blackBribe: { playerId: current.id, targetId, offer: amount, bankReturn: amount * 0.5, durationSeconds: 1200, createdAt: Date.now() },
    });
  }

  function applySacrifice(choice) {
    const board = [...(state.moneyBoard || [])];
    if (choice === 'sacrifice') {
      const top = board.map((x, i) => ({ ...x, i, value: Number(x.value ?? x.amount ?? x) || 0 })).sort((a, b) => b.value - a.value).slice(0, 3);
      if (top.length === 3) top.forEach((x) => {
        if (typeof board[x.i] === 'number') board[x.i] *= 2;
        else if (board[x.i] && typeof board[x.i] === 'object') board[x.i] = { ...board[x.i], value: x.value * 2, amount: board[x.i].amount != null ? x.value * 2 : board[x.i].amount };
      });
      updateState({ moneyBoard: board, sacrificeWheel: { choice, playerId: current?.id, durationSeconds: 900, doubledTopThree: true, at: Date.now() } });
    } else {
      const highest = board.map((x, i) => ({ i, value: Number(x?.value ?? x?.amount ?? x) || 0 })).sort((a, b) => b.value - a.value)[0];
      if (highest && board.length) board.splice(highest.i, 1);
      updateState({ moneyBoard: board, sacrificeWheel: { choice, playerId: current?.id, highestOfferRemoved: true, at: Date.now() } });
    }
  }

  function startHogtieTimer() {
    const targetId = auctionTarget || current?.id;
    if (!targetId || state.stopActive) return;
    updateState({ hogtieTargetId: targetId, hogtieStartedAt: Date.now(), hogtiePausedAt: null, bailoutAuction: null });
  }

  const bids = state.bailoutAuction?.bids || {};
  const highestBid = Object.entries(bids).map(([playerId, amount]) => ({ playerId, amount: Number(amount) || 0 })).sort((a, b) => b.amount - a.amount)[0];
  function finishAuction(outcome) {
    if (!highestBid || !state.bailoutAuction?.targetId) return;
    const balances = { ...(state.moneyBalances || {}) };
    balances[highestBid.playerId] = (balances[highestBid.playerId] || 0) - highestBid.amount;
    if (outcome === 'double') balances[highestBid.playerId] += highestBid.amount * 2;
    updateState({
      moneyBalances: balances,
      hogtieStartedAt: null,
      hogtiePausedAt: null,
      bailoutAuction: { ...state.bailoutAuction, active: false, winnerId: highestBid.playerId, winningBid: highestBid.amount, outcome, finishedAt: Date.now() },
      bailoutOutcome: outcome === 'release'
        ? { targetId: state.bailoutAuction.targetId, released: true }
        : { targetId: state.bailoutAuction.targetId, released: false, extraSeconds: 900, sensoryLock: true },
    });
  }

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-tarot-royal/20 space-y-2">
        <div className="font-heading text-lg text-primary">⚖️ ABSOLUTE INTERROGATION · 3 ΑΛΗΘΕΙΕΣ</div>
        {!inter.active ? (
          <>
            <select value={interrogationTarget || current?.id || ''} onChange={(e) => setInterrogationTarget(e.target.value)} className="w-full rounded bg-background border border-border p-2 text-sm">
              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {questions.map((q, i) => <textarea key={i} value={q} onChange={(e) => setQuestions((old) => old.map((v, n) => n === i ? e.target.value : v))} placeholder={'Ερώτηση ' + (i + 1)} className="w-full rounded bg-background border border-border p-2 text-sm" rows={2} />)}
            <ComicButton variant="purple" size="sm" onClick={startInterrogation} disabled={!!state.stopActive || questions.some((q) => !q.trim())}>ΕΝΑΡΞΗ 3 ΨΗΦΟΦΟΡΙΩΝ</ComicButton>
          </>
        ) : (
          <>
            <div className="text-sm">Στόχος: <b>{players.find((p) => p.id === inter.targetId)?.name}</b> · Αλήθεια {inter.step + 1}/3</div>
            <div className="rounded bg-background p-3 text-base">{inter.questions?.[inter.step]}</div>
            <div className="text-xs opacity-70">Ψήφοι: {Object.keys(stepVotes).length}/{voters.length}</div>
            {ready && <div className="text-sm text-emerald-300">Η ψηφοφορία ολοκληρώθηκε — υπολογίζεται αυτόματα η επόμενη φάση.</div>}
          </>
        )}
        {state.interrogationVerdict && <div className="rounded bg-background p-3"><b>{state.interrogationVerdict.label}</b><div className="text-xs opacity-70">{state.interrogationVerdict.release ? '+5.000€ και 1 Pass Card' : 'Ποινή ×' + state.interrogationVerdict.penaltyMultiplier + ' · Sensory Lock'}</div></div>}
      </ComicPanel>

      <ComicPanel className="bg-tarot-wine/20 space-y-2">
        <div className="font-heading text-lg text-primary">💰 THE BLACK BRIBE</div>
        <div className="text-xs opacity-70">Επιστροφή 50% της προσφοράς στην Τράπεζα και επιλογή συμπαίκτριας για τη σχετική ποινή 20 λεπτών.</div>
        <input type="number" min="1" value={offer} onChange={(e) => setOffer(e.target.value)} className="w-full rounded bg-background border border-border p-2" />
        <select value={bribeTarget} onChange={(e) => setBribeTarget(e.target.value)} className="w-full rounded bg-background border border-border p-2 text-sm">
          <option value="">Επιλογή συμπαίκτριας</option>
          {players.filter((p) => p.id !== current?.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <ComicButton variant="red" size="sm" onClick={applyBlackBribe} disabled={!!state.stopActive || !current || !(Number(offer) > 0)}>ΕΦΑΡΜΟΓΗ BLACK BRIBE</ComicButton>
        {state.blackBribe && <div className="text-xs">Τελευταίο Black Bribe: {players.find((p) => p.id === state.blackBribe.playerId)?.name} → {players.find((p) => p.id === state.blackBribe.targetId)?.name} · {state.blackBribe.durationSeconds / 60}′</div>}
      </ComicPanel>

      <ComicPanel className="bg-tarot-gold/10 space-y-2">
        <div className="font-heading text-lg text-primary">🎡 THE SACRIFICE WHEEL</div>
        <div className="text-xs opacity-70">Επιλογή Α: 15′ στην Καρέκλα και διπλασιασμός των 3 μεγαλύτερων ποσών. Επιλογή Β: αφαίρεση του μεγαλύτερου ποσού.</div>
        <div className="flex flex-wrap gap-2">
          <ComicButton variant="red" size="sm" onClick={() => applySacrifice('sacrifice')} disabled={!!state.stopActive}>Α · ΘΥΣΙΑ</ComicButton>
          <ComicButton variant="dark" size="sm" onClick={() => applySacrifice('refuse')} disabled={!!state.stopActive}>Β · ΑΡΝΗΣΗ</ComicButton>
        </div>
        {state.sacrificeWheel && <div className="text-xs">Τελευταία επιλογή: {state.sacrificeWheel.choice === 'sacrifice' ? 'Θυσία · 15′' : 'Άρνηση · αφαιρέθηκε το μεγαλύτερο ποσό'}</div>}
      </ComicPanel>

      <ComicPanel className="bg-tarot-forest/20 space-y-2">
        <div className="font-heading text-lg text-primary">🔨 BAILOUT AUCTION</div>
        {!state.bailoutAuction?.active ? (
          <>
            {!state.hogtieStartedAt ? (
              <>
                <select value={auctionTarget || current?.id || ''} onChange={(e) => setAuctionTarget(e.target.value)} className="w-full rounded bg-background border border-border p-2 text-sm">
                  {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ComicButton variant="green" size="sm" onClick={startHogtieTimer} disabled={!!state.stopActive}>ΕΝΑΡΞΗ HOGTIE · ΧΡΟΝΟΜΕΤΡΟ 15′</ComicButton>
              </>
            ) : (
              <>
                <div className="text-sm">Hogtie: {players.find((p) => p.id === state.hogtieTargetId)?.name}</div>
                <div className="font-heading text-2xl">{state.stopActive ? 'ΠΑΥΣΗ' : Math.max(0, Math.ceil((15 * 60 * 1000 - (now - state.hogtieStartedAt)) / 1000)) + '″'}</div>
                <div className="text-xs opacity-70">Η μυστική δημοπρασία ανοίγει αυτόματα μόλις συμπληρωθούν 15 λεπτά.</div>
                <ComicButton variant="dark" size="sm" onClick={() => updateState({ hogtieStartedAt: null, hogtieTargetId: null, hogtiePausedAt: null })} disabled={!!state.stopActive}>ΑΚΥΡΩΣΗ ΧΡΟΝΟΜΕΤΡΟΥ</ComicButton>
              </>
            )}
          </>
        ) : (
          <>
            <div className="text-sm">Στόχος: {players.find((p) => p.id === state.bailoutAuction.targetId)?.name}</div>
            <div className="text-xs">Προσφορές: {Object.keys(bids).length} · Υψηλότερη: {highestBid ? players.find((p) => p.id === highestBid.playerId)?.name + ' · ' + highestBid.amount : '—'}</div>
            <div className="flex flex-wrap gap-2">
              <ComicButton variant="green" size="sm" onClick={() => finishAuction('release')} disabled={!!state.stopActive || !highestBid}>Άμεση απελευθέρωση</ComicButton>
              <ComicButton variant="red" size="sm" onClick={() => finishAuction('double')} disabled={!!state.stopActive || !highestBid}>Διπλά χρήματα + 15′ Sensory Lock</ComicButton>
            </div>
          </>
        )}
      </ComicPanel>
    </div>
  );
}
