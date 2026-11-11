import React, { useEffect, useState } from 'react';
import PajamaSetup from '@/components/pajama/PajamaSetup';
import PajamaDashboard from '@/components/pajama/PajamaDashboard';
import PajamaWheel from '@/components/pajama/PajamaWheel';
import PajamaConfessions from '@/components/pajama/PajamaConfessions';
import PajamaFinale from '@/components/pajama/PajamaFinale';
import PajamaMorning from '@/components/pajama/PajamaMorning';
import PajamaGiftTrial from '@/components/pajama/PajamaGiftTrial';
import PajamaPenalty from '@/components/pajama/PajamaPenalty';
import PajamaActGate from '@/components/pajama/PajamaActGate';
import PajamaActBreak from '@/components/pajama/PajamaActBreak';
import PajamaSleep from '@/components/pajama/PajamaSleep';
import { loadPajamaContent, defaultPajamaContent } from '@/lib/pajamaContentStore';
import { PAJAMA_BOARD, PAJAMA_NIGHT_LENGTH } from '@/data/pajamaBoard';
import { PAJAMA_ACTS } from '@/data/pajamaProgram';
import { PAJAMA_SABOTAGE_ACTIONS, PAJAMA_SECRET_ORDERS } from '@/data/pajamaSabotage';

function randomSecretOrder() {
  return { ...PAJAMA_SECRET_ORDERS[Math.floor(Math.random() * PAJAMA_SECRET_ORDERS.length)] };
}

const EMPTY = {
  phase: 'setup',
  actIndex: 0,
  actRound: 1,
  actStartedAt: null,
  round: 1,
  turnIndex: 0,
  wheelTurnIndex: 0,
  scores: {},
  fails: {},
  teamMode: false,
  teams: {},
  usedCards: [],
  activeCard: null,
  lastResult: null,
  lastGuess: null,
  confessions: [],
  order: [],
  confessionIndex: 0,
  guesserIndex: 0,
  immunity: [],
  doubleNext: [],
  bindings: {},
  swaps: [],
  penalty: null,
  positions: {},
  lastRoll: null,
  wheelFromBoard: false,
  saboteurId: null,
  sabotageRound: 0,
  sabotages: [],
  secretOrder: null,
  secretOrderDone: false,
  secretOrders: [],
  boardFinish: null,
  breakdown: {},
  gift: null,
};

const DEFAULT_BINDING = 'Χέρια δεμένα πίσω από την πλάτη · πόδια ενωμένα με κορδέλες';

export default function PajamaGame({ state, updateState, onEnd }) {
  const [content, setContent] = useState(null);

  useEffect(() => {
    let alive = true;
    loadPajamaContent()
      .then((c) => alive && setContent(c))
      .catch((e) => {
        console.error('pajama content load error', e);
        if (alive) setContent(defaultPajamaContent());
      });
    return () => { alive = false; };
  }, []);

  const players = state.players || [];
  const pj = { ...EMPTY, ...(state.pajama || {}) };
  const setPj = (patch) => updateState({ pajama: { ...pj, ...patch } });
  const act = PAJAMA_ACTS[Math.min(pj.actIndex || 0, PAJAMA_ACTS.length - 1)];

  useEffect(() => {
    if (!players.length || pj.phase === 'setup' || pj.saboteurId) return;
    const pick = players[Math.floor(Math.random() * players.length)];
    updateState({ pajama: { ...pj, saboteurId: pick.id } });
  }, [players.length, pj.phase, pj.saboteurId]);

  function awards(list) {
    const scores = { ...pj.scores };
    const breakdown = { ...pj.breakdown };
    list.forEach(([id, delta, cat]) => {
      scores[id] = (scores[id] || 0) + delta;
      const prev = breakdown[id] || { main: 0, confessions: 0, sabotage: 0 };
      breakdown[id] = { ...prev, [cat]: (prev[cat] || 0) + delta };
    });
    return { scores, breakdown };
  }

  function withBinding(id, label, untilRound) {
    return { ...pj.bindings, [id]: { label, untilRound: untilRound || null } };
  }

  function unbind(id) {
    const next = { ...pj.bindings };
    delete next[id];
    setPj({ bindings: next });
  }

  function startGame(names, wantTeams) {
    const previous = new Map((players || []).map((p) => [(p.name || '').trim(), p]));
    const roster = (names || [])
      .map((n) => (n || '').trim())
      .filter(Boolean)
      .map((name) => {
        const prev = previous.get(name);
        return {
          id: `pj-${Math.random().toString(36).slice(2, 8)}`,
          name,
          tokens: 0,
          karma: 0,
          slipperType: prev?.slipperType || '',
          nailColor: prev?.nailColor || '',
        };
      });
    const saboteurId = roster.length > 1 ? roster[Math.floor(Math.random() * roster.length)].id : roster[0]?.id || null;
    const teamMode = !!wantTeams && roster.length >= 4;
    const teams = {};
    if (teamMode) {
      [...roster].sort(() => Math.random() - 0.5).forEach((p, i) => {
        teams[p.id] = i % 2 === 0 ? 'A' : 'B';
      });
    }
    updateState({
      players: roster,
      pajama: {
        ...EMPTY,
        phase: 'act-intro',
        actIndex: 0,
        saboteurId,
        teamMode,
        teams,
        secretOrder: randomSecretOrder(),
      },
    });
  }

  function rematch() {
    const saboteurId = players.length > 1 ? players[Math.floor(Math.random() * players.length)].id : players[0]?.id || null;
    const teams = {};
    const teamMode = !!pj.teamMode && players.length >= 4;
    if (teamMode) {
      [...players].sort(() => Math.random() - 0.5).forEach((p, i) => {
        teams[p.id] = i % 2 === 0 ? 'A' : 'B';
      });
    }
    updateState({
      pajama: { ...EMPTY, phase: 'act-intro', actIndex: 0, saboteurId, teamMode, teams, secretOrder: randomSecretOrder() },
    });
  }

  // ---- Πρόγραμμα: μετάβαση πράξεων ----

  function advancePatch() {
    const current = PAJAMA_ACTS[pj.actIndex];
    const next = pj.actIndex + 1;
    if (next >= PAJAMA_ACTS.length) return { phase: 'finale' };
    const nextAct = PAJAMA_ACTS[next];
    if (nextAct.zone === 'morning' && current.zone === 'night') {
      return { phase: 'sleep', actIndex: next };
    }
    return {
      phase: 'act-intro',
      actIndex: next,
      actRound: 1,
      round: pj.round + 1,
      turnIndex: 0,
      wheelTurnIndex: 0,
      activeCard: null,
      lastGuess: null,
      lastResult: null,
      secretOrder: randomSecretOrder(),
      secretOrderDone: false,
    };
  }

  function actEndPatch(withBreak = true) {
    if (withBreak && (act.breakMinutes || 0) > 0) return { phase: 'act-break' };
    return advancePatch();
  }

  function lapPatch() {
    if (pj.actRound < (act.rounds || 1)) {
      const nextRound = pj.round + 1;
      return {
        turnIndex: 0,
        activeCard: null,
        actRound: pj.actRound + 1,
        round: nextRound,
        bindings: Object.fromEntries(
          Object.entries(pj.bindings).filter(([, b]) => !b.untilRound || b.untilRound >= nextRound)
        ),
        secretOrder: randomSecretOrder(),
        secretOrderDone: false,
      };
    }
    if (act.minigame === 'wheel') {
      return { turnIndex: 0, activeCard: null, phase: 'wheel', wheelTurnIndex: 0 };
    }
    return null;
  }

  function applyTurnEnd(extra) {
    const next = pj.turnIndex + 1;
    if (next < players.length) {
      setPj({ ...extra, turnIndex: next, activeCard: null });
      return;
    }
    const lap = lapPatch();
    setPj({ ...extra, ...(lap || actEndPatch()) });
  }

  function beginAct(index) {
    const target = PAJAMA_ACTS[index];
    const base = {
      actIndex: index,
      actRound: 1,
      actStartedAt: Date.now(),
      turnIndex: 0,
      wheelTurnIndex: 0,
      activeCard: null,
      lastGuess: null,
      lastResult: null,
    };
    if (target.kind === 'confessions') {
      setPj({ ...base, phase: 'confessions', confessions: [], order: [], confessionIndex: 0, guesserIndex: 0 });
      return;
    }
    if (target.kind === 'morning') {
      setPj({ ...base, phase: 'morning' });
      return;
    }
    if (target.kind === 'gift') {
      setPj({ ...base, phase: 'gift' });
      return;
    }
    setPj({ ...base, phase: 'dashboard' });
  }

  // ---- Σαμποτάζ ----

  function completeSecretOrder(actorId) {
    if (!pj.secretOrder || pj.secretOrderDone) return;
    if (actorId !== pj.saboteurId) return;
    const points = pj.secretOrder.points || 3;
    setPj({
      secretOrderDone: true,
      ...awards([[actorId, points, 'sabotage']]),
      secretOrders: [
        ...pj.secretOrders,
        { round: pj.round, icon: pj.secretOrder.icon, title: pj.secretOrder.title, points },
      ],
    });
  }

  function doSabotage(actorId, targetId, actionId) {
    const actor = players.find((p) => p.id === actorId);
    const target = players.find((p) => p.id === targetId);
    const action = PAJAMA_SABOTAGE_ACTIONS.find((a) => a.id === actionId);
    if (!actor || !target || !action) return;
    if (actorId !== pj.saboteurId || pj.sabotageRound === pj.round) return;
    setPj({
      ...awards([[actorId, 3, 'sabotage'], [targetId, -1, 'sabotage']]),
      sabotageRound: pj.round,
      sabotages: [
        ...pj.sabotages,
        { round: pj.round, icon: action.icon, action: action.title, targetName: target.name, actorName: actor.name },
      ],
    });
  }

  // ---- Ταμπλό ----

  function drawCard(catId) {
    const cat = (content?.categories || []).find((c) => c.id === catId);
    if (!cat || cat.cards.length === 0) return null;
    let pool = cat.cards.filter((c) => !pj.usedCards.includes(c.id));
    if (pool.length === 0) pool = cat.cards;
    const card = pool[Math.floor(Math.random() * pool.length)];
    return {
      card: { ...card, categoryId: cat.id },
      usedCards: [...new Set([...pj.usedCards, card.id])],
    };
  }

  function rollAndMove() {
    const player = players[pj.turnIndex];
    if (!player || pj.activeCard) return;

    const morning = act.zone === 'morning';
    const start = morning ? PAJAMA_NIGHT_LENGTH : 0;
    const end = morning ? PAJAMA_BOARD.length - 1 : PAJAMA_NIGHT_LENGTH - 1;

    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const dice = d1 + d2;
    const from = Math.max(pj.positions[player.id] || 0, start);
    const to = Math.min(from + dice, end);
    const square = PAJAMA_BOARD[to];
    const positions = { ...pj.positions, [player.id]: to };
    const lastRoll = { name: player.name, d1, d2, dice, from, to, type: square.type };

    if (square.type === 'wildcard') {
      setPj({
        positions,
        lastRoll,
        activeCard: null,
        lastResult: null,
        phase: 'wheel',
        wheelTurnIndex: pj.turnIndex,
        wheelFromBoard: true,
      });
      return;
    }

    if (square.type === 'finish') {
      applyTurnEnd({
        positions,
        lastRoll,
        ...awards([[player.id, 5, 'main']]),
        lastResult: { name: player.name, delta: 5 },
        boardFinish: { name: player.name, round: pj.round },
      });
      return;
    }

    const drawn = drawCard(square.type);
    if (!drawn) {
      applyTurnEnd({ positions, lastRoll, lastResult: null });
      return;
    }
    setPj({ positions, lastRoll, activeCard: drawn.card, usedCards: drawn.usedCards, lastResult: null });
  }

  function resolveCard(success) {
    const card = pj.activeCard;
    const player = players[pj.turnIndex];
    if (!card || !player) return;

    if (success === null) {
      const immunity = card.effect === 'immunity' ? [...new Set([...pj.immunity, player.id])] : pj.immunity;
      applyTurnEnd({ immunity, lastResult: { name: player.name, delta: 0 }, lastGuess: null });
      return;
    }

    if (!success) {
      const immune = pj.immunity.includes(player.id);
      if (immune) {
        const delta = -(card.fail || 1);
        applyTurnEnd({
          ...awards([[player.id, delta, 'main']]),
          immunity: pj.immunity.filter((id) => id !== player.id),
          lastResult: { name: player.name, delta },
          lastGuess: null,
        });
        return;
      }
      const label = card.binding || DEFAULT_BINDING;
      const failCount = (pj.fails?.[player.id] || 0) + 1;
      setPj({
        penalty: {
          playerId: player.id,
          playerName: player.name,
          seconds: Math.min(30 * failCount, 90),
          level: failCount,
          points: card.fail || 1,
          binding: label,
          cardTitle: card.title || '',
        },
        fails: { ...(pj.fails || {}), [player.id]: failCount },
        bindings: withBinding(player.id, label),
        lastResult: null,
      });
      return;
    }

    const doubled = pj.doubleNext.includes(player.id);
    const delta = (card.success || 2) * (doubled ? 2 : 1);
    applyTurnEnd({
      ...awards([[player.id, delta, 'main']]),
      doubleNext: doubled ? pj.doubleNext.filter((id) => id !== player.id) : pj.doubleNext,
      lastResult: { name: player.name, delta },
      lastGuess: null,
    });
  }

  function penaltyDone() {
    const player = players.find((p) => p.id === pj.penalty?.playerId);
    const delta = -(pj.penalty?.points || 1);
    const bindings = { ...pj.bindings };
    if (pj.penalty?.playerId) delete bindings[pj.penalty.playerId];
    applyTurnEnd({
      bindings,
      penalty: null,
      ...(player ? awards([[player.id, delta, 'main']]) : {}),
      lastResult: player ? { name: player.name, delta } : pj.lastResult,
      lastGuess: null,
    });
  }

  // ---- Τροχός ----

  function wheelScore(delta) {
    const player = players[pj.wheelTurnIndex];
    if (!player) return;
    setPj(awards([[player.id, delta, 'main']]));
  }

  function wheelDouble() {
    const player = players[pj.wheelTurnIndex];
    if (!player) return;
    setPj({ doubleNext: [...new Set([...pj.doubleNext, player.id])] });
  }

  function wheelSwap(targetId) {
    const player = players[pj.wheelTurnIndex];
    const target = players.find((p) => p.id === targetId);
    if (!player || !target) return;
    setPj({
      swaps: [...pj.swaps, {
        playerId: player.id,
        playerName: player.name,
        targetId: target.id,
        targetName: target.name,
        untilRound: pj.round + 2,
      }],
    });
  }

  function wheelNext() {
    if (pj.wheelFromBoard) {
      applyTurnEnd({ phase: 'dashboard', wheelFromBoard: false, wheelTurnIndex: 0 });
      return;
    }
    const next = pj.wheelTurnIndex + 1;
    if (next < players.length) {
      setPj({ wheelTurnIndex: next });
      return;
    }
    setPj({ wheelTurnIndex: 0, ...actEndPatch() });
  }

  // ---- Εξομολογήσεις ----

  function submitConfession(playerId, text) {
    if (!text.trim()) return;
    const confessions = [...pj.confessions.filter((c) => c.playerId !== playerId), { playerId, text: text.trim() }];
    setPj({ confessions });
  }

  function startGuessing() {
    const order = pj.confessions.map((_, i) => i).sort(() => Math.random() - 0.5);
    setPj({ order, confessionIndex: 0, guesserIndex: 0, lastGuess: null });
  }

  function guess(playerId) {
    const secret = pj.confessions[pj.order[pj.confessionIndex]];
    const guesser = players[pj.guesserIndex % players.length];
    const writer = players.find((p) => p.id === secret.playerId);
    const correct = secret.playerId === playerId;

    const scored = correct ? awards([[guesser.id, 2, 'confessions']]) : awards([[writer.id, 3, 'confessions']]);
    const isLast = pj.confessionIndex + 1 >= pj.order.length;
    const lastGuess = correct
      ? `Σωστά! +2 στη ${guesser.name}`
      : `Λάθος! +3 στη ${writer?.name}`;

    setPj({
      ...scored,
      guesserIndex: pj.guesserIndex + 1,
      confessionIndex: isLast ? pj.confessionIndex : pj.confessionIndex + 1,
      lastGuess,
      ...(isLast ? actEndPatch() : {}),
    });
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-200 flex items-center justify-center">
        <div className="font-heading text-xl animate-pulse">ΦΟΡΤΩΣΗ PAJAMA MODE...</div>
      </div>
    );
  }

  if (pj.penalty) return <PajamaPenalty penalty={pj.penalty} onDone={penaltyDone} />;

  if (pj.phase === 'setup') return <PajamaSetup players={players} sessionCode={state.sessionCode} onStart={startGame} />;

  if (pj.phase === 'act-intro') {
    return <PajamaActGate act={act} index={pj.actIndex} onStart={() => beginAct(pj.actIndex)} />;
  }

  if (pj.phase === 'act-break') {
    return (
      <PajamaActBreak
        nextAct={PAJAMA_ACTS[pj.actIndex + 1]}
        minutes={act.breakMinutes}
        onContinue={() => setPj(advancePatch())}
      />
    );
  }

  if (pj.phase === 'sleep') {
    return <PajamaSleep players={players} pj={pj} act={act} onWake={() => beginAct(pj.actIndex)} />;
  }

  if (pj.phase === 'wheel') {
    return (
      <PajamaWheel
        key={`wheel-${pj.actIndex}-${pj.actRound}-${pj.wheelTurnIndex}`}
        player={players[pj.wheelTurnIndex]}
        players={players}
        index={pj.wheelTurnIndex}
        total={players.length}
        onScore={wheelScore}
        onDouble={wheelDouble}
        onSwap={wheelSwap}
        onNext={wheelNext}
      />
    );
  }

  if (pj.phase === 'confessions') {
    return (
      <PajamaConfessions
        players={players}
        pj={pj}
        secretIdeas={content.secrets}
        onSubmit={submitConfession}
        onStartGuessing={startGuessing}
        onGuess={guess}
      />
    );
  }

  if (pj.phase === 'morning') {
    return (
      <PajamaMorning
        players={players}
        pj={pj}
        onScore={(playerId, delta) => setPj(awards([[playerId, delta, 'main']]))}
        onFinish={() => setPj(advancePatch())}
      />
    );
  }

  if (pj.phase === 'gift') {
    return (
      <PajamaGiftTrial
        players={players}
        onDone={(gift) => setPj({ gift, phase: 'finale' })}
      />
    );
  }

  if (pj.phase === 'finale') return <PajamaFinale players={players} pj={pj} onEnd={onEnd} onRematch={rematch} />;

  return (
    <PajamaDashboard
      players={players}
      pj={pj}
      act={act}
      categories={content.categories}
      currentPlayer={players[pj.turnIndex]}
      onRoll={rollAndMove}
      onResolve={resolveCard}
      onUnbind={unbind}
      onSabotage={doSabotage}
      onCompleteOrder={completeSecretOrder}
    />
  );
}