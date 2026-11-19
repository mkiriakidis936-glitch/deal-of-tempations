import React, { useState, useEffect, useRef } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory } from '@/lib/gameLogic';
import { betOptions, clampKarma, isBroke, KARMA_FAUCET, KARMA_MAX } from '@/lib/karmaRules';

// Φρουτάκια — Karma edition. Classic fruit symbols, karma-only betting.
const FRUITS = [
  { id: 'cherry', icon: '🍒', name: 'Κεράσι' },
  { id: 'lemon', icon: '🍋', name: 'Λεμόνι' },
  { id: 'orange', icon: '🍊', name: 'Πορτοκάλι' },
  { id: 'grape', icon: '🍇', name: 'Σταφύλι' },
  { id: 'bell', icon: '🔔', name: 'Κουδούνι' },
  { id: 'seven', icon: '7️⃣', name: 'Επτάρι' },
];

const SPIN_MS = 80;
const STOP_DELAYS = [700, 1500, 2400];

function spinReels() {
  return [0, 1, 2].map(() => FRUITS[Math.floor(Math.random() * FRUITS.length)]);
}

// Evaluate 3 reels. Returns { type, label, multiplier, symbol? }
// type: 'mega' | 'big' | 'win' | 'small' | 'bust'
function evaluateSpin(reels) {
  const [a, b, c] = reels;
  if (a.id === b.id && b.id === c.id) {
    if (a.id === 'seven') return { type: 'mega', label: 'MEGA JACKPOT', multiplier: 5, symbol: a };
    if (a.id === 'bell') return { type: 'big', label: 'BIG WIN', multiplier: 3, symbol: a };
    return { type: 'win', label: 'WIN', multiplier: 2, symbol: a };
  }
  if (a.id === b.id || b.id === c.id || a.id === c.id) {
    const winSym = a.id === b.id ? a : b.id === c.id ? b : a;
    return { type: 'small', label: 'SMALL WIN', multiplier: 1, symbol: winSym };
  }
  return { type: 'bust', label: 'BUST', multiplier: 0 };
}

export default function KarmaSlots({ state, updateState, onClose }) {
  const [phase, setPhase] = useState('select'); // select | spinning | result
  const [playerId, setPlayerId] = useState(null);
  const [bet, setBet] = useState(1);
  const [displayReels, setDisplayReels] = useState([FRUITS[0], FRUITS[1], FRUITS[2]]);
  const [result, setResult] = useState(null);
  const [karmaChange, setKarmaChange] = useState(0);
  const intervalRef = useRef(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const players = (state.players || []).filter((p) => p.name);
  const currentPlayer = state.players?.[state.currentPlayerIndex];
  const selPlayerId = playerId || currentPlayer?.id || players[0]?.id;
  const selPlayer = players.find((p) => p.id === selPlayerId);
  const playerKarma = selPlayer?.karma || 0;
  const options = betOptions(playerKarma);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function startSpin() {
    if (!selPlayer || playerKarma < bet) return;
    const final = spinReels();
    const startTime = Date.now();
    setResult(null);
    setKarmaChange(0);
    setPhase('spinning');

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const display = [0, 1, 2].map((i) => {
        if (now - startTime >= STOP_DELAYS[i]) return final[i];
        return FRUITS[Math.floor(Math.random() * FRUITS.length)];
      });
      setDisplayReels(display);
      if (now - startTime >= STOP_DELAYS[2]) {
        clearInterval(intervalRef.current);
        const evalResult = evaluateSpin(final);
        finishSpin(evalResult, final);
      }
    }, SPIN_MS);
  }

  async function finishSpin(evalResult, finalReels) {
    const cur = stateRef.current;
    const player = cur.players.find((p) => p.id === selPlayerId);
    if (!player) return;

    let newKarma = (player.karma || 0) - bet;
    let penaltyReduction = 0;
    let detail = '';

    switch (evalResult.type) {
      case 'mega':
        newKarma += bet * evalResult.multiplier;
        penaltyReduction = 2;
        detail = `MEGA! +${bet * evalResult.multiplier} karma + -2 ποινές`;
        break;
      case 'big':
        newKarma += bet * evalResult.multiplier;
        penaltyReduction = 1;
        detail = `BIG WIN! +${bet * evalResult.multiplier} karma + -1 ποινή`;
        break;
      case 'win':
        newKarma += bet * evalResult.multiplier;
        detail = `WIN! +${bet * evalResult.multiplier} karma`;
        break;
      case 'small':
        newKarma += bet + 1;
        detail = `Small win: karma πίσω +1`;
        break;
      case 'bust':
        detail = `Χάνεις ${bet} karma`;
        break;
      default: break;
    }

    const change = newKarma - (player.karma || 0);
    setKarmaChange(change);

    const updatedPlayers = cur.players.map((p) =>
      p.id === player.id
        ? { ...p, karma: clampKarma(newKarma), penaltyStep: Math.max(0, (p.penaltyStep || 0) - penaltyReduction) }
        : p
    );

    const history = addHistory({ ...cur, players: updatedPlayers }, {
      type: 'karma_slots',
      player: player.name,
      bet,
      result: evalResult.label,
      reels: finalReels.map((r) => r.icon).join(' '),
      detail: `${evalResult.label} — ${detail}`,
    });
    await updateState({ players: updatedPlayers, history });

    setResult(evalResult);
    setPhase('result');
  }

  async function giveFaucet() {
    const cur = stateRef.current;
    const player = cur.players.find((p) => p.id === selPlayerId);
    if (!player) return;
    const updatedPlayers = cur.players.map((p) =>
      p.id === player.id ? { ...p, karma: clampKarma((p.karma || 0) + KARMA_FAUCET) } : p
    );
    const history = addHistory({ ...cur, players: updatedPlayers }, {
      type: 'karma_faucet',
      detail: `${player.name} +${KARMA_FAUCET} karma (χάρισμα)`,
    });
    await updateState({ players: updatedPlayers, history });
  }

  function reset() {
    setPhase('select');
    setResult(null);
    setKarmaChange(0);
    setDisplayReels([FRUITS[0], FRUITS[1], FRUITS[2]]);
  }

  // ===== SELECT PHASE =====
  if (phase === 'select') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-md w-full max-h-[85vh] overflow-y-auto space-y-3">
          <ComicPanel className="text-center py-5">
            <div className="ds-eyebrow text-primary/80">Φρουτάκια</div>
            <div className="ds-title mt-2 text-2xl">Κάρμα</div>
            <div className="ds-label mt-2 leading-relaxed">Ρίσκαρε karma · Γύρισε · Κέρδισε ή κάψε</div>
          </ComicPanel>

          <ComicPanel className="bg-card">
            <div className="font-heading text-sm mb-2">👤 ΠΑΙΚΤΡΙΑ</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlayerId(p.id)}
                  className={`comic-panel-sm w-full p-2 text-left flex items-center justify-between ${selPlayerId === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                >
                  <span className="font-bold text-sm text-foreground">{p.name}</span>
                  <span className="text-xs text-foreground">🔮 {p.karma || 0} karma</span>
                </button>
              ))}
            </div>
          </ComicPanel>

          <ComicPanel className="bg-card">
            <div className="font-heading text-sm mb-2 text-center">🔮 ΚΑΡΜΑ: {playerKarma}</div>
            <div className="font-heading text-xs mb-2">ΠΟΣΟ ΣΤΟΙΧΗΜΑΤΟΣ</div>
            <div className="grid grid-cols-4 gap-2">
              {options.map((b) => {
                const active = bet === b.amount;
                return (
                  <button
                    key={b.amount}
                    onClick={() => b.enabled && setBet(b.amount)}
                    disabled={!b.enabled}
                    className={`comic-panel-sm p-2 text-center ${active ? 'bg-tarot-wine ring-2 ring-primary' : b.enabled ? 'bg-secondary hover:bg-tarot-wine/30' : 'bg-muted opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="text-lg">🔮</div>
                    <div className="text-xs font-bold text-foreground">{b.label}</div>
                  </button>
                );
              })}
            </div>
            {isBroke(playerKarma) && (
              <ComicButton variant="cyan" size="sm" className="w-full mt-2" onClick={giveFaucet}>
                🎁 ΧΑΡΙΣΜΑ +{KARMA_FAUCET} KARMA
              </ComicButton>
            )}
          </ComicPanel>

          <ComicPanel className="bg-card p-2 text-xs text-foreground/70 font-body">
            <div className="font-bold text-center mb-1 text-primary">ΠΙΝΑΚΑ ΑΠΟΔΟΣΕΩΝ</div>
            <div className="grid grid-cols-2 gap-1">
              <div>7️⃣7️⃣7️⃣ → ×5 karma + -2 ποινές</div>
              <div>🔔🔔🔔 → ×3 karma + -1 ποινή</div>
              <div>3× ίδιο φρούτο → ×2 karma</div>
              <div>2× ίδιο → karma πίσω +1</div>
            </div>
            <div className="text-center text-destructive font-bold mt-1">Όλα διαφορετικά → χάνεις το στοίχημα</div>
            <div className="text-center text-foreground/50 mt-1">
              Πάτωμα 0 · Ταβάνι {KARMA_MAX} · Στα 0 karma δικαιούσαι χάρισμα +{KARMA_FAUCET}
            </div>
          </ComicPanel>

          <ComicButton variant="magenta" size="lg" className="w-full" disabled={!selPlayer || playerKarma < bet} onClick={startSpin}>
            🎰 ΤΡΑΒΗΞΕ ({bet} karma)
          </ComicButton>
          <ComicButton variant="red" size="sm" className="w-full" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  // ===== SPINNING / RESULT PHASE =====
  const spinning = phase === 'spinning';
  const resultColor =
    result?.type === 'mega' ? 'border-primary/60' :
    result?.type === 'big' ? 'border-primary/45' :
    result?.type === 'win' ? 'border-primary/35' :
    result?.type === 'small' ? 'border-border/60' :
    result?.type === 'bust' ? 'border-destructive/50' : '';

  return (
    <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-3">
        <ComicPanel className={`${spinning ? 'border-primary/40' : resultColor} text-center py-5`}>
          <div className="ds-eyebrow text-primary/80">
            {spinning ? 'Περιστρέφεται' : (result?.label || 'Αποτέλεσμα')}
          </div>
          <div className="ds-label mt-2 mb-3">
            {selPlayer?.name} · Στοίχημα {bet}
          </div>

          {/* 3 REELS */}
          <div className="flex justify-center gap-2 mb-3">
            {displayReels.map((sym, i) => (
              <div
                key={i}
                className="comic-panel-sm w-20 h-24 flex items-center justify-center"
              >
                <span className="text-5xl">{sym.icon}</span>
              </div>
            ))}
          </div>

          {!spinning && result && (
            <div className="comic-panel-sm p-2 bg-background/20 mb-2">
              <div className="font-heading text-lg">{result.label}</div>
              <div className="text-sm font-bold">
                {karmaChange >= 0 ? `+${karmaChange}` : karmaChange} 🔮 karma
                {result.type === 'mega' && ' · -2 ποινές'}
                {result.type === 'big' && ' · -1 ποινή'}
              </div>
            </div>
          )}
        </ComicPanel>

        {!spinning && result && (
          <div className="text-xs text-center text-foreground/50">
            7️⃣×3 = Mega · 🔔×3 = Big · 3× φρούτο = Win · 2× = Small · Όλα διαφορετικά = Bust
          </div>
        )}

        {!spinning && (
          <div className="grid grid-cols-2 gap-2">
            <ComicButton variant="magenta" size="lg" onClick={reset} disabled={(selPlayer?.karma || 0) < 1}>🔄 ΞΑΝΑ</ComicButton>
            <ComicButton variant="red" size="lg" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
          </div>
        )}
      </div>
    </div>
  );
}