import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Btn, RestraintNote } from '@/components/modes/ModeShell';
import GameCard from '@/components/shared/GameCard';
import DecibelMeter from '@/components/comic/DecibelMeter';
import { pick, shuffle, sfx, useLocalCountdown } from '@/lib/modeKit';
import {
  LOUNGE_BOARD, SQUARE_TYPES, LOUNGE_CARDS, LOUNGE_PHASES, INTERROGATION_QUESTIONS, LOUNGE_VERDICTS,
  TICKLE_TOOLS, TICKLE_SECONDS, HELL_WHEEL, LOUNGE_FINALE, LOUNGE_MECHANICS, restraintFor, FOOTWEAR_LAYERS,
} from '@/data/modes/loungeContent';

const START_LOOT = 5000;
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('el-GR')}€`;
export const stars = (n) => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, n)));

export function initialLounge(players) {
  const stats = Object.fromEntries(players.map((p) => [p.id, { stars: 1, loot: START_LOOT, footwear: 4, cuffs: 'none', immune: false }]));
  const pos = Object.fromEntries(players.map((p) => [p.id, 0]));
  return { stats, pos, turn: 0, round: 1, chief: pick(players)?.id || null, phase: 0, phaseAt: Date.now(), usedCards: [] };
}

export default function ActLounge({ ctx, state, onFinish }) {
  const { players, mg, setMg, log, nameOf, stopped } = ctx;
  const lg = mg.lounge || {};
  const stats = lg.stats || {};
  const pos = lg.pos || {};
  const cur = players.length ? players[(lg.turn || 0) % players.length] : null;
  const pending = !!(lg.card || lg.interro || lg.tickle || lg.finale);

  useEffect(() => {
    if (!mg.lounge && players.length) setMg({ lounge: initialLounge(players) });
  }, [!!mg.lounge, players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (patch, text) => { setMg({ lounge: { ...lg, ...patch } }); if (text) log(text); };
  const stat = (pid) => stats[pid] || { stars: 1, loot: START_LOOT, footwear: 4, cuffs: 'none' };
  const withStat = (pid, change, base = stats) => ({ ...base, [pid]: { ...stat(pid), ...base[pid], ...change(base[pid] || stat(pid)) } });
  const nextTurn = () => ((lg.turn || 0) + 1) % Math.max(1, players.length);

  function drawCard(pid, extra = {}) {
    let used = lg.usedCards || [];
    let pool = LOUNGE_CARDS.filter((c) => !used.includes(c.id));
    if (!pool.length) { used = []; pool = LOUNGE_CARDS; }
    const card = pick(pool);
    return { card: { ...card, pid, at: Date.now() }, usedCards: [...used, card.id], ...extra };
  }

  function startInterrogation(pid, base = {}) {
    return { interro: { id: `i${Date.now().toString(36)}`, at: Date.now(), pid, idx: 0, questions: shuffle(INTERROGATION_QUESTIONS).slice(0, 3), answers: {} }, ...base };
  }

  function glitch(pid, base) {
    const roll = Math.floor(Math.random() * 3);
    if (roll === 0) return { ...base, alert: { type: 'distraction', title: 'DISTRACTION ALERT!', text: 'Οι ελεύθερες Fugitives έχουν 20″ να κλέψουν το κλειδί από τον λαιμό του Αστυνόμου!', until: Date.now() + 20000 } };
    if (roll === 1) {
      const target = pick(players.filter((p) => p.id !== pid)) || pick(players);
      return { ...base, mission: { pid: target?.id, title: 'Slipper Snatch', text: 'Έχεις 30″ να βγάλεις αθόρυβα τη μία σαγιονάρα της διπλανής σου!', until: Date.now() + 30000 } };
    }
    return { ...base, alert: { type: 'wheel', title: 'Ο ΤΡΟΧΟΣ ΤΗΣ ΚΟΛΑΣΗΣ', text: `${nameOf(pid)} → ${pick(HELL_WHEEL)}`, until: Date.now() + 15000 } };
  }

  function roll(fromMobile = false) {
    if (!cur || pending || stopped) return;
    const d = 1 + Math.floor(Math.random() * 6);
    const from = pos[cur.id] || 0;
    const to = (from + d) % LOUNGE_BOARD.length;
    const type = LOUNGE_BOARD[to];
    let nextStats = stats;
    if (from + d >= LOUNGE_BOARD.length) nextStats = withStat(cur.id, (s) => ({ loot: s.loot + 1000 }), nextStats);
    let patch = { pos: { ...pos, [cur.id]: to }, lastRoll: { pid: cur.id, d, square: type, at: Date.now() }, turn: nextTurn(), ...(fromMobile ? {} : {}) };
    const immune = stat(cur.id).immune;
    if (type === 'loot' || type === 'start') nextStats = withStat(cur.id, (s) => ({ loot: s.loot + (type === 'loot' ? 2000 : 1000) }), nextStats);
    else if (type === 'warrant') patch = { ...patch, ...drawCard(cur.id) };
    else if (type === 'police') {
      if (immune) nextStats = withStat(cur.id, () => ({ immune: false }), nextStats);
      else { nextStats = withStat(cur.id, (s) => ({ stars: Math.min(5, s.stars + 1) }), nextStats); patch = startInterrogation(cur.id, patch); }
    } else if (type === 'safehouse') nextStats = withStat(cur.id, (s) => ({ immune: true, footwear: Math.min(4, s.footwear + 1) }), nextStats);
    else if (type === 'market') patch.card = { id: 'market', title: 'Black Market · The Black Bribe', text: 'Πλήρωσε 50% του Loot σου στην Τράπεζα για να μεταφέρεις την επόμενη ποινή σου σε συμπαίκτρια — ή προχώρα.', pid: cur.id, market: true, at: Date.now() };
    else if (type === 'glitch') patch = glitch(cur.id, patch);
    else if (type === 'tickle') {
      if (immune) nextStats = withStat(cur.id, () => ({ immune: false }), nextStats);
      else patch.tickle = { pid: cur.id, at: Date.now(), secs: stat(cur.id).footwear === 0 ? TICKLE_SECONDS * 2 : TICKLE_SECONDS };
    }
    sfx.click();
    setMg({ lounge: { ...lg, ...patch, stats: nextStats }, ...(fromMobile ? { playerAction: null } : {}) });
    log(`🎲 ${cur.name} έφερε ${d} → ${SQUARE_TYPES[type].icon} ${SQUARE_TYPES[type].name}${immune && ['police', 'tickle'].includes(type) ? ' (ασυλία)' : ''}`);
  }

  function resolveCard(ok) {
    const card = lg.card;
    if (!card) return;
    if (card.finale) { startFinale(); return; }
    const nextStats = ok
      ? withStat(card.pid, (s) => ({ loot: s.loot + 1000 }))
      : withStat(card.pid, (s) => ({ stars: Math.min(5, s.stars + 1), footwear: Math.max(0, s.footwear - 1) }));
    save({ card: null, stats: nextStats }, `${ok ? '✅' : '❌'} ${nameOf(card.pid)}: «${card.title}»${ok ? ' +1.000€' : ' +1⭐ −1 σαγιονάρα/κάλτσα'}`);
    sfx[ok ? 'ok' : 'fail']();
  }

  function payBribe() {
    const card = lg.card;
    save({ card: null, stats: withStat(card.pid, (s) => ({ loot: Math.floor(s.loot / 2), immune: true })) }, `🕶️ ${nameOf(card.pid)} πλήρωσε Black Bribe (50% Loot) — η επόμενη ποινή περνά αλλού`);
  }

  const votesFor = (key) => Object.values(state.loungeVotes || {}).filter((value) => String(value).startsWith(`${key}:`)).map((value) => String(value).split(':')[2]);

  function decide(answer) {
    const it = lg.interro;
    if (!it) return;
    const answers = { ...it.answers, [it.idx]: answer };
    if (it.idx < 2) { save({ interro: { ...it, idx: it.idx + 1, answers } }, `🚔 Ανάκριση ${nameOf(it.pid)} · ερώτηση ${it.idx + 1}: ${answer === 'truth' ? 'ΑΛΗΘΕΙΑ' : 'ΨΕΜΑ'}`); return; }
    const lies = Object.values(answers).filter((a) => a === 'lie').length;
    let change;
    let verdict;
    if (lies === 0) { verdict = LOUNGE_VERDICTS.allTruth; change = (s) => ({ cuffs: 'none', loot: s.loot + 5000, footwear: 4, stars: Math.max(1, s.stars - 1) }); }
    else if (lies < 3) { verdict = LOUNGE_VERDICTS.someLies; change = (s) => ({ stars: Math.min(5, s.stars + 1) }); }
    else { verdict = LOUNGE_VERDICTS.allLies; change = () => ({ stars: 5, loot: 0, cuffs: 'back' }); }
    save({ interro: null, verdict: { pid: it.pid, ...verdict, at: Date.now() }, stats: withStat(it.pid, change) }, `⚖️ Ετυμηγορία ${nameOf(it.pid)}: ${verdict.title}`);
    sfx[lies === 0 ? 'ok' : 'fail']();
  }

  function startFinale() {
    const bare = players.filter((p) => stat(p.id).footwear === 0).length;
    const totalStars = players.reduce((sum, p) => sum + stat(p.id).stars, 0);
    const digits = [(lg.round || 1) % 10, totalStars % 10, players.length % 10, bare % 10];
    const riddle = [
      `1ο ψηφίο: ο γύρος που παίζεται τώρα (το τελευταίο ψηφίο)`,
      `2ο ψηφίο: όλα τα Wanted αστέρια μαζί (το τελευταίο ψηφίο)`,
      `3ο ψηφίο: πόσες παίκτριες παίζουν`,
      `4ο ψηφίο: πόσες είναι Barefoot Targets (χωρίς σαγιονάρες/κάλτσες)`,
    ];
    save({ card: null, interro: null, tickle: null, phase: 3, finale: { code: digits.join(''), riddle, startedAt: Date.now(), winner: null } }, '👑 THE BAREFOOT ESCAPE ξεκίνησε!');
    sfx.alarm();
  }

  useEffect(() => {
    const action = mg.playerAction;
    if (!action) return;
    if (action.type === 'lounge_roll' && cur && action.playerId === cur.id && !pending) { roll(true); return; }
    if (action.type === 'lounge_code' && lg.finale && !lg.finale.winner) {
      if (String(action.code) === lg.finale.code) {
        setMg({ lounge: { ...lg, finale: { ...lg.finale, winner: action.playerId, solvedAt: Date.now() } }, playerAction: null });
        log(`🔓 ${nameOf(action.playerId)} έλυσε πρώτη τον γρίφο!`);
        sfx.ok();
      } else { setMg({ playerAction: null }); log(`❌ ${nameOf(action.playerId)}: λάθος κωδικός`); }
      return;
    }
    if (action.type === 'lounge_mission_done' && lg.mission?.pid === action.playerId) {
      save({ mission: null, stats: withStat(action.playerId, (s) => ({ loot: s.loot + 1000 })) }, `🩴 ${nameOf(action.playerId)} ολοκλήρωσε το Slipper Snatch · +1.000€`);
      setMg({ playerAction: null });
    }
  }, [mg.playerAction?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  const ranking = useMemo(() => [...players].sort((a, b) => stat(b.id).loot - stat(a.id).loot), [players, stats]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mg.lounge) return <Panel>Προετοιμασία ταμπλό…</Panel>;

  const phase = LOUNGE_PHASES[lg.phase || 0];
  const phaseLeft = Math.max(0, phase.minutes * 60 - Math.floor((Date.now() - (lg.phaseAt || Date.now())) / 1000));

  return (
    <div className="space-y-3">
      <Panel>
        <div className="grid grid-cols-4 gap-2">
          {LOUNGE_PHASES.map((p, i) => (
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
          {LOUNGE_BOARD.map((type, i) => {
            const sq = SQUARE_TYPES[type];
            const here = players.filter((p) => (pos[p.id] || 0) === i);
            return (
              <div key={i} className="relative flex aspect-square flex-col items-center justify-center rounded-lg text-center" style={{ background: `${sq.color}1f`, border: `1px solid ${sq.color}${here.length ? '' : '66'}` }} title={sq.text}>
                <span className="text-lg leading-none">{sq.icon}</span>
                <span className="hidden text-[9px] leading-tight opacity-70 sm:block">{sq.name}</span>
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
          <Btn onClick={() => save({ round: (lg.round || 1) + 1, chief: pick(players)?.id }, '👮 Νέος γύρος — νέος Αστυνόμος')}>Νέος γύρος</Btn>
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
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <Btn onClick={() => upd((x) => ({ stars: Math.min(5, x.stars + 1) }), `⭐ ${p.name} +1 Wanted`)}>+⭐</Btn>
                  <Btn onClick={() => upd((x) => ({ stars: Math.max(1, x.stars - 1) }))}>−⭐</Btn>
                  <Btn onClick={() => upd((x) => ({ loot: x.loot + 1000 }))}>+1.000€</Btn>
                  <Btn onClick={() => upd((x) => ({ loot: Math.max(0, x.loot - 1000) }))}>−1.000€</Btn>
                  <Btn onClick={() => upd((x) => ({ footwear: Math.max(0, x.footwear - 1) }), `🧦 ${p.name} έχασε σαγιονάρα/κάλτσα`)}>−🩴</Btn>
                  <Btn onClick={() => upd((x) => ({ footwear: Math.min(4, x.footwear + 1) }))}>+🩴</Btn>
                  <Btn onClick={() => upd((x) => ({ cuffs: x.cuffs === 'none' ? 'back' : x.cuffs === 'back' ? 'partner' : 'none' }))}>⛓️</Btn>
                  <Btn onClick={() => save(startInterrogation(p.id), `🚔 Ανάκριση: ${p.name}`)} disabled={!!lg.interro}>🚔</Btn>
                  <Btn onClick={() => save({ tickle: { pid: p.id, at: Date.now(), secs: s.footwear === 0 ? TICKLE_SECONDS * 2 : TICKLE_SECONDS } })} disabled={!!lg.tickle}>🪶</Btn>
                  <Btn onClick={() => save(drawCard(p.id), `📜 Κάρτα για ${p.name}`)} disabled={!!lg.card}>📜</Btn>
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
