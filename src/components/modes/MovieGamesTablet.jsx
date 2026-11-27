import React, { useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { sfx } from '@/lib/modeKit';
import * as G from '@/lib/movieGamesEngine';
import { statsOf, currentAct } from '@/lib/campaignEngine';
import { continentOf, WANTED_LEVELS } from '@/data/modes/campaignContent';
import { VILLA_QUESTIONS, VILLA_FLIRT_QUESTIONS, VILLA_DARES, VILLA_NAIL_CARDS } from '@/data/modes/villaContent';
import {
  WHEELS, wheelOf, wheelItem, GAMES, GUESS_ITEMS, DOND_OFFERS, DOND_ROUNDS, MANDATORY_TEXT, MANDATORY_STAGES, WHEEL_LABEL, fillAll, BEERPONG,
} from '@/data/modes/movieGames';

// Η ΤΑΙΝΙΑ · Tablet: υποχρεωτική κλήρωση μετά την ήπειρο, Τροχοί, Καρέκλα, 4 παιχνίδια, εντάλματα.
// Ο Τροχός κληρώνει μόνο ποινές μέσα στα όρια της παίκτριας (check-in)· το ΣΤΟΠ ισχύει πάντα.

const card = 'mvg-glass mvg-3d space-y-2 p-3';
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function useWheelTools({ ctx, cg, up, allowed }) {
  const { nameOf, log } = ctx;
  const profileOf = (pid) => ctx.players?.find((p) => p.id === pid)?.movieProfile;
  const allowedIds = (wheelId, pid) => wheelOf(wheelId).items.filter((i) => allowed(pid, { title: i.title, text: i.tv }) && G.profileAllows(profileOf(pid), i)).map((i) => i.id);
  // Γυρίζει τον Τροχό (wheelId) για την pid. Η κλήρωση γίνεται εδώ (μία φορά), η εγγραφή μέσα στο up.
  // extra(c) τρέχει πάνω στο αποτέλεσμα (π.χ. ανακοίνωση σύλληψης).
  const spin = (wheelId, pid, reason = '', extra = null) => {
    if (!pid) return;
    if (G.isFree(cg, pid)) { log(`🕊️ ${nameOf(pid)} έχει κερδίσει ελευθερία — εκτός Τροχών`); return; }
    const ids = allowedIds(wheelId, pid);
    const chosen = ids.length ? pick(ids) : null;
    up((c) => { const out = G.spinWheel(c, wheelId, pid, { allowedIds: chosen ? [chosen] : [], reason }).cg; return extra ? extra(out) : out; });
    log(`🎡 ${wheelOf(wheelId).name} → ${nameOf(pid)}: ${chosen ? wheelItem(wheelId, chosen).title : 'καμία ποινή εντός ορίων — PASS'}`);
    sfx.click?.();
  };
  return { spin, allowedIds };
}

function PlayerSelect({ players, value, onChange, label = 'Παίκτρια', exclude = [] }) {
  return (
    <select className="ui-input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">— {label} —</option>
      {players.filter((p) => !exclude.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

// Τρέχων Τροχός: αποτέλεσμα, επιβεβαίωση από το κινητό, «εκτελέστηκε».
export function WheelStatus({ ctx, cg, up }) {
  const w = cg.wheel;
  if (!w || w.done) return null;
  const item = wheelItem(w.id, w.itemId);
  return (
    <div className="space-y-2 rounded-2xl bg-[#3A0A12] p-3">
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{WHEEL_LABEL[w.id]}</div>
      <div className="font-bold">🎡 {ctx.nameOf(w.pid)}: {item ? item.title : 'PASS — καμία ποινή εντός ορίων'}</div>
      {item && <p className="text-sm opacity-80">{fillAll(item.tv, { name: ctx.nameOf(w.pid) })}</p>}
      <div className="text-xs opacity-70">{w.confirmed ? '📱 Επιβεβαιώθηκε από το κινητό' : '📱 Αναμονή επιβεβαίωσης από το κινητό'}{item?.secs ? ` · ⏱ ${item.secs}″` : ''}</div>
      <Btn color="bg-emerald-600" onClick={() => { up((c) => G.endWheel(c)); ctx.log(`✅ Ποινή εκτελέστηκε: ${ctx.nameOf(w.pid)}`); }}>✅ Η ΠΟΙΝΗ ΕΚΤΕΛΕΣΤΗΚΕ</Btn>
    </div>
  );
}

// Δ. Υποχρεωτικό γεγονός μετά από κάθε ήπειρο (Οθόνη 1).
export function MandatoryPanel({ ctx, cg, up, players, allowed }) {
  const [manual, setManual] = useState('');
  const { spin } = useWheelTools({ ctx, cg, up, allowed });
  const m = cg.mandatory;
  const wheelLive = cg.wheel && cg.wheel.reason === 'mandatory' && !cg.wheel.done;
  if (!m?.pending && !wheelLive) return null;
  const closedIdx = Object.keys(cg.conquered || {}).map(Number).sort((a, b) => b - a)[0];
  const continent = continentOf((cg.conquered || {})[closedIdx]?.continent || currentAct(cg).continent).name;
  const name = m.pid ? ctx.nameOf(m.pid) : '';
  const stage = wheelLive ? MANDATORY_STAGES.spin.mobile : m.pid ? MANDATORY_STAGES.drawn.tv.text : MANDATORY_STAGES.closing.tv.text;
  return (
    <div className="space-y-2 rounded-2xl border border-[#FF3B5C]/60 bg-[#3A0A12] p-3">
      <div className="font-bold">⚠️ {MANDATORY_TEXT.title} · {continent}</div>
      <p className="text-sm opacity-80">{fillAll(stage, { name, continent })}</p>
      <ol className="list-decimal space-y-0.5 pl-5 text-xs opacity-70"><li>{MANDATORY_TEXT.draw}</li><li>{MANDATORY_TEXT.spin}</li></ol>
      {m.pending && (
        <>
          <div className="flex flex-wrap gap-2">
            <Btn color="bg-amber-500" onClick={() => { const r = G.mandatoryDraw(cg, players); ctx.log(r.pid ? `🎲 Υποχρεωτική κλήρωση: ${ctx.nameOf(r.pid)}` : '⏭ Καμία διαθέσιμη παίκτρια'); if (r.pid) up((c) => G.mandatoryDraw(c, players, { pid: r.pid }).cg); sfx.click?.(); }}>🎲 ΚΛΗΡΩΣΗ ΚΟΠΕΛΑΣ</Btn>
            <PlayerSelect players={players} value={manual} onChange={(v) => { setManual(v); if (v) up((c) => G.mandatoryDraw(c, players, { pid: v }).cg); }} label="ή επιλογή" />
          </div>
          {m.pid && (
            <div className="grid gap-2 sm:grid-cols-3">
              {WHEELS.map((w) => <Btn key={w.id} color="bg-red-600" onClick={() => spin(w.id, m.pid, 'mandatory')}>🎡 {w.name}: {w.subtitle}</Btn>)}
            </div>
          )}
          <button type="button" className="text-xs underline opacity-60" onClick={() => { if (window.confirm('Παράλειψη της υποχρεωτικής κλήρωσης; (π.χ. όλες έχουν ελευθερία)')) up((c) => G.mandatorySkip(c)); }}>Παράλειψη (μόνο αν καμία δεν μπορεί)</button>
        </>
      )}
      {wheelLive && <WheelStatus ctx={ctx} cg={cg} up={up} />}
    </div>
  );
}

// Οθόνη 7 — Παιχνίδια & Τροχοί.
export default function MovieGamesTablet({ ctx, cg, up, players, allowed }) {
  const { nameOf, log } = ctx;
  const { spin } = useWheelTools({ ctx, cg, up, allowed });
  const [pid, setPid] = useState('');
  const [wheelFor, setWheelFor] = useState(1);
  const [game, setGame] = useState(cg.game || 'tod');
  const [teamA, setTeamA] = useState([]);
  const [cupWheel, setCupWheel] = useState(false);
  const [guessItem, setGuessItem] = useState(GUESS_ITEMS[0] || '');
  const [prize, setPrize] = useState('');
  const [offer, setOffer] = useState(DOND_OFFERS[0] || '');
  const target = pid || cg.chair?.pid || '';
  const nm = (id) => (id ? nameOf(id) : '—');

  const WheelPicker = (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="opacity-70">Τροχός σε ποινή:</span>
      {WHEELS.map((w) => <button key={w.id} type="button" onClick={() => setWheelFor(w.id)} className={`rounded-full px-2.5 py-1 font-semibold ${wheelFor === w.id ? 'bg-[#FF3B5C] text-white' : 'bg-white/10'}`}>{w.id}ος</button>)}
    </div>
  );

  // ---------- Θάρρος ή Αλήθεια ----------
  const tod = cg.game === 'tod' ? cg.tod : null;
  const drawTodCard = (choice) => {
    const pool = (choice === 'dare' ? [...VILLA_DARES, ...VILLA_NAIL_CARDS] : [...VILLA_QUESTIONS, ...VILLA_FLIRT_QUESTIONS]).filter((c) => allowed(tod.pid, c));
    const c = pool.length ? pick(pool) : null;
    up((x) => G.todCard(x, c));
    if (c) log(`🎭 ${choice === 'dare' ? 'Θάρρος' : 'Αλήθεια'} → ${nameOf(tod.pid)}: ${c.title}`);
  };
  const todDone = (result) => {
    up((x) => G.todResult(x, result));
    log(`🎭 ${nameOf(tod.pid)}: ${result === 'ok' ? '✅ Σωστά/εκτελέστηκε' : result === 'wrong' ? '❌ Λάθος απάντηση' : '❌ Άρνηση/δισταγμός'}`);
    if (G.todNeedsWheel(result)) spin(wheelFor, tod.pid, 'tod');
  };

  // ---------- Beerpong ----------
  const bp = cg.game === 'beerpong' ? cg.bp : null;
  const hit = (team) => {
    const losing = team === 'a' ? bp.b : bp.a;
    up((x) => G.bpHit(x, team));
    if (cupWheel && losing.length) spin(wheelFor, pick(losing), 'beerpong');
  };

  // ---------- Deal or No Deal ----------
  const d = cg.game === 'dond' ? cg.dond : null;
  const need = d ? DOND_ROUNDS[Math.min(d.round, DOND_ROUNDS.length - 1)] : 0;
  const openBox = (no) => {
    const box = d.boxes.find((b) => b.no === no);
    if (!box || box.open) return;
    up((x) => G.dondOpen(x, no).cg);
    log(`💼 Κουτί ${no}: ${box.label}`);
    if (box.wheel) spin(box.wheel, d.pid, 'dond');
  };

  return (
    <Panel title="🎮 Οθόνη 7 — Παιχνίδια, Τροχοί & Καρέκλα Ανάκρισης" accent="gold">
      <WheelStatus ctx={ctx} cg={cg} up={up} />

      <div className={card}>
        <div className="font-bold">🎡 Οι 3 Τροχοί Ποινών</div>
        <PlayerSelect players={players} value={target} onChange={setPid} />
        <div className="grid gap-2 sm:grid-cols-3">
          {WHEELS.map((w) => <Btn key={w.id} color="bg-red-600" disabled={!target} onClick={() => spin(w.id, target, 'manual')}>🎡 {w.name}<br /><span className="text-xs opacity-80">{w.subtitle}</span></Btn>)}
        </div>
        <details className="text-xs opacity-80"><summary className="cursor-pointer">Τι έχει κάθε Τροχός</summary>
          {WHEELS.map((w) => <div key={w.id} className="mt-1"><b>{w.name}:</b> {w.items.map((i) => i.title).join(' · ')}</div>)}
        </details>
      </div>

      <div className={card}>
        <div className="font-bold">🪑 Καρέκλα Ανάκρισης (χέρια & πόδια δεμένα)</div>
        <div className="text-sm opacity-75">{cg.chair?.active ? `Στην καρέκλα: ${nm(cg.chair.pid)}` : 'Η καρέκλα είναι άδεια.'}</div>
        <div className="flex flex-wrap gap-2">
          <Btn color="bg-amber-500" disabled={!target || cg.chair?.active || players.find((p) => p.id === target)?.movieProfile?.chairOk === false} onClick={() => { up((c) => G.chairIn(c, target)); log(`🪑 ${nameOf(target)} στην Καρέκλα Ανάκρισης`); }}>🪑 ΣΤΗΝ ΚΑΡΕΚΛΑ</Btn>
          <Btn disabled={!cg.chair?.active} onClick={() => { up((c) => G.chairOut(c)); log(`🔓 ${nm(cg.chair?.pid)} λύθηκε από την Καρέκλα`); }}>🔓 ΑΠΟΔΕΣΜΕΥΣΗ</Btn>
        </div>
      </div>

      <div className={card}>
        <div className="font-bold">🚨 Ένταλμα, Wanted Level & Καταζητούμενη</div>
        <div className="flex flex-wrap gap-2">
          <Btn color="bg-red-600" disabled={!target} onClick={() => { up((c) => G.issueWarrant(c, target)); log(`🚨 Ένταλμα: ${nameOf(target)}`); }}>🚨 ΕΝΤΑΛΜΑ</Btn>
          <Btn disabled={!target} onClick={() => { up((c) => G.raiseWanted(c, target)); log(`⭐ +1 Wanted: ${nameOf(target)}`); }}>⭐ +1 WANTED</Btn>
          <Btn color="bg-amber-500" disabled={!target} onClick={() => { up((c) => G.setMostWanted(c, target)); log(`🎯 Καταζητούμενη: ${nameOf(target)}`); }}>🎯 ΚΑΤΑΖΗΤΟΥΜΕΝΗ</Btn>
          <Btn color="bg-red-600" disabled={!target} onClick={() => spin(wheelFor, target, 'arrest', (c) => { const o = G.issueWarrant(c, target); return G.announce(o, 'arrestwheel', target, { level: statsOf(o, target).wanted, wheel: wheelFor }); })}>⛓️ ΣΥΛΛΗΨΗ + ΤΡΟΧΟΣ</Btn>
        </div>
        {WheelPicker}
        {target && <div className="text-xs opacity-70">Wanted {statsOf(cg, target).wanted}/5 · {WANTED_LEVELS[statsOf(cg, target).wanted]?.label || ''}{statsOf(cg, target).flags?.warrant ? ' · 🚨 ενεργό ένταλμα' : ''}{cg.mostWanted === target ? ' · 🎯 Καταζητούμενη' : ''}</div>}
        {target && statsOf(cg, target).flags?.warrant && <button type="button" className="text-xs underline opacity-70" onClick={() => up((c) => G.clearWarrant(c, target))}>Ακύρωση εντάλματος</button>}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {GAMES.map((g) => <button key={g.id} type="button" onClick={() => setGame(g.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold ${game === g.id ? 'bg-[#E8C26B] text-black' : 'bg-white/10'}`}>{g.icon} {g.no}. {g.name}{cg.game === g.id ? ' · LIVE' : ''}</button>)}
      </div>
      <p className="text-xs opacity-70">{GAMES.find((g) => g.id === game)?.text}</p>
      {cg.game && <Btn onClick={() => { up((c) => G.gameEnd(c)); log('■ Τέλος παιχνιδιού'); }}>■ ΤΕΛΟΣ ΠΑΙΧΝΙΔΙΟΥ (TV)</Btn>}

      {game === 'tod' && (
        <div className={card}>
          {!tod ? (
            <Btn color="bg-amber-500" disabled={!target} onClick={() => { up((c) => G.todStart(c, target)); log(`🎭 Θάρρος ή Αλήθεια: ${nameOf(target)}`); }}>▶ ΕΝΑΡΞΗ για {nm(target)}</Btn>
          ) : (
            <>
              <div className="font-bold">🎭 {nm(tod.pid)} · {tod.choice ? (tod.choice === 'truth' ? 'ΑΛΗΘΕΙΑ' : 'ΘΑΡΡΟΣ') : 'διαλέγει στο κινητό…'}</div>
              {!tod.choice && <div className="flex gap-2"><Btn onClick={() => up((c) => G.todChoose(c, 'truth'))}>ΑΛΗΘΕΙΑ</Btn><Btn onClick={() => up((c) => G.todChoose(c, 'dare'))}>ΘΑΡΡΟΣ</Btn></div>}
              {tod.choice && <Btn color="bg-amber-500" onClick={() => drawTodCard(tod.choice)}>🎴 {tod.cardTitle ? 'Άλλη κάρτα' : 'ΤΡΑΒΗΞΕ ΚΑΡΤΑ-ΔΙΑΤΑΓΗ'}</Btn>}
              {tod.cardTitle && <div className="rounded-xl bg-black/40 p-2 text-sm"><b>ΔΙΑΤΑΓΗ · {tod.cardTitle}</b><br />{tod.cardText}</div>}
              {WheelPicker}
              {tod.cardTitle && !tod.result && (
                <div className="grid grid-cols-3 gap-2">
                  <Btn color="bg-emerald-600" onClick={() => todDone('ok')}>✅ ΟΚ</Btn>
                  <Btn color="bg-red-600" disabled={tod.choice !== 'truth'} onClick={() => todDone('wrong')}>❌ ΛΑΘΟΣ → Τροχός</Btn>
                  <Btn color="bg-red-600" disabled={tod.choice !== 'dare'} onClick={() => todDone('refuse')}>❌ ΑΡΝΗΣΗ → Τροχός</Btn>
                </div>
              )}
              {tod.result && <Btn onClick={() => { up((c) => G.todStart(c, target || tod.pid)); }}>↻ Νέος γύρος ({nm(target || tod.pid)})</Btn>}
            </>
          )}
        </div>
      )}

      {game === 'beerpong' && (
        <div className={card}>
          {!bp || bp.winner ? (
            <>
              <div className="text-sm">Ομάδα Α (οι υπόλοιπες = Ομάδα Β):</div>
              <div className="flex flex-wrap gap-2">{players.map((p) => <label key={p.id} className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-sm"><input type="checkbox" checked={teamA.includes(p.id)} onChange={(e) => setTeamA((t) => (e.target.checked ? [...t, p.id] : t.filter((x) => x !== p.id)))} />{p.name}</label>)}</div>
              {bp?.winner && <div className="font-bold">🏆 Νίκησε η Ομάδα {bp.winner === 'a' ? 'Α' : 'Β'}</div>}
              {bp?.winner && <Btn color="bg-red-600" onClick={() => (bp.winner === 'a' ? bp.b : bp.a).forEach((id, i) => setTimeout(() => spin(wheelFor, id, 'beerpong'), i * 50))}>🎡 Τροχός για τη χαμένη ομάδα</Btn>}
              <Btn color="bg-amber-500" disabled={!teamA.length || teamA.length === players.length} onClick={() => { up((c) => G.bpStart(c, teamA, players.map((p) => p.id).filter((id) => !teamA.includes(id)), BEERPONG.cups)); log('🍺 Beerpong ξεκίνησε'); }}>▶ ΕΝΑΡΞΗ BEERPONG ({BEERPONG.cups} ποτήρια)</Btn>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-black/40 p-2"><div className="text-xs opacity-70">Ομάδα Α · {bp.a.map(nm).join(', ')}</div><div className="text-3xl font-black tabular-nums">{bp.cupsA}</div></div>
                <div className="rounded-xl bg-black/40 p-2"><div className="text-xs opacity-70">Ομάδα Β · {bp.b.map(nm).join(', ')}</div><div className="text-3xl font-black tabular-nums">{bp.cupsB}</div></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Btn color="bg-emerald-600" onClick={() => hit('a')}>🎯 Ευστοχία Α</Btn>
                <Btn color="bg-emerald-600" onClick={() => hit('b')}>🎯 Ευστοχία Β</Btn>
              </div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={cupWheel} onChange={(e) => setCupWheel(e.target.checked)} /> Τροχός σε κάθε χαμένο ποτήρι (τυχαία από τη χαμένη ομάδα)</label>
              {WheelPicker}
            </>
          )}
        </div>
      )}

      {game === 'guess' && (
        <div className={card}>
          {cg.game !== 'guess' || cg.guess?.result ? (
            <>
              <select className="ui-input" value={guessItem} onChange={(e) => setGuessItem(e.target.value)} aria-label="Αντικείμενο">{GUESS_ITEMS.map((g) => <option key={g}>{g}</option>)}</select>
              <p className="text-xs opacity-60">Το αντικείμενο φαίνεται μόνο εδώ — όχι στην TV ή στα κινητά.</p>
              {cg.guess?.result && <div className="text-sm">Τελευταίο: {nm(cg.guess.pid)} · {cg.guess.result === 'ok' ? '✅ Το βρήκε' : '❌ Αποτυχία'}</div>}
              <Btn color="bg-amber-500" disabled={!target} onClick={() => { up((c) => G.guessStart(c, target, guessItem)); log(`🙈 Μάντεψε τι είναι: ${nameOf(target)}`); }}>▶ ΕΝΑΡΞΗ για {nm(target)} (μάσκα ύπνου)</Btn>
            </>
          ) : (
            <>
              <div className="font-bold">🙈 {nm(cg.guess.pid)} · αντικείμενο: {cg.guess.item}</div>
              {WheelPicker}
              <div className="grid grid-cols-2 gap-2">
                <Btn color="bg-emerald-600" onClick={() => { up((c) => G.guessResult(c, true)); log(`✅ ${nameOf(cg.guess.pid)} το μάντεψε`); }}>✅ ΤΟ ΒΡΗΚΕ</Btn>
                <Btn color="bg-red-600" onClick={() => { const p = cg.guess.pid; up((c) => G.guessResult(c, false)); spin(wheelFor, p, 'guess'); }}>❌ ΑΠΟΤΥΧΙΑ → Τροχός</Btn>
              </div>
            </>
          )}
        </div>
      )}

      {game === 'dond' && (
        <div className={card}>
          {!d || ['won', 'lost'].includes(d.status) ? (
            <>
              {d && <div className="text-sm">Τελευταίο: {d.status === 'won' ? `🕊️ Ελευθερία + δώρο για ${nm(d.prizePid)}` : 'Χωρίς ελευθερία'}</div>}
              <div className="grid gap-2 sm:grid-cols-2">
                <PlayerSelect players={players} value={target} onChange={setPid} label="Παίκτρια που παίζει" />
                <PlayerSelect players={players} value={prize} onChange={setPrize} label="Κοπέλα του επάθλου (ελευθερία)" />
              </div>
              <Btn color="bg-amber-500" disabled={!target} onClick={() => { up((c) => G.dondStart(c, target, prize || target)); log(`💼 Deal or No Deal: ${nameOf(target)} για την ελευθερία της ${nameOf(prize || target)}`); }}>▶ ΕΝΑΡΞΗ DEAL OR NO DEAL</Btn>
            </>
          ) : (
            <>
              <div className="text-sm"><b>{nm(d.pid)}</b> παίζει για την ελευθερία της <b>{nm(d.prizePid)}</b> + δώρο · Γύρος {d.round + 1} · {d.status === 'pick' ? 'διαλέγει το κουτί της' : d.status === 'open' ? `άνοιξε ${d.openedInRound}/${need}` : d.status}</div>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                {d.boxes.map((b) => (
                  <button key={b.no} type="button" disabled={b.open || (d.status === 'open' && b.no === d.myBox) || !['pick', 'open'].includes(d.status)}
                    onClick={() => (d.status === 'pick' ? up((c) => G.dondPick(c, b.no)) : openBox(b.no))}
                    className={`rounded-lg p-1.5 text-center text-xs font-bold ${b.open ? (b.kind === 'trap' ? 'bg-red-900/60' : 'bg-white/5 opacity-60') : b.no === d.myBox ? 'bg-[#E8C26B] text-black' : 'bg-[#8E6B1F]'}`}>
                    💼 {b.no}<div className="text-[10px] font-normal">{b.open || b.no !== d.myBox ? b.label : 'ΤΟ ΚΟΥΤΙ ΤΗΣ'}</div>
                  </button>
                ))}
              </div>
              {d.status === 'offer_wait' && (
                <div className="flex flex-wrap gap-2">
                  <select className="ui-input" value={offer} onChange={(e) => setOffer(e.target.value)} aria-label="Προσφορά">{DOND_OFFERS.map((o) => <option key={o}>{o}</option>)}</select>
                  <Btn color="bg-amber-500" onClick={() => { up((c) => G.dondOffer(c, offer)); log(`☎️ Προσφορά: ${offer}`); }}>☎️ ΠΡΟΣΦΟΡΑ ΤΡΑΠΕΖΙΤΗ → TV</Btn>
                </div>
              )}
              {d.status === 'offer' && (
                <div className="grid grid-cols-2 gap-2">
                  <Btn color="bg-emerald-600" onClick={() => { up((c) => G.dondDecide(c, 'deal')); log('🤝 DEAL'); }}>🤝 DEAL</Btn>
                  <Btn color="bg-red-600" onClick={() => { up((c) => G.dondDecide(c, 'nodeal')); log('✋ NO DEAL'); }}>✋ NO DEAL</Btn>
                  <p className="col-span-2 text-xs opacity-60">Η παίκτρια απαντά και από το κινητό της.</p>
                </div>
              )}
              {d.status === 'final' && <Btn color="bg-amber-500" onClick={() => up((c) => G.dondReveal(c))}>🎁 ΑΝΟΙΓΜΑ ΤΟΥ ΚΟΥΤΙΟΥ ΤΗΣ</Btn>}
              {['deal', 'revealed'].includes(d.status) && (
                <div className="space-y-2">
                  <div className="font-bold">{d.result?.kind === 'deal' ? `🤝 DEAL: ${d.result.text}` : `🎁 Το κουτί της: ${d.result?.text}`}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Btn color="bg-emerald-600" onClick={() => { up((c) => G.dondAward(c, true)); sfx.ok?.(); }}>🕊️ ΕΛΕΥΘΕΡΙΑ + ΔΩΡΟ</Btn>
                    <Btn onClick={() => up((c) => G.dondAward(c, false))}>Χωρίς ελευθερία</Btn>
                  </div>
                  <p className="text-xs opacity-60">Πρόταση: {d.result?.win ? 'κέρδισε (μεγάλο έπαθλο / συμφωνία)' : 'δεν κέρδισε μεγάλο έπαθλο'}.</p>
                </div>
              )}
              {WheelPicker}
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
