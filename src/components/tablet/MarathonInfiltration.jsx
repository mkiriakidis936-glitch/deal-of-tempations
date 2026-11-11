import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import MarathonBoardView from '@/components/shared/MarathonBoardView';
import ExtremeProtocolsPanel from '@/components/shared/ExtremeProtocolsPanel';
import DigitalCardsPanel from '@/components/shared/DigitalCardsPanel';
import BountyMultiplier from '@/components/shared/BountyMultiplier';
import { MARATHON_SQUARE_TYPES, getMarathonSquare, MARATHON_FINISH_POSITION } from '@/data/marathonBoard';
import { rollDice, addHistory } from '@/lib/gameLogic';
import SpeakButton from '@/components/comic/VoiceReader';

function applySquareEffect(player, effect) {
  if (!effect) return player;
  switch (effect.type) {
    case 'goBack':
      return { ...player, position: Math.max(0, player.position - effect.squares) };
    case 'goTo':
      return { ...player, position: effect.position };
    case 'skipTurn':
      return { ...player, skipTurns: (player.skipTurns || 0) + 1 };
    case 'mustRollSix':
      return { ...player, mustRollSix: true };
    default:
      return player;
  }
}

export default function MarathonInfiltration({ state, updateState, onAdvance }) {
  const [phase, setPhase] = useState('idle');
  const [duelOpponentId, setDuelOpponentId] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const currentTeam = currentPlayer?.team || 'alpha';
  const teamKey = currentTeam === 'alpha' ? 'teamAlpha' : 'teamBeta';
  const oppTeamKey = currentTeam === 'alpha' ? 'teamBeta' : 'teamAlpha';
  const oppPlayers = state.players.filter((p) => p.team !== currentTeam);
  const square = getMarathonSquare(currentPlayer?.position || 0);
  const squareType = MARATHON_SQUARE_TYPES[square.type] || MARATHON_SQUARE_TYPES.dead;
  const teamLoot = state[teamKey]?.loot || 0;
  const teamStars = state[teamKey]?.stars || 0;
  const oppLoot = state[oppTeamKey]?.loot || 0;
  const oppStars = state[oppTeamKey]?.stars || 0;

  const mustSkip = (currentPlayer?.skipTurns || 0) > 0;
  const needsSix = currentPlayer?.mustRollSix || false;

  async function handleNextTurn() {
    const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
    await updateState({ currentPlayerIndex: nextIdx, diceValue: null, activeCard: null });
    setPhase('idle');
    setDuelOpponentId(null);
    setLastResult(null);
  }

  async function handleSkipTurn() {
    const updatedPlayers = state.players.map((p) =>
      p.id === currentPlayer.id ? { ...p, skipTurns: (p.skipTurns || 0) - 1 } : p
    );
    await updateState({
      players: updatedPlayers,
      history: addHistory(state, { type: 'skip', player: currentPlayer.name, team: currentTeam }),
    });
    const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
    await updateState({ currentPlayerIndex: nextIdx, diceValue: null });
    setPhase('idle');
  }

  async function handleRollDice() {
    const dice = rollDice();

    if (needsSix && dice !== 6) {
      await updateState({
        diceValue: dice,
        history: addHistory(state, { type: 'trapped', player: currentPlayer.name, team: currentTeam, dice }),
      });
      setLastResult({ type: 'trapped', dice });
      setPhase('trapped');
      return;
    }

    const basePos = currentPlayer.position || 0;
    const newPos = Math.min(basePos + dice, MARATHON_FINISH_POSITION);
    let updatedPlayers = state.players.map((p) =>
      p.id === currentPlayer.id ? { ...p, position: newPos, mustRollSix: false } : p
    );
    const sq = getMarathonSquare(newPos);
    await updateState({
      players: updatedPlayers,
      diceValue: dice,
      history: addHistory(state, { type: 'move', player: currentPlayer.name, team: currentTeam, dice, position: newPos, squareType: sq.type }),
    });

    if (newPos >= MARATHON_FINISH_POSITION) {
      await updateState({ winner: currentTeam });
      onAdvance();
      return;
    }

    setPhase(sq.type === 'dead' || sq.type === 'start' ? 'dead' : 'rolled');
  }

  async function handleCommandDone() {
    await updateState({
      history: addHistory(state, { type: 'command', player: currentPlayer.name, team: currentTeam, square: square.name }),
    });
    setLastResult({ type: 'command', square });
    setPhase('result');
  }

  async function handleChallengeResult(success) {
    let teamUpdate, history;
    if (success) {
      teamUpdate = { [teamKey]: { ...state[teamKey], loot: teamLoot + 5000 } };
      history = addHistory({ ...state, ...teamUpdate }, { type: 'challenge_success', player: currentPlayer.name, team: currentTeam, square: square.name });
    } else {
      teamUpdate = { [teamKey]: { ...state[teamKey], stars: teamStars + 1 } };
      history = addHistory({ ...state, ...teamUpdate }, { type: 'challenge_fail', player: currentPlayer.name, team: currentTeam, square: square.name });
    }
    await updateState({ ...teamUpdate, history });
    setLastResult({ type: 'challenge', success, square });
    setPhase('result');
  }

  async function handleTrapPenaltyApply() {
    const effect = square.effect;
    const updatedPlayers = state.players.map((p) =>
      p.id === currentPlayer.id ? applySquareEffect(p, effect) : p
    );
    const teamUpdate = { [teamKey]: { ...state[teamKey], stars: teamStars + 1 } };
    const history = addHistory({ ...state, ...teamUpdate }, {
      type: square.type,
      player: currentPlayer.name,
      team: currentTeam,
      square: square.name,
      effect: effect?.type,
    });
    await updateState({ players: updatedPlayers, ...teamUpdate, history });
    setLastResult({ type: square.type, square, effect });
    setPhase('result');
  }

  async function handleDuelResult(currentWon) {
    let teamUpdate, history;
    if (currentWon) {
      teamUpdate = { [teamKey]: { ...state[teamKey], loot: teamLoot + 5000 } };
      history = addHistory({ ...state, ...teamUpdate }, { type: 'duel_win', player: currentPlayer.name, team: currentTeam, square: square.name });
    } else {
      teamUpdate = { [teamKey]: { ...state[teamKey], stars: teamStars + 1 } };
      history = addHistory({ ...state, ...teamUpdate }, { type: 'duel_lose', player: currentPlayer.name, team: currentTeam, square: square.name });
    }
    await updateState({ ...teamUpdate, history });
    setLastResult({ type: 'duel', won: currentWon, square });
    setPhase('result');
  }

  const progressPct = Math.min(100, ((currentPlayer?.position || 0) / MARATHON_FINISH_POSITION) * 100);

  return (
    <div className="min-h-screen comic-dots p-3 pb-24">
      <div className="max-w-5xl mx-auto space-y-3">
        <ComicPanel className="bg-tarot-royal text-foreground flex flex-wrap items-center justify-between gap-2 py-3">
          <div className="font-heading text-2xl">🏆 MARATHON — ΣΤΑΔΙΟ 1: INFILTRATION</div>
          <SpeakButton text="Marathon. Στάδιο 1: Infiltration. Ψηφιακό φιδάκι 80 κουτιών. Ζάρι και κίνηση. Challenge: επιτυχία συν 5 χιλιάδες, αποτυχία συν 1 Wanted Star. Κόντρα: νίκη συν 5 χιλιάδες, ήττα συν 1 Star. Παγίδες και ποινές: αυτόματο εφέ συν 1 Star. Πρώτη ομάδα που φτάνει στο FINISH προκρίνεται." label="🔊 AI VOICE" />
          <div className="flex items-center gap-2 text-sm font-bold">
            <ExtremeProtocolsPanel intensity={state.intensity} state={state} updateState={updateState} />
            <DigitalCardsPanel state={state} updateState={updateState} />
            <BountyMultiplier state={state} />
            <span className="bg-tarot-wine px-2 py-1 rounded">Alpha: ${teamLoot.toLocaleString()} · ⭐{teamStars}</span>
            <span className="bg-tarot-teal px-2 py-1 rounded">Beta: ${oppLoot.toLocaleString()} · ⭐{oppStars}</span>
          </div>
        </ComicPanel>

        <ComicPanel className={currentTeam === 'alpha' ? 'bg-tarot-wine/60' : 'bg-tarot-teal'}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-sm font-bold uppercase">Team {currentTeam === 'alpha' ? 'Alpha' : 'Beta'} — Σειρά:</div>
              <div className="font-heading text-3xl">{currentPlayer?.name}</div>
              <div className="text-sm">Θέση: {currentPlayer?.position || 0}/79 {mustSkip && '· ⏭️ Παραλείπει'}{needsSix && '· 🎲 Χρειάζεται 6άρι'}</div>
            </div>
            {state.diceValue && (
              <div className="text-center">
                <div className="text-xs font-bold">ΖΑΡΙ</div>
                <div className="font-heading text-6xl comic-text-stroke">{state.diceValue}</div>
              </div>
            )}
          </div>
          <div className="mt-2 w-full bg-secondary rounded-full h-3 border-2 border-border overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-xs text-center mt-1 text-foreground/60">Πρόοδος προς FINISH (κουτί 80)</div>
        </ComicPanel>

        {phase === 'idle' && !mustSkip && !needsSix && (
          <ComicPanel className="text-center py-8 bg-card">
            <div className="font-heading text-2xl mb-4">ΡΙΞΕ ΖΑΡΙ ΓΙΑ {currentPlayer?.name}</div>
            <ComicButton variant="yellow" size="lg" onClick={handleRollDice} className="text-4xl">🎲 ΡΙΞΕ ΖΑΡΙ</ComicButton>
          </ComicPanel>
        )}

        {phase === 'idle' && mustSkip && (
          <ComicPanel className="text-center py-8 bg-destructive text-foreground">
            <div className="font-heading text-2xl mb-2">⏭️ {currentPlayer?.name} ΠΑΡΑΛΕΙΠΕΤΑΙ</div>
            <div className="text-sm mb-4">Χάνει τη σειρά της λόγω παγίδας/ποινής.</div>
            <ComicButton variant="yellow" size="lg" onClick={handleSkipTurn}>➡ ΕΠΟΜΕΝΗ ΣΕΙΡΑ</ComicButton>
          </ComicPanel>
        )}

        {phase === 'idle' && needsSix && (
          <ComicPanel className="text-center py-8 bg-tarot-crimson text-foreground">
            <div className="font-heading text-2xl mb-2">🎲 ΠΑΓΙΔΑ ΚΕΛΙΟΥ — ΧΡΕΙΑΖΕΤΑΙ 6ΑΡΙ</div>
            <div className="text-sm mb-4">{currentPlayer?.name} είναι παγιδευμένη. Μόνο 6άρι την ελευθερώνει!</div>
            <ComicButton variant="yellow" size="lg" onClick={handleRollDice} className="text-4xl">🎲 ΡΙΞΕ ΖΑΡΙ</ComicButton>
          </ComicPanel>
        )}

        {phase === 'trapped' && (
          <ComicPanel className="text-center py-8 bg-destructive text-foreground">
            <div className="font-heading text-3xl mb-2">🔒 ΠΑΓΙΔΑ!</div>
            <div className="text-lg mb-1">Έριξε {lastResult?.dice} — δεν είναι 6άρι.</div>
            <div className="text-sm mb-4">{currentPlayer?.name} μένει παγιδευμένη. Ξαναδοκιμάζει στην επόμενη σειρά της.</div>
            <ComicButton variant="yellow" size="lg" onClick={handleNextTurn}>➡ ΕΠΟΜΕΝΗ ΣΕΙΡΑ</ComicButton>
          </ComicPanel>
        )}

        {phase === 'dead' && (
          <ComicPanel className="bg-card text-center py-6">
            <div className="text-4xl mb-2">{squareType.icon}</div>
            <div className="font-heading text-2xl mb-1">ΝΕΚΡΟ ΚΟΥΤΑΚΙ ({(currentPlayer?.position || 0) + 1})</div>
            <div className="text-sm mb-4">{square.desc}</div>
            <ComicButton variant="yellow" size="lg" onClick={handleNextTurn}>➡ ΕΠΟΜΕΝΗ ΣΕΙΡΑ</ComicButton>
          </ComicPanel>
        )}

        {phase === 'rolled' && square.type === 'command' && (
          <ComicPanel className="bg-card comic-pop">
            <div className="text-center mb-3">
              <div className="font-heading text-2xl">{squareType.icon} ΕΝΤΟΛΗ ({square.position + 1})</div>
            </div>
            <div className="comic-panel-sm p-4 bg-tarot-royal/30 mb-4">
              <p className="text-lg font-medium text-center">{square.desc}</p>
            </div>
            <div className="text-center">
              <ComicButton variant="green" size="lg" onClick={handleCommandDone}>✅ ΕΚΤΕΛΕΣΤΗΚΕ</ComicButton>
            </div>
          </ComicPanel>
        )}

        {phase === 'rolled' && square.type === 'challenge' && (
          <ComicPanel className="bg-card comic-pop">
            <div className="text-center mb-3">
              <div className="font-heading text-2xl">{squareType.icon} CHALLENGE ({square.position + 1})</div>
              <div className="text-sm font-bold text-foreground/60">Επιτυχία = +$5.000 · Αποτυχία = +1⭐</div>
            </div>
            <div className="comic-panel-sm p-4 bg-tarot-gold/20 mb-4">
              <p className="text-lg font-medium text-center">{square.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ComicButton variant="green" size="lg" onClick={() => handleChallengeResult(true)}>✅ ΕΠΙΤΥΧΙΑ (+$5.000)</ComicButton>
              <ComicButton variant="red" size="lg" onClick={() => handleChallengeResult(false)}>❌ ΑΠΟΤΥΧΙΑ (+1⭐)</ComicButton>
            </div>
          </ComicPanel>
        )}

        {phase === 'rolled' && (square.type === 'trap' || square.type === 'penalty') && (
          <ComicPanel className="bg-card comic-pop">
            <div className="text-center mb-3">
              <div className="font-heading text-2xl">{squareType.icon} {square.type === 'trap' ? 'ΠΑΓΙΔΑ' : 'ΠΟΙΝΗ'} ({square.position + 1})</div>
              <div className="text-sm font-bold text-destructive">Αυτόματο εφέ + +1⭐</div>
            </div>
            <div className="comic-panel-sm p-4 bg-destructive/20 mb-4">
              <p className="text-lg font-medium text-center">{square.desc}</p>
            </div>
            <div className="text-center">
              <ComicButton variant="red" size="lg" onClick={handleTrapPenaltyApply}>⚠️ ΕΦΑΡΜΟΓΗ & ΣΥΝΕΧΕΙΑ</ComicButton>
            </div>
          </ComicPanel>
        )}

        {phase === 'rolled' && square.type === 'duel' && !duelOpponentId && (
          <ComicPanel className="bg-card comic-pop">
            <div className="text-center mb-3">
              <div className="font-heading text-2xl">{squareType.icon} ΚΟΝΤΡΑ ({square.position + 1})</div>
              <div className="text-sm font-bold text-foreground/60">Νίκη = +$5.000 · Ήττα = +1⭐</div>
            </div>
            <div className="comic-panel-sm p-4 bg-tarot-sienna/30 mb-4">
              <p className="text-lg font-medium text-center">{square.desc}</p>
            </div>
            <div className="font-bold text-sm mb-2 text-center">Διάλεξε αντίπαλη από την άλλη ομάδα:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {oppPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDuelOpponentId(p.id)}
                  className="comic-panel-sm p-2 bg-card hover:bg-primary/20"
                >
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs">{p.team === 'alpha' ? '💖 Alpha' : '💎 Beta'}</div>
                </button>
              ))}
            </div>
          </ComicPanel>
        )}

        {phase === 'rolled' && square.type === 'duel' && duelOpponentId && (
          <ComicPanel className="bg-card comic-pop">
            <div className="text-center mb-3">
              <div className="font-heading text-2xl">{squareType.icon} ΚΟΝΤΡΑ — ΚΡΙΣΗ</div>
              <div className="text-sm">{square.desc}</div>
            </div>
            <div className="font-bold text-sm mb-3 text-center">Ποια κέρδισε;</div>
            <div className="grid grid-cols-2 gap-3">
              <ComicButton variant="green" size="lg" onClick={() => handleDuelResult(true)}>
                ✅ {currentPlayer?.name}
              </ComicButton>
              <ComicButton variant="red" size="lg" onClick={() => handleDuelResult(false)}>
                ❌ {state.players.find((p) => p.id === duelOpponentId)?.name}
              </ComicButton>
            </div>
          </ComicPanel>
        )}

        {phase === 'result' && lastResult && (
          <ComicPanel className={`text-center py-6 comic-pop ${
            lastResult.type === 'challenge' ? (lastResult.success ? 'bg-tarot-forest' : 'bg-destructive') :
            lastResult.type === 'duel' ? (lastResult.won ? 'bg-tarot-forest' : 'bg-destructive') :
            lastResult.type === 'trap' || lastResult.type === 'penalty' ? 'bg-destructive' :
            'bg-card'
          }`}>
            {lastResult.type === 'challenge' && (
              <>
                <div className="font-heading text-3xl">{lastResult.success ? '✅ ΕΠΙΤΥΧΙΑ! +$5.000' : '❌ ΑΠΟΤΥΧΙΑ! +1⭐'}</div>
                <div className="text-sm mb-4">{currentPlayer?.name} — {lastResult.square.name}</div>
              </>
            )}
            {lastResult.type === 'duel' && (
              <>
                <div className="font-heading text-3xl">{lastResult.won ? '✅ ΝΙΚΗ! +$5.000' : '❌ ΗΤΤΑ! +1⭐'}</div>
                <div className="text-sm mb-4">{currentPlayer?.name} — {lastResult.square.name}</div>
              </>
            )}
            {(lastResult.type === 'trap' || lastResult.type === 'penalty') && (
              <>
                <div className="font-heading text-3xl">⚠️ ΕΦΑΡΜΟΣΤΗΚΕ + +1⭐</div>
                <div className="text-sm mb-2">{currentPlayer?.name} — {lastResult.square.name}</div>
                {lastResult.effect && (
                  <div className="text-xs mb-4 text-foreground/70">
                    {lastResult.effect.type === 'goBack' && `Πίσω ${lastResult.effect.squares} κουτιά`}
                    {lastResult.effect.type === 'goTo' && `Μετακίνηση στο κουτί ${lastResult.effect.position + 1}`}
                    {lastResult.effect.type === 'skipTurn' && 'Παραλείπει την επόμενη σειρά'}
                    {lastResult.effect.type === 'mustRollSix' && 'Παγιδευμένη — χρειάζεται 6άρι'}
                  </div>
                )}
              </>
            )}
            {lastResult.type === 'command' && (
              <>
                <div className="font-heading text-3xl">✅ ΕΚΤΕΛΕΣΘΗΚΕ</div>
                <div className="text-sm mb-4">{currentPlayer?.name} — {lastResult.square.name}</div>
              </>
            )}
            <ComicButton variant="yellow" size="lg" onClick={handleNextTurn}>➡ ΕΠΟΜΕΝΗ ΣΕΙΡΑ</ComicButton>
          </ComicPanel>
        )}

        <ComicPanel className="bg-card">
          <div className="font-heading text-lg mb-2">🗺️ ΨΗΦΙΑΚΟ ΦΙΔΑΚΙ — 80 ΚΟΥΤΙΑ</div>
          <MarathonBoardView players={state.players} highlightPosition={currentPlayer?.position} />
        </ComicPanel>

        <div className="grid grid-cols-2 gap-3">
          <ComicPanel className="bg-tarot-wine/30 p-3">
            <div className="font-heading text-lg">💖 TEAM ALPHA</div>
            <div className="text-sm">${teamLoot.toLocaleString()} · ⭐{teamStars}</div>
            <div className="text-xs mt-1">{state.players.filter((p) => p.team === 'alpha').length} παίκτριες</div>
          </ComicPanel>
          <ComicPanel className="bg-secondary p-3">
            <div className="font-heading text-lg">💎 TEAM BETA</div>
            <div className="text-sm">${oppLoot.toLocaleString()} · ⭐{oppStars}</div>
            <div className="text-xs mt-1">{state.players.filter((p) => p.team === 'beta').length} παίκτριες</div>
          </ComicPanel>
        </div>

        <ComicPanel className="bg-card">
          <div className="font-heading text-sm mb-1">ΣΤΟΧΟΣ: Πρώτη ομάδα που φτάνει στο FINISH (κουτί 80) → Στάδιο 2 (The Vault)</div>
          <div className="w-full bg-secondary rounded-full h-4 border-2 border-border overflow-hidden">
            <div className="bg-tarot-wine h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </ComicPanel>
      </div>
    </div>
  );
}