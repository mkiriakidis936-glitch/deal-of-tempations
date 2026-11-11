import React, { useState, useEffect, useRef } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { addHistory } from '@/lib/gameLogic';
import { STREET_TRUTHS, STREET_DARES } from '@/data/gameContent';
import {
  SLOT_SYMBOLS, STAKE_TYPES, spinReels, evaluateSpin,
  applySlotResult, getResultText,
} from '@/lib/slotLogic';

const SPIN_MS = 80;
const STOP_DELAYS = [800, 1600, 2500];

export default function TemptationSlots({ state, updateState, onClose }) {
  const [phase, setPhase] = useState('select'); // select | spinning | result
  const [playerId, setPlayerId] = useState(null);
  const [stakeId, setStakeId] = useState(null);
  const [displayReels, setDisplayReels] = useState([SLOT_SYMBOLS[0], SLOT_SYMBOLS[1], SLOT_SYMBOLS[2]]);
  const [result, setResult] = useState(null);
  const [oracleCard, setOracleCard] = useState(null);
  const intervalRef = useRef(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const players = (state.players || []).filter((p) => p.name);
  const currentPlayer = state.players?.[state.currentPlayerIndex];
  const selPlayerId = playerId || currentPlayer?.id || players[0]?.id;
  const selPlayer = players.find((p) => p.id === selPlayerId);
  const selStake = STAKE_TYPES.find((s) => s.id === stakeId);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function startSpin() {
    if (!selPlayer || !selStake) return;
    const final = spinReels();
    const startTime = Date.now();
    setResult(null);
    setOracleCard(null);
    setPhase('spinning');

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const display = [0, 1, 2].map((i) => {
        if (now - startTime >= STOP_DELAYS[i]) return final[i];
        return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
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
    const stake = STAKE_TYPES.find((s) => s.id === stakeId);
    const updatedPlayers = cur.players.map((p) =>
      p.id === player.id ? applySlotResult(p, stake, evalResult) : p
    );

    let oracle = null;
    if (evalResult.type === 'oracle') {
      const pool = Math.random() < 0.5 ? STREET_TRUTHS : STREET_DARES;
      oracle = pool[Math.floor(Math.random() * pool.length)];
      setOracleCard(oracle);
    }

    const detail = getResultText(stake, evalResult);
    const history = addHistory({ ...cur, players: updatedPlayers }, {
      type: 'temptation_slots',
      player: player.name,
      stake: stake.name,
      result: evalResult.label,
      reels: finalReels.map((r) => r.icon).join(' '),
      detail: `${evalResult.label} — ${detail}`,
    });
    await updateState({ players: updatedPlayers, history });

    setResult(evalResult);
    setPhase('result');
  }

  function reset() {
    setPhase('select');
    setResult(null);
    setOracleCard(null);
    setDisplayReels([SLOT_SYMBOLS[0], SLOT_SYMBOLS[1], SLOT_SYMBOLS[2]]);
  }

  // ===== SELECT PHASE =====
  if (phase === 'select') {
    return (
      <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="max-w-md w-full max-h-[85vh] overflow-y-auto space-y-3">
          <ComicPanel className="bg-tarot-royal text-foreground text-center py-5">
            <div className="text-5xl mb-1">🎰</div>
            <div className="font-heading text-2xl comic-text-stroke text-tarot-gold">Σλοτ Πειρασμού</div>
            <div className="text-xs font-bold text-foreground/70 font-body">Πόνταρε · Γύρισε · Κερδίσε ή Χάσε</div>
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
                  <span className="font-bold text-sm">{p.name}</span>
                  <span className="text-xs">⚠️{p.penaltyStep || 0} · 🪙{p.tokens || 0} · 💰{p.bounty || 0}</span>
                </button>
              ))}
            </div>
          </ComicPanel>

          <ComicPanel className="bg-card">
            <div className="font-heading text-sm mb-2">🎲 ΤΙ ΠΟΝΤΑΡΕΙΣ</div>
            <div className="space-y-2">
              {STAKE_TYPES.map((s) => {
                const can = selPlayer ? s.canStake(selPlayer) : false;
                const active = stakeId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => can && setStakeId(s.id)}
                    disabled={!can}
                    className={`comic-panel-sm w-full p-2 text-left ${active ? 'bg-tarot-wine ring-2 ring-primary' : can ? 'bg-secondary hover:bg-tarot-wine/30' : 'bg-muted opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="font-heading text-sm flex items-center justify-between">
                      <span>{s.icon} {s.name}</span>
                      {!can && <span className="text-xs text-destructive">Ανεπάρκεια</span>}
                    </div>
                    <div className="text-xs text-foreground/60">{s.desc}</div>
                    <div className="text-xs mt-1 text-primary font-bold">
                      Jackpot: {s.jackpotText} · Win: {s.winText}
                    </div>
                  </button>
                );
              })}
            </div>
          </ComicPanel>

          <ComicButton variant="magenta" size="lg" className="w-full" disabled={!selPlayer || !selStake} onClick={startSpin}>
            🎰 ΤΡΑΒΗΞΕ
          </ComicButton>
          <ComicButton variant="red" size="sm" className="w-full" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    );
  }

  // ===== SPINNING / RESULT PHASE =====
  const spinning = phase === 'spinning';
  const resultColor =
    result?.type === 'jackpot' ? 'bg-tarot-forest text-foreground' :
    result?.type === 'win' ? 'bg-primary text-primary-foreground' :
    result?.type === 'curse' ? 'bg-destructive text-foreground' :
    result?.type === 'oracle' ? 'bg-tarot-royal text-foreground' :
    result?.type === 'bust' ? 'bg-card text-foreground' : 'bg-card';

  return (
    <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-3">
        <ComicPanel className={`${spinning ? 'bg-primary comic-strobe' : resultColor} text-center py-5`}>
          <div className="font-heading text-xl comic-text-stroke text-tarot-gold mb-1">
            {spinning ? '🎰 ΠΕΡΙΣΤΡΕΦΕΤΑΙ...' : `🎰 ${result?.label || ''}`}
          </div>
          <div className="text-xs font-bold text-foreground/70 mb-3 font-body">
            {selPlayer?.name} · {selStake?.icon} {selStake?.name}
          </div>

          {/* 3 REELS */}
          <div className="flex justify-center gap-2 mb-3">
            {displayReels.map((sym, i) => (
              <div
                key={i}
                className={`comic-panel-sm w-20 h-24 flex items-center justify-center bg-card ${spinning ? 'comic-pulse' : ''}`}
              >
                <span className="text-5xl">{sym.icon}</span>
              </div>
            ))}
          </div>

          {!spinning && result && (
            <div className="comic-panel-sm p-2 bg-background/20 mb-2">
              <div className="font-heading text-lg">{result.label}</div>
              <div className="text-sm font-bold">{getResultText(selStake, result)}</div>
            </div>
          )}
        </ComicPanel>

        {/* ORACLE VISION */}
        {!spinning && result?.type === 'oracle' && oracleCard && (
          <ComicPanel className="bg-tarot-royal text-foreground">
            <div className="font-heading text-lg text-center mb-2">👁️ ORACLE VISION</div>
            <div className="text-xs text-foreground/60 text-center mb-2">Η επόμενη κάρτα αποκαλύπτεται:</div>
            <div className="comic-panel-sm p-3 bg-card">
              <div className="text-xs font-bold text-primary">{oracleCard.name}</div>
              <p className="text-sm">{oracleCard.text}</p>
            </div>
          </ComicPanel>
        )}

        {/* HISTORY HINT */}
        {!spinning && result && (
          <div className="text-xs text-center text-foreground/50">
            3× ίδια = Jackpot · 2× ίδια = Win · 3× 💀 = Curse · 3× 👁️ = Oracle
          </div>
        )}

        {!spinning && (
          <div className="grid grid-cols-2 gap-2">
            <ComicButton variant="magenta" size="lg" onClick={reset}>🔄 ΞΑΝΑ</ComicButton>
            <ComicButton variant="red" size="lg" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
          </div>
        )}
      </div>
    </div>
  );
}