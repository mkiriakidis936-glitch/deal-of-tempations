import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import BoardView from '@/components/shared/BoardView';
import PlayerCard from '@/components/shared/PlayerCard';
import PenaltyLadder from '@/components/shared/PenaltyLadder';
import ExtremeProtocolsPanel from '@/components/shared/ExtremeProtocolsPanel';
import RoleAbilitiesPanel from '@/components/tablet/RoleAbilitiesPanel';
import DigitalCardsPanel from '@/components/shared/DigitalCardsPanel';
import BountyMultiplier from '@/components/shared/BountyMultiplier';
import SpeakButton from '@/components/comic/VoiceReader';
import { SQUARE_TYPES, getPenaltyLadder } from '@/data/gameConfig';
import { BLACK_MARKET_OPTIONS } from '@/data/gameContent';
import { getSquareChallenge } from '@/data/squareChallenges';
import {
  rollDice, drawCard, getBoardSquare, applyPenaltyStep,
  isFullyRestrained, getCurrentPenalty, addHistory, assignChief,
  applyGlitchEffect,
} from '@/lib/gameLogic';

export default function PatrolScreen({ state, updateState, onGoToStage2 }) {
  const [uiPhase, setUiPhase] = useState('idle');

  const currentPlayer = state.players[state.currentPlayerIndex];
  const square = getBoardSquare(currentPlayer.position);
  const squareType = SQUARE_TYPES[square.type] || SQUARE_TYPES.street;

  async function handleRollDice() {
    const dice = rollDice();
    const newPos = (currentPlayer.position + dice) % 44;
    const updatedPlayers = state.players.map((p, i) =>
      i === state.currentPlayerIndex ? { ...p, position: newPos } : p
    );
    const sq = getBoardSquare(newPos);
    const fixed = getSquareChallenge(newPos);
    await updateState({
      players: updatedPlayers,
      diceValue: dice,
      activeCard: fixed ? { name: fixed.title, text: fixed.text, duration: fixed.duration, icon: fixed.type === 'truth' ? '💬' : '🔥' } : null,
      cardAction: fixed ? (fixed.type === 'truth' ? 'street_truth' : 'street_dare') : null,
      glitchCard: sq.type === 'glitch' ? drawCard('glitch') : null,
      history: addHistory(state, { type: 'move', player: currentPlayer.name, dice, position: newPos, squareType: sq.type }),
    });
    setUiPhase(fixed ? 'card' : 'rolled');
  }

  async function handleChooseAction(choice) {
    const cardType = choice === 'truth' ? 'street_truth' : 'street_dare';
    const card = drawCard(cardType);
    await updateState({ activeCard: card, cardAction: cardType });
    setUiPhase('card');
  }

  async function handleCardResult(success) {
    let updatedPlayers = state.players.map((p) => ({ ...p, bounty: p.bounty || 0 }));
    const player = { ...updatedPlayers[state.currentPlayerIndex] };
    let history = state.history;

    if (success) {
      if (state.cardAction === 'street_dare') {
        const multiplier = state.doubleBountyNextRound ? 2 : 1;
        player.bounty = player.bounty + 500 * multiplier;
      }
      updatedPlayers[state.currentPlayerIndex] = player;
      history = addHistory({ ...state, players: updatedPlayers }, { type: 'success', player: player.name, card: state.activeCard?.name });
    } else {
      if (player.immunity) {
        updatedPlayers[state.currentPlayerIndex] = { ...player, immunity: false };
        history = addHistory({ ...state, players: updatedPlayers }, { type: 'immunity_used', player: player.name });
      } else {
        const penalized = applyPenaltyStep(player);
        updatedPlayers[state.currentPlayerIndex] = penalized;
        history = addHistory({ ...state, players: updatedPlayers }, { type: 'fail', player: player.name, card: state.activeCard?.name, penalty: getCurrentPenalty(penalized)?.label });
        if (isFullyRestrained(penalized)) {
          await updateState({ players: updatedPlayers, history });
          onGoToStage2();
          return;
        }
      }
    }
    await updateState({ players: updatedPlayers, history });
    setUiPhase('result');
  }

  async function handleGlitchApply(card) {
    const { players: updatedPlayers, extra } = applyGlitchEffect(state, card);
    const history = addHistory({ ...state, players: updatedPlayers, ...extra }, { type: 'glitch', card: card?.name, player: currentPlayer.name });
    await updateState({ players: updatedPlayers, history, activeCard: card, glitchCard: null, ...extra });
    setUiPhase('result');
  }

  async function handleWarrantTarget(idx, card) {
    const target = state.players[idx];
    const history = addHistory(state, { type: 'warrant', card: card?.name, player: currentPlayer.name, target: target.name });
    await updateState({ activeCard: card, history });
    setUiPhase('result');
  }

  async function handleBlackMarket(optionId) {
    const option = BLACK_MARKET_OPTIONS.find((o) => o.id === optionId);
    const history = addHistory(state, { type: 'blackmarket', option: option?.name, player: currentPlayer.name });
    await updateState({ history });
    setUiPhase('result');
  }

  async function handleNextPlayer() {
    const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
    const newRound = nextIdx === 0 ? state.round + 1 : state.round;
    let updatedPlayers = state.players.map((p) => ({ ...p, bounty: p.bounty || 0 }));
    if (nextIdx === 0) {
      updatedPlayers = assignChief(updatedPlayers);
    }
    await updateState({
      players: updatedPlayers,
      currentPlayerIndex: nextIdx,
      round: newRound,
      diceValue: null,
      activeCard: null,
      cardAction: null,
      glitchCard: null,
      doubleBountyNextRound: false,
    });
    setUiPhase('idle');
  }

  return (
    <div className="min-h-screen comic-dots p-3 pb-24">
      <div className="max-w-5xl mx-auto space-y-3">
        <ComicPanel className="bg-secondary flex flex-wrap items-center justify-between gap-2 py-3">
          <div className="font-heading text-2xl text-primary">🚨 ΣΤΑΔΙΟ 1: ΠΕΡΙΠΟΛΙΑ</div>
          <div className="flex items-center gap-3 text-sm font-bold">
            <RoleAbilitiesPanel state={state} updateState={updateState} />
            <DigitalCardsPanel state={state} updateState={updateState} />
            <ExtremeProtocolsPanel state={state} updateState={updateState} />
            <BountyMultiplier state={state} />
            <span className="bg-background text-primary px-2 py-1 rounded font-body">ΓΥΡΟΣ {state.round}</span>
            <span className="bg-card border-2 border-border px-2 py-1 rounded text-foreground font-body">Κωδικός: {state.sessionCode || '------'}</span>
          </div>
        </ComicPanel>

        <ComicPanel className="ds-sheen">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="ds-eyebrow text-primary/80">Σειρά</div>
              <div className="ds-title mt-1 text-3xl text-foreground">{currentPlayer.name}</div>
              <div className="ds-label mt-2">
                {currentPlayer.isChief ? 'Αστυνόμος' : 'Κλέφτρα'} · Θέση {currentPlayer.position}/43
              </div>
            </div>
            {state.diceValue && (
              <div className="text-right">
                <div className="ds-label">Ζάρι</div>
                <div className="ds-value text-6xl leading-none text-primary">{state.diceValue}</div>
              </div>
            )}
          </div>
        </ComicPanel>

        {uiPhase === 'idle' && (
          <ComicPanel className="py-8 text-center">
            <div className="ds-label">Ρίξε ζάρι για</div>
            <div className="ds-title mb-5 mt-2 text-2xl text-foreground">{currentPlayer.name}</div>
            <ComicButton variant="yellow" size="lg" onClick={handleRollDice} className="text-4xl">
              🎲 ΡΙΞΕ ΖΑΡΙ
            </ComicButton>
          </ComicPanel>
        )}

        {uiPhase === 'rolled' && (
          <ComicPanel className="bg-card">
            <div className="text-center mb-3">
              <div className="font-heading text-xl text-foreground">→ {squareType.icon} {squareType.label}</div>
              <div className="text-sm text-foreground/70 font-body">{squareType.desc}</div>
            </div>
            {square.type === 'street' && (
              <div className="grid grid-cols-2 gap-3">
                <ComicButton variant="cyan" size="lg" onClick={() => handleChooseAction('truth')}>
                  💬 ΑΛΗΘΕΙΑ
                </ComicButton>
                <ComicButton variant="magenta" size="lg" onClick={() => handleChooseAction('dare')}>
                  🔥 ΤΟΛΜΗ
                </ComicButton>
              </div>
            )}
            {square.type === 'police' && (
              <div className="text-center">
                <div className="font-heading text-lg mb-2 text-foreground">🚔 ΣΥΛΛΗΨΗ! Πάς για Ανάκριση.</div>
                <ComicButton variant="red" size="lg" onClick={onGoToStage2}>
                  ⚡ ΠΡΟΣ ΑΝΑΚΡΙΣΗ
                </ComicButton>
              </div>
            )}
            {square.type === 'safehouse' && (
              <div className="text-center">
                <div className="font-heading text-lg mb-2 text-foreground">🏠 Κρησφύγετο! Πλήρης Ασυλία.</div>
                <ComicButton variant="green" size="lg" onClick={handleNextPlayer}>
                  ✅ ΣΥΝΕΧΕΙΑ
                </ComicButton>
              </div>
            )}
            {square.type === 'blackmarket' && (
              <div className="space-y-2">
                <div className="font-heading text-lg text-center text-primary">🛍️ ΜΑΥΡΗ ΑΓΟΡΑ</div>
                {BLACK_MARKET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleBlackMarket(opt.id)}
                    className="comic-panel-sm p-2 w-full text-left flex items-center gap-2 bg-tarot-royal/30"
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-foreground">{opt.name}</div>
                      <div className="text-xs text-foreground/70 font-body">{opt.desc}</div>
                    </div>
                    <span className="text-xs font-bold bg-background text-primary px-2 py-0.5 rounded font-body">{opt.cost}</span>
                  </button>
                ))}
              </div>
            )}
            {square.type === 'warrant' && (
              <div className="space-y-2">
                <div className="font-heading text-lg text-center text-primary">📜 ΕΝΤΑΛΜΑ — Διάλεξε Στόχο</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {state.players.filter((p) => p.id !== currentPlayer.id).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleWarrantTarget(state.players.indexOf(p), drawCard('warrant'))}
                      className="comic-panel-sm p-2 bg-destructive/30 hover:bg-destructive/50 text-foreground"
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-foreground/70 font-body">Ποινή: {p.penaltyStep}/{getPenaltyLadder(p.footwearLevel).length}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {square.type === 'glitch' && state.glitchCard && (
              <div className="text-center">
                <div className="text-4xl mb-2">{state.glitchCard.icon}</div>
                <div className="font-heading text-xl text-foreground">{state.glitchCard.name}</div>
                <div className="text-sm mb-3 text-foreground/70 font-body">{state.glitchCard.desc}</div>
                <div className="mb-3">
                  <SpeakButton text={`${state.glitchCard.name}. ${state.glitchCard.desc}`} label="🔊 ΕΚΦΩΝΗΣΗ" />
                </div>
                <ComicButton variant="purple" size="lg" onClick={() => handleGlitchApply(state.glitchCard)}>
                  ⚡ ΕΦΑΡΜΟΓΗ
                </ComicButton>
              </div>
            )}
          </ComicPanel>
        )}

        {uiPhase === 'card' && state.activeCard && (
          <ComicPanel className="bg-card comic-pop">
            <div className="text-center mb-3">
              <div className="font-heading text-2xl text-primary">
                {state.cardAction === 'street_truth' ? '💬 ΑΛΗΘΕΙΑ' : '🔥 ΤΟΛΜΗ'}
              </div>
              <div className="text-sm font-bold text-foreground/60 font-body">{state.activeCard.name}</div>
            </div>
            <div className="comic-panel-sm p-4 bg-secondary mb-4">
              <p className="text-lg font-medium text-foreground font-body">{state.activeCard.text}</p>
              {state.activeCard.duration && (
                <div className="mt-2 text-center font-heading text-xl text-destructive">
                  ⏱ {state.activeCard.duration}″
                </div>
              )}
            </div>
            <div className="text-center mb-3">
              <SpeakButton text={state.activeCard.text} label="🔊 ΕΚΦΩΝΗΣΗ" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ComicButton variant="green" size="lg" onClick={() => handleCardResult(true)}>
                ✅ ΕΠΙΤΥΧΙΑ
              </ComicButton>
              <ComicButton variant="red" size="lg" onClick={() => handleCardResult(false)}>
                ❌ ΑΠΟΤΥΧΙΑ
              </ComicButton>
            </div>
            {state.cardAction === 'street_dare' && (
              <div className="text-center text-xs mt-2 text-foreground/60 font-body">
                Επιτυχία Τολμηρίας = +$500 · Αποτυχία = +1 ποινή
              </div>
            )}
          </ComicPanel>
        )}

        {uiPhase === 'result' && (
          <ComicPanel className="bg-card text-center py-6">
            {state.activeCard && (
              <div className="mb-4 comic-panel-sm p-3 bg-tarot-royal/20 text-left">
                <div className="font-heading text-lg text-primary">{state.activeCard.icon} {state.activeCard.name}</div>
                {state.activeCard.desc && <div className="text-sm text-foreground/70 font-body">{state.activeCard.desc}</div>}
                {state.activeCard.text && <div className="text-sm text-foreground font-body">{state.activeCard.text}</div>}
              </div>
            )}
            <div className="font-heading text-2xl mb-4 text-primary">ΟΛΟΚΛΗΡΩΘΗΚΕ</div>
            <ComicButton variant="yellow" size="lg" onClick={handleNextPlayer}>
              ➡ ΕΠΟΜΕΝΗ ΠΑΙΚΤΡΙΑ
            </ComicButton>
          </ComicPanel>
        )}

        <ComicPanel className="bg-card">
          <div className="font-heading text-lg mb-2 text-primary">🗺️ ΤΑΜΠΛΟ 44 ΚΟΥΤΙΩΝ</div>
          <BoardView players={state.players} />
        </ComicPanel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ComicPanel className="bg-card">
            <div className="font-heading text-lg mb-2 text-primary">👥 ΠΑΙΚΤΡΙΕΣ</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {state.players.map((p, i) => (
                <PlayerCard key={p.id} player={p} isCurrent={i === state.currentPlayerIndex} showRole compact />
              ))}
            </div>
          </ComicPanel>
          <PenaltyLadder player={currentPlayer} />
        </div>
      </div>
    </div>
  );
}