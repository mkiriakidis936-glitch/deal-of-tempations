import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Btn, RestraintNote } from '@/components/modes/ModeShell';
import GameCard from '@/components/shared/GameCard';
import DecibelMeter from '@/components/comic/DecibelMeter';
import { pick, sfx, useLocalCountdown } from '@/lib/modeKit';
import { SQUARE_TYPES,
  TICKLE_TOOLS, LOUNGE_FINALE, LOUNGE_MECHANICS, restraintFor, FOOTWEAR_LAYERS,
} from '@/data/modes/loungeContent';

import * as E from '@/lib/boardEngine';
import { LOUNGE_RULES } from '@/data/modes/loungeContent';
import { customModeById, isCustomMode, rulesFromCustom } from '@/lib/customModes';

const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('el-GR')}€`;
export const stars = (n) => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, n)));

const SNAPSHOT_KEYS = ['title', 'board', 'cards', 'questions', 'phases', 'startLoot', 'passStartBonus', 'tickleSeconds', 'cardReward'];

// Κανόνες της παρτίδας: για custom modes «παγώνουν» μέσα στην παρτίδα ώστε TV/κινητά να βλέπουν το ίδιο ταμπλό.
export function rulesForGame(mode, lounge) {
  if (lounge?.rules) return { ...LOUNGE_RULES, ...lounge.rules };
  if (isCustomMode(mode)) return rulesFromCustom(customModeById(mode) || { id: mode });
  return LOUNGE_RULES;
}

export function initialLounge(players, mode) {
  const rules = rulesForGame(mode, null);
  const board = E.createBoard(players, rules);
  if (!isCustomMode(mode)) return board;
  return { ...board, rules: Object.fromEntries(SNAPSHOT_KEYS.map((key) => [key, rules[key]])) };
}

export default function ActLounge({ ctx, state, onFinish }) {
  const { players, mg, setMg, log, nameOf, stopped } = ctx;
  const lg = mg.lounge || {};
  const stats = lg.stats || {};
  const pos = lg.pos || {};
  const cur = E.currentPlayer(lg, players);
  const pending = E.isBusy(lg);
  const RULES = rulesForGame(state.mode, mg.lounge);

  useEffect(() => {
    if (!mg.lounge && players.length) setMg({ lounge: initialLounge(players, state.mode) });
  }, [!!mg.lounge, players.length]);  

  const commit = (next, text, extra = {}) => { setMg({ lounge: next, ...extra }); if (text) log(text); };
  const save = (patch, text) => commit({ ...lg, ...patch }, text);
  const stat = (pid) => E.statOf(lg, RULES, pid);
  const withStat = (pid, change, base = lg) => E.updateStat(base, RULES, pid, change).stats;
  const drawCard = (pid) => E.drawCard(lg, RULES, pid);
  const startInterrogation = (pid) => E.startInterrogation(lg, RULES, pid);

  function roll(fromMobile = false) {
    if (!cur || pending || stopped) return;
    const { lounge, event } = E.applyRoll(lg, players, RULES);
    if (!event) return;
    const sq = SQUARE_TYPES[event.square];
    sfx.click();
    commit(lounge, `🎲 ${nameOf(event.pid)} έφερε ${event.d} → ${sq.icon} ${sq.name}${event.immuneUsed ? ' (ασυλία)' : ''}`, fromMobile ? { playerAction: null } : {});
  }

  function resolveCard(ok) {
    const card = lg.card;
    if (!card) return;
    if (card.finale) { startFinale(); return; }
    commit(E.resolveCard(lg, RULES, ok), `${ok ? '✅' : '❌'} ${nameOf(card.pid)}: «${card.title}»${ok ? ' +1.000€' : ' +1⭐ −1 σαγιονάρα/κάλτσα'}`);
    sfx[ok ? 'ok' : 'fail']();
  }

  function payBribe() {
    commit(E.payBribe(lg, RULES), `🕶️ ${nameOf(lg.card?.pid)} πλήρωσε Black Bribe (50% Loot) — η επόμενη ποινή περνά αλλού`);
  }

  const votesFor = (key) => {
    const t = E.tallyVotes(state.loungeVotes, key);
    return [...Array(t.truth).fill('truth'), ...Array(t.lie).fill('lie')];
  };

  function decide(answer) {
    const it = lg.interro;
    if (!it) return;
    const { lounge, verdict } = E.answerInterrogation(lg, RULES, answer);
    if (!verdict) { commit(lounge, `🚔 Ανάκριση ${nameOf(it.pid)} · ερώτηση ${it.idx + 1}: ${answer === 'truth' ? 'ΑΛΗΘΕΙΑ' : 'ΨΕΜΑ'}`); return; }
    commit(lounge, `⚖️ Ετυμηγορία ${nameOf(it.pid)}: ${verdict.title}`);
    sfx[verdict.key === 'allTruth' ? 'ok' : 'fail']();
  }

  function startFinale() {
    commit(E.startFinale(lg, players, RULES), '👑 THE BAREFOOT ESCAPE ξεκίνησε!');
    sfx.alarm();
  }

  useEffect(() => {
    const action = mg.playerAction;
    if (!action) return;
    if (action.type === 'lounge_roll' && cur && action.playerId === cur.id && !pending) { roll(true); return; }
    if (action.type === 'lounge_code' && lg.finale && !lg.finale.winner) {
      const result = E.submitFinaleCode(lg, action.playerId, action.code);
      if (result.correct) {
        setMg({ lounge: result.lounge, playerAction: null });
        log(`🔓 ${nameOf(action.playerId)} έλυσε πρώτη τον γρίφο!`);
        sfx.ok();
      } else { setMg({ playerAction: null }); log(`❌ ${nameOf(action.playerId)}: λάθος κωδικός`); }
      return;
    }
    if (action.type === 'lounge_mission_done' && lg.mission?.pid === action.playerId) {
      save({ mission: null, stats: withStat(action.playerId, (s) => ({ loot: s.loot + 1000 })) }, `🩴 ${nameOf(action.playerId)} ολοκλήρωσε το Slipper Snatch · +1.000€`);
      setMg({ playerAction: null });
    }
  }, [mg.playerAction?.at]);  

  const ranking = useMemo(() => E.rankByLoot(lg, players, RULES), [players, stats]);  

  if (!mg.lounge) return <Panel>Προετοιμασία ταμπλό…</Panel>;

  const phase = RULES.phases[Math.min(lg.phase || 0, RULES.phases.length - 1)];
  const phaseLeft = Math.max(0, phase.minutes * 60 - Math.floor((Date.now() - (lg.phaseAt || Date.now())) / 1000));

  return (
    <div className="space-y-3">
      <Panel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RULES.phases.map((p, i) => (
            <button key={p.id} type="button" onClick={() => save({ phase: i, phaseAt: Date.now() }, `🎬 Φάση ${i + 1}: ${p.name}`)} className={`rounded-xl border p-2 text-left text-xs ${i === (lg.phase || 0) ? 'border-[#E8C26B] bg-[#E8C26B]/15' : 'border-white/10 opacity-70'}`}>
              <div className="font-bold">Φάση {i + 1} · {p.minutes}′</div>
              <div className="truncate">{p.name}</div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>{phase.text}</span>
          <span className="font-mono text-[#E8C26B]">{Math.floor(phaseLeft / 60)}:{String(phaseLeft % 60).padStart(2, '0')}</span>
        </div>
      </Panel>

      <Panel title={`🎲 Σειρά: ${cur?.name || '—'} · Γύρος ${lg.round || 1} · 👮 Αστυνόμος: ${nameOf(lg.chief) || '—'}`}>
        <div className="grid grid-cols-7 gap-1.5">
          {RULES.board.map((type, i) => {
            const sq = SQUARE_TYPES[type];
            const here = players.filter((p) => (pos[p.id] || 0) === i);
            return (
              <div key={i} className="relative flex h-[68px] flex-col items-center justify-center rounded-lg text-center" style={{ background: `${sq.color}1f`, border: `1px solid ${sq.color}${here.length ? '' : '66'}` }} title={sq.text}>
                <span className="text-lg leading-none">{sq.icon}</span>
                <span className="hidden text-[11px] leading-tight opacity-70 sm:block">{sq.name}</span>
                <span className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                  {here.map((p) => <b key={p.id} className="rounded px-1 text-[10px]" style={{ background: p.id === cur?.id ? '#E8C26B' : '#fff', color: '#000' }}>{(p.name || '?')[0]}</b>)}
                </span>
              </div>
            );
          })}
        </div>
        {lg.lastRoll && <div className="text-center text-sm opacity-80">Τελευταία ζαριά: {nameOf(lg.lastRoll.pid)} 🎲 {lg.lastRoll.d} → {SQUARE_TYPES[lg.lastRoll.square]?.name}</div>}
        <div className="flex flex-wrap justify-center gap-2">
          <Btn color="bg-[#E8C26B] text-black" disabled={!cur || pending || stopped} onClick={() => roll(false)}>🎲 ΡΙΞΕ ΖΑΡΙ — {cur?.name}</Btn>
          <Btn onClick={() => commit(E.newRound(lg, players), '👮 Νέος γύρος — νέος Αστυνόμος')}>Νέος γύρος</Btn>
          <Btn onClick={() => save({ alert: { type: 'distraction', title: 'DISTRACTION ALERT!', text: 'Οι ελεύθερες Fugitives έχουν 20″ να κλέψουν το κλειδί από τον λαιμό του Αστυνόμου!', until: Date.now() + 20000 } }, '🚨 Distraction Alert')}>🚨 Αντιπερισπασμός</Btn>
          <Btn onClick={() => { const t = pick(players); save({ mission: { pid: t?.id, title: 'Slipper Snatch', text: 'Έχεις 30″ να βγάλεις αθόρυβα τη μία σαγιονάρα της διπλανής σου!', until: Date.now() + 30000 } }, `🩴 Μυστική αποστολή στο κινητό της ${t?.name}`); }}>🩴 Slipper Snatch</Btn>
          <Btn color="bg-red-800" disabled={!!lg.finale} onClick={startFinale}>👑 Barefoot Escape</Btn>
        </div>
      </Panel>

      {lg.alert && Date.now() < lg.alert.until && (
        <Panel accent="#FF453A"><div className="text-center"><div className="font-heading text-2xl text-[#FF453A]">{lg.alert.title}</div><p>{lg.alert.text}</p></div></Panel>
      )}

      {lg.card && (
        <Panel accent="#E8C26B">
          <GameCard kicker={lg.card.market ? 'Μαύρη Αγορά' : 'Κάρτα Εντάλματος'} corner={nameOf(lg.card.pid)} icon={lg.card.market ? '🕶️' : '📜'} image={lg.card.image} title={lg.card.title} text={lg.card.text} footLeft={lg.card.secs ? `⏱ ${lg.card.secs}″` : ''} footRight={lg.card.market ? '−50% Loot' : '+1.000€ / +1⭐'} />
          <RestraintNote />
          <div className="flex flex-wrap justify-center gap-2">
            {lg.card.market ? (
              <>
                <Btn color="bg-purple-700" onClick={payBribe}>Πληρωμή 50%</Btn>
                <Btn onClick={() => save({ card: null })}>Προχώρα</Btn>
              </>
            ) : lg.card.finale ? (
              <Btn color="bg-red-800" onClick={startFinale}>👑 Έναρξη φινάλε</Btn>
            ) : (
              <>
                <Btn color="bg-emerald-700" onClick={() => resolveCard(true)}>✅ Το έκανε</Btn>
                <Btn color="bg-red-800" onClick={() => resolveCard(false)}>❌ Αρνήθηκε / απέτυχε</Btn>
              </>
            )}
          </div>
        </Panel>
      )}

      {lg.interro && (() => {
        const key = `${lg.interro.id}:${lg.interro.idx}`;
        const votes = votesFor(key);
        const truth = votes.filter((v) => v === 'truth').length;
        const lie = votes.filter((v) => v === 'lie').length;
        return (
          <Panel title={`🚔 Ανάκριση: ${nameOf(lg.interro.pid)} · ερώτηση ${lg.interro.idx + 1}/3`} accent="#FF453A">
            <div className="text-center text-2xl font-heading">{lg.interro.questions[lg.interro.idx]}</div>
            <p className="text-center text-sm opacity-75">5″ για απάντηση — αλλιώς 1 σφηνάκι. Οι υπόλοιπες ψηφίζουν κρυφά στο κινητό.</p>
            <div className="text-center text-sm">Ψήφοι: ✅ {truth} · ❌ {lie}</div>
            <div className="flex justify-center gap-2">
              <Btn color="bg-emerald-700" onClick={() => decide('truth')}>ΑΛΗΘΕΙΑ{truth > lie ? ' (πλειοψηφία)' : ''}</Btn>
              <Btn color="bg-red-800" onClick={() => decide('lie')}>ΨΕΜΑ{lie > truth ? ' (πλειοψηφία)' : ''}</Btn>
            </div>
          </Panel>
        );
      })()}

      {lg.verdict && Date.now() - lg.verdict.at < 20000 && (
        <Panel accent="#E8C26B"><div className="text-center"><div className="font-heading text-xl">{lg.verdict.title} · {nameOf(lg.verdict.pid)}</div><p className="text-sm">{lg.verdict.text}</p></div></Panel>
      )}

      {lg.tickle && <TicklePanel key={lg.tickle.at} tickle={lg.tickle} name={nameOf(lg.tickle.pid)} onDone={(ok) => save({ tickle: null, ...(ok ? {} : { stats: withStat(lg.tickle.pid, (s) => ({ footwear: Math.max(0, s.footwear - 1), stars: Math.min(5, s.stars + 1) })) }) }, `🪶 ${nameOf(lg.tickle.pid)}: ${ok ? 'άντεξε σιωπηλά!' : 'γέλασε — +1⭐ −1 κάλτσα'}`)} />}

      {lg.finale && (
        <Panel title={`👑 ${LOUNGE_FINALE.title}`} accent="#E8C26B">
          <ol className="list-decimal space-y-1 pl-5 text-sm">{LOUNGE_FINALE.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <div className="rounded-xl border border-[#E8C26B]/40 p-3 text-sm">
            <div className="font-bold">Γρίφος στα κινητά:</div>
            {lg.finale.riddle.map((r) => <div key={r}>• {r}</div>)}
            <div className="mt-2 text-xs opacity-70">Σωστός κωδικός (μόνο εσύ τον βλέπεις): <b className="font-mono">{lg.finale.code}</b></div>
          </div>
          {lg.finale.winner
            ? <div className="text-center space-y-2"><div className="font-heading text-2xl text-[#E8C26B]">🔓 {nameOf(lg.finale.winner)} έλυσε πρώτη!</div><Btn color="bg-[#E8C26B] text-black" onClick={() => { setMg({ lounge: { ...lg, queen: lg.finale.winner }, loungeQueen: lg.finale.winner }); log(`👑 ${nameOf(lg.finale.winner)} — ${LOUNGE_FINALE.crown}`); onFinish(); }}>LOCKDOWN COMPLETE — Στέψη</Btn></div>
            : <div className="flex flex-wrap justify-center gap-2">{players.map((p) => <Btn key={p.id} onClick={() => save({ finale: { ...lg.finale, winner: p.id } }, `🔓 ${p.name} τερμάτισε πρώτη`)}>{p.name} τερμάτισε πρώτη</Btn>)}</div>}
        </Panel>
      )}

      <Panel title="⭐ Παίκτριες · Wanted · Loot · Άμυνα">
        <div className="space-y-2">
          {ranking.map((p) => {
            const s = stat(p.id);
            const r = restraintFor(s.stars);
            const upd = (change, text) => save({ stats: withStat(p.id, change) }, text);
            return (
              <div key={p.id} className="rounded-xl border border-white/10 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="min-w-[90px]">{p.id === lg.chief ? '👮 ' : ''}{p.name}</b>
                  <span className="font-mono text-[#E8C26B]">{stars(s.stars)}</span>
                  <span className="font-mono">{money(s.loot)}</span>
                  <span title={FOOTWEAR_LAYERS.join(' · ')}>{'🩴'.repeat(Math.min(2, s.footwear))}{'🧦'.repeat(Math.max(0, s.footwear - 2))}{s.footwear === 0 ? ' 🦶 BAREFOOT TARGET' : ''}</span>
                  {s.immune && <span className="rounded-full bg-emerald-500/20 px-2 text-xs">🛡️ ασυλία</span>}
                  {s.cuffs !== 'none' && <span className="rounded-full bg-red-500/20 px-2 text-xs">⛓️ {s.cuffs === 'back' ? 'χειροπέδες πίσω' : 'partner cuffs'}</span>}
                </div>
                <div className="mt-1 text-xs opacity-70">Δέσιμο: {r.name} — {r.text}</div>
                <div className="ui-btn-group-sm mt-2 flex flex-wrap gap-1.5">
                  <Btn onClick={() => upd((x) => ({ stars: Math.min(5, x.stars + 1) }), `⭐ ${p.name} +1 Wanted`)}>+⭐</Btn>
                  <Btn onClick={() => upd((x) => ({ stars: Math.max(1, x.stars - 1) }))}>−⭐</Btn>
                  <Btn onClick={() => upd((x) => ({ loot: x.loot + 1000 }))}>+1.000€</Btn>
                  <Btn onClick={() => upd((x) => ({ loot: Math.max(0, x.loot - 1000) }))}>−1.000€</Btn>
                  <Btn onClick={() => upd((x) => ({ footwear: Math.max(0, x.footwear - 1) }), `🧦 ${p.name} έχασε σαγιονάρα/κάλτσα`)}>−🩴</Btn>
                  <Btn onClick={() => upd((x) => ({ footwear: Math.min(4, x.footwear + 1) }))}>+🩴</Btn>
                  <Btn onClick={() => upd((x) => ({ cuffs: x.cuffs === 'none' ? 'back' : x.cuffs === 'back' ? 'partner' : 'none' }))}>⛓️</Btn>
                  <Btn onClick={() => commit(startInterrogation(p.id), `🚔 Ανάκριση: ${p.name}`)} disabled={!!lg.interro}>🚔</Btn>
                  <Btn onClick={() => save({ tickle: { pid: p.id, at: Date.now(), secs: s.footwear === 0 ? RULES.tickleSeconds * 2 : RULES.tickleSeconds } })} disabled={!!lg.tickle}>🪶</Btn>
                  <Btn onClick={() => commit(drawCard(p.id), `📜 Κάρτα για ${p.name}`)} disabled={!!lg.card}>📜</Btn>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="📖 Μηχανισμοί">
        <div className="grid gap-2 sm:grid-cols-2">
          {LOUNGE_MECHANICS.map((m) => <div key={m.id} className="rounded-lg border border-white/10 p-2 text-xs"><b>{m.title}</b><div className="opacity-75">{m.text}</div></div>)}
        </div>
      </Panel>
    </div>
  );
}

function TicklePanel({ tickle, name, onDone }) {
  const [extra, setExtra] = useState(0);
  const total = tickle.secs + extra;
  const left = useLocalCountdown(total, true, () => sfx.alarm());
  const elapsed = total - left;
  const tool = TICKLE_TOOLS[Math.min(TICKLE_TOOLS.length - 1, Math.floor(elapsed / (total / TICKLE_TOOLS.length)))];
  return (
    <Panel title={`🪶 Παγίδα Γέλιου · ${name}`} accent="#FF375F">
      <div className="text-center">
        <div className="font-mono text-5xl">{Math.ceil(left)}″</div>
        <div className="text-lg">Εργαλείο τώρα: <b>{tool}</b></div>
        <p className="text-sm opacity-75">Ο Κανόνας της Σιωπής: αν η μπάρα χτυπήσει κόκκινο, +30″.</p>
      </div>
      <DecibelMeter onThreshold={() => setExtra((n) => n + 30)} label="DECIBEL METER" />
      <RestraintNote />
      <div className="flex justify-center gap-2">
        <Btn onClick={() => setExtra((n) => n + 30)}>+30″</Btn>
        <Btn color="bg-emerald-700" onClick={() => onDone(true)}>Άντεξε</Btn>
        <Btn color="bg-red-800" onClick={() => onDone(false)}>Γέλασε</Btn>
      </div>
    </Panel>
  );
}
