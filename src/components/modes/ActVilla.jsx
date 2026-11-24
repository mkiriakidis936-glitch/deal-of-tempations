import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import MissionPanel from '@/components/modes/MissionPanel';
import { blockedBy, textOf, pickAllowed, consentOf } from '@/lib/consent';
import { sfx, pick } from '@/lib/modeKit';
import { pointsOf, rankPlayers } from '@/lib/modeRanking';
import {
  VILLA_SQUARES, VILLA_CARDS, VILLA_MISSIONS, VILLA_ALERTS, VILLA_AWARDS, SQUARE_TYPES, VILLA_SAFETY, SOCK_LOOT,
} from '@/data/modes/villaContent';
import * as V from '@/lib/villaEngine';

// VILLA TAKEOVER 48/72 — Tablet της διοργανώτριας.
export default function ActVilla({ ctx, state, updateState, onFinish }) {
  const { players, mg, setMg, log, addScore, nameOf, stopped } = ctx;
  const v = mg.villa || {};
  const [who, setWho] = useState('');
  const [alertTo, setAlertTo] = useState('all');
  const [custom, setCustom] = useState('');
  const [pair, setPair] = useState([]);
  const upV = (fn, extra = {}) => setMg((cur) => ({ villa: fn(cur.villa || {}), ...extra }));

  useEffect(() => { if (!mg.villa && players.length) setMg({ villa: V.initVilla(players) }); }, [!!mg.villa, players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Αυτόματη πρόοδος: ένα τετράγωνο ανά ώρα (εκτός ΣΤΟΠ). Η διοργανώτρια μπορεί πάντα να προχωρήσει χειροκίνητα.
  useEffect(() => {
    if (!v.auto || stopped) return undefined;
    const id = setInterval(() => {
      const due = V.scheduledSquare(v);
      if (due > (v.sq || 1)) goNext(true);
    }, 30000);
    return () => clearInterval(id);
  }, [v.auto, v.sq, v.startedAt, stopped]); // eslint-disable-line react-hooks/exhaustive-deps

  const square = V.squareAt(v.sq || 1);
  const cycle = V.cycleOf(v.sq || 1);
  const type = SQUARE_TYPES[square?.type] || SQUARE_TYPES.flow;
  const allowedFor = (pid, item) => blockedBy(mg, pid, textOf(item)).length === 0;
  const eligible = players.filter((p) => square && allowedFor(p.id, square));
  const target = who || v.card?.pid || '';

  function goNext(auto = false) {
    const nextNo = Math.min((v.sq || 1) + 1, V.lastSquare(v));
    if (nextNo === (v.sq || 1)) return;
    const next = V.squareAt(nextNo);
    const startsCycle = V.cycleOf(nextNo).from === nextNo;
    upV((cur) => {
      let out = V.advance(cur);
      if (startsCycle) out = V.pushAlert(out, { title: `ΚΥΚΛΟΣ ${V.cycleOf(nextNo).no}`, text: `${V.cycleOf(nextNo).title} — ξεκινά τώρα.` });
      if (next?.night) out = { ...V.pushAlert(out, { title: 'MIDNIGHT EVENT', text: 'Η νυχτερινή λειτουργία ενεργοποιήθηκε.' }), night: true };
      return out;
    });
    setWho('');
    log(`${auto ? '⏱' : '➡️'} Τετράγωνο #${nextNo}: ${next?.title || ''}`);
    sfx.click();
  }

  function resolve(outcome) {
    if (!target) return;
    const pts = V.pointsFor(square, outcome);
    if (pts) addScore(target, pts);
    upV((cur) => ({ ...cur, done: { ...(cur.done || {}), [cur.sq]: { pid: target, outcome, at: Date.now() } }, card: null }));
    log(`${outcome === 'win' ? '✅' : outcome === 'lose' ? '❌' : '⏭'} ${nameOf(target)} · #${v.sq} ${square?.title}${pts ? ` · ${pts > 0 ? '+' : ''}${pts}` : ' · PASS'}`);
    sfx[outcome === 'lose' ? 'fail' : 'ok']?.();
  }

  function drawCard(kind) {
    if (!target) return;
    const pool = VILLA_CARDS.filter((c) => kind === 'either' || c.kind === kind || c.kind === 'either');
    const card = pickAllowed(pool, mg, target);
    if (!card) { log(`⏭ Καμία κάρτα δεν ταιριάζει στα όρια της ${nameOf(target)} — PASS`); return; }
    upV((cur) => ({ ...cur, card: { ...card, pid: target, at: Date.now() } }));
    log(`🎴 ${nameOf(target)}: «${card.title}»`);
  }

  const sendAlert = (preset) => {
    const title = preset?.title || 'VILLA';
    const text = preset?.text || custom.trim();
    if (!text) return;
    upV((cur) => V.pushAlert(cur, { to: alertTo, title, text }));
    log(`🔔 Ειδοποίηση ${alertTo === 'all' ? 'σε όλες' : `στη ${nameOf(alertTo)}`}: ${title}`);
    setCustom('');
  };

  // Ενέργειες από τα κινητά: κωδικός, ψήφος, ώρες ησυχίας, απάντηση σε κάρτα.
  useEffect(() => {
    const action = mg.playerAction;
    if (!action || !mg.villa) return;
    const pid = action.playerId;
    if (action.type === 'villa_code') {
      const { villa, ok } = V.tryCode(mg.villa, pid, action.code);
      setMg({ villa, playerAction: null });
      log(ok ? `🔓 ${nameOf(pid)} έβαλε τον σωστό κωδικό!` : `🚨 ${nameOf(pid)}: λάθος κωδικός — Penalty Surge`);
      if (ok) { addScore(pid, 50); sfx.ok(); } else sfx.fail?.();
      return;
    }
    if (action.type === 'villa_vote' && mg.villa.vote?.open) {
      setMg({ villa: { ...mg.villa, vote: { ...mg.villa.vote, votes: { ...(mg.villa.vote.votes || {}), [pid]: action.target } } }, playerAction: null });
      return;
    }
    if (action.type === 'villa_quiet') {
      setMg({ villa: { ...mg.villa, quiet: { ...(mg.villa.quiet || {}), [pid]: action.value === true } }, playerAction: null });
      return;
    }
    if (action.type === 'villa_response' && mg.villa.card?.pid === pid) {
      log(action.value === 'pass' ? `⏭ ${nameOf(pid)} έκανε PASS στην κάρτα` : `✋ ${nameOf(pid)}: «Το έκανα» — περιμένει επιβεβαίωση`);
      setMg({ villa: { ...mg.villa, card: { ...mg.villa.card, response: action.value } }, playerAction: null });
      return;
    }
    setMg({ playerAction: null });
  }, [mg.playerAction?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  const ranking = useMemo(() => rankPlayers(players, mg), [players, mg.scores, mg.tokens]); // eslint-disable-line react-hooks/exhaustive-deps
  const heisters = players.filter((p) => !consentOf(mg, p.id).optOuts.includes('night'));
  const voteTally = useMemo(() => {
    const tally = {};
    Object.values(v.vote?.votes || {}).forEach((t) => { tally[t] = (tally[t] || 0) + 1; });
    return Object.entries(tally).sort((a, b) => b[1] - a[1]);
  }, [v.vote]);

  if (!mg.villa) return <Panel title="Η Villa ετοιμάζεται…" />;
  const PlayerSelect = ({ value, onChange, list = players, label = 'Παίκτρια' }) => (
    <select className="ui-input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">— {label} —</option>
      {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      <Panel title={`Κύκλος ${cycle.no} · ${cycle.title}`} accent="gold">
        <div className="text-sm opacity-75">{cycle.subtitle}</div>
        <div className="grid grid-cols-8 gap-1 sm:grid-cols-12" aria-label="Ταμπλό 48 τετραγώνων">
          {VILLA_SQUARES.filter((s) => s.no <= V.lastSquare(v)).map((s) => (
            <div key={s.no} title={s.title} className="flex h-7 items-center justify-center rounded-md text-[11px] font-semibold"
              style={{ background: s.no === v.sq ? '#E8C26B' : s.no < v.sq ? '#2C2C2E' : '#1C1C1E', color: s.no === v.sq ? '#000' : s.no < v.sq ? '#8E8E93' : '#fff', outline: s.clue !== undefined ? '1px solid #E8C26B66' : 'none' }}>
              {s.no}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Btn color="bg-amber-500" onClick={() => goNext(false)} disabled={(v.sq || 1) >= V.lastSquare(v)}>➡️ Επόμενο τετράγωνο</Btn>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!v.auto} onChange={(e) => upV((cur) => ({ ...cur, auto: e.target.checked }))} /> Αυτόματα 1 τετράγωνο / ώρα</label>
          {v.auto && <span className="opacity-60">Επόμενο: {new Date(V.nextUnlockAt(v)).toLocaleString('el-GR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
      </Panel>

      {square && (
        <Panel title={`#${square.no} · ${square.title}`}>
          <div className="inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${type.color}22`, color: type.color }}>{type.icon} {type.label}{square.double ? ' · διπλοί πόντοι' : ''}</div>
          <p className="text-[17px] leading-relaxed">{square.text}</p>
          {square.type === 'penalty' && <p className="rounded-xl bg-[#FF9F0A]/10 px-3 py-2 text-xs text-[#FFB340]">🛟 {VILLA_SAFETY}</p>}
          <div className="text-xs opacity-70">Επιτρέπεται για: {eligible.length ? eligible.map((p) => p.name).join(', ') : 'καμία (όλες το απέκλεισαν — PASS)'}</div>
          <div className="flex flex-wrap gap-2">
            <PlayerSelect value={target} onChange={setWho} list={eligible} label="Ποια παίζει" />
            <Btn onClick={() => eligible.length && setWho(pick(eligible).id)}>🎲 Τυχαία</Btn>
          </div>
          {square.draw && <div className="flex flex-wrap gap-2">
            {(square.draw === 'either' ? ['truth', 'dare'] : [square.draw]).map((k) => <Btn key={k} color="bg-rose-600" disabled={!target} onClick={() => drawCard(k)}>🎴 {k === 'truth' ? 'Αλήθεια 18+' : 'Θάρρος 18+'}</Btn>)}
          </div>}
          {v.card && <div className="rounded-2xl bg-[#2C2C2E] p-3"><div className="text-xs opacity-60">Κάρτα για {nameOf(v.card.pid)}{v.card.response ? ` · απάντηση: ${v.card.response === 'pass' ? 'PASS' : 'το έκανε'}` : ''}</div><div className="font-semibold">{v.card.title}</div><div className="text-sm opacity-85">{v.card.text}</div></div>}
          {square.clue !== undefined && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">🔑 Ένδειξη #{square.clue + 1} (ψηφίο <b>{v.code?.[square.clue]}</b>) στη νικήτρια:</span>
              <Btn color="bg-amber-500" disabled={!target} onClick={() => { upV((cur) => V.awardClue(cur, square.clue, target)); upV((cur) => V.pushAlert(cur, { to: target, title: 'VAULT CLUE', text: `Ξεκλείδωσες την ένδειξη #${square.clue + 1}. Δες την στο κινητό.` })); log(`🔑 Η ${nameOf(target)} πήρε την ένδειξη #${square.clue + 1}`); }}>Δώσε την ένδειξη</Btn>
            </div>
          )}
          {square.alliance && (
            <div className="flex flex-wrap items-center gap-2">
              <PlayerSelect value={pair[0] || ''} onChange={(x) => setPair([x, pair[1]])} label="Σύμμαχος 1" />
              <PlayerSelect value={pair[1] || ''} onChange={(x) => setPair([pair[0], x])} label="Σύμμαχος 2" />
              <Btn disabled={!pair[0] || !pair[1] || pair[0] === pair[1]} onClick={() => { upV((cur) => V.addAlliance(cur, pair)); log('🤝 Νέα μυστική συμμαχία'); setPair([]); }}>🤝 Κλείσε συμμαχία</Btn>
            </div>
          )}
          {square.vote && (
            <div className="space-y-2">
              {!v.vote?.open
                ? <Btn color="bg-amber-500" onClick={() => upV((cur) => V.pushAlert({ ...cur, vote: { id: Date.now(), q: square.title, open: true, votes: {} } }, { title: 'THE VILLA VOTE', text: 'Άνοιξε η ψηφοφορία στα κινητά.' }))}>🗳️ Άνοιγμα ψηφοφορίας στα κινητά</Btn>
                : <Btn onClick={() => { upV((cur) => ({ ...cur, vote: { ...cur.vote, open: false } })); if (voteTally[0]) { addScore(voteTally[0][0], 10); log(`🗳️ Νικήτρια ψηφοφορίας: ${nameOf(voteTally[0][0])} (+10)`); } }}>Κλείσιμο ψηφοφορίας ({Object.keys(v.vote.votes || {}).length}/{players.length})</Btn>}
              {voteTally.length > 0 && <div className="text-sm">{voteTally.map(([pid, n]) => `${nameOf(pid)} ${n}`).join(' · ')}</div>}
            </div>
          )}
          {square.heist && (
            <div className="space-y-2">
              <div className="text-xs opacity-70">Συμμετέχουν μόνο όσες δεν απέκλεισαν το Night Raid: {heisters.map((p) => p.name).join(', ') || 'καμία'}</div>
              <div className="flex flex-wrap gap-2">{heisters.map((p) => (
                <Btn key={p.id} onClick={() => { const n = v.roles?.[p.id] === 'phantom' ? 2 : 1; upV((cur) => ({ ...cur, socks: { ...(cur.socks || {}), [p.id]: ((cur.socks || {})[p.id] || 0) + n } })); addScore(p.id, SOCK_LOOT * n); log(`🧦 ${p.name} +${n} κάλτσα (+${SOCK_LOOT * n})`); }}>🧦 {p.name} · {(v.socks || {})[p.id] || 0}</Btn>
              ))}</div>
            </div>
          )}
          {square.finale && (
            <div className="space-y-1 text-sm">
              <div>Κωδικός: <b className="tracking-[0.3em]">{v.code}</b> · ενδείξεις που βρέθηκαν: {V.cluesFound(v)}/4</div>
              {(v.attempts || []).slice(0, 5).map((a) => <div key={a.at}>{a.ok ? '✅' : '❌'} {nameOf(a.pid)} · {new Date(a.at).toLocaleTimeString('el-GR')}</div>)}
              {v.winner && <div className="font-semibold text-[#E8C26B]">🔓 Ο κωδικός έσπασε από τη {nameOf(v.winner)}</div>}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Btn color="bg-emerald-600" disabled={!target} onClick={() => resolve('win')}>✅ Επιτυχία</Btn>
            <Btn color="bg-red-600" disabled={!target} onClick={() => resolve('lose')}>❌ Αποτυχία</Btn>
            <Btn disabled={!target} onClick={() => resolve('pass')}>⏭ PASS</Btn>
          </div>
        </Panel>
      )}

      <Panel title="🔔 Ειδοποιήσεις στα κινητά">
        <div className="flex flex-wrap gap-2"><PlayerSelect value={alertTo === 'all' ? '' : alertTo} onChange={(x) => setAlertTo(x || 'all')} label="Σε όλες" /></div>
        <div className="flex flex-wrap gap-2">{VILLA_ALERTS.map((a) => <Btn key={a.id} onClick={() => sendAlert(a)}>{a.title}</Btn>)}</div>
        <div className="flex gap-2"><input className="ui-input flex-1" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Δικό σου μήνυμα…" /><Btn color="bg-amber-500" disabled={!custom.trim()} onClick={() => sendAlert(null)}>Αποστολή</Btn></div>
        <div className="text-xs opacity-60">Σε ώρες ησυχίας: {players.filter((p) => v.quiet?.[p.id]).map((p) => p.name).join(', ') || 'καμία'} — δεν λαμβάνουν push.</div>
      </Panel>

      <MissionPanel ctx={ctx} pool={VILLA_MISSIONS} title="📲 Μυστικές αποστολές Villa" onSuccess={(_m, pid) => addScore(pid, 20)} onFail={(_m, pid) => addScore(pid, -5)} />

      <Panel title="🎭 Ρόλοι, συμμαχίες & ενδείξεις (μόνο εσύ τα βλέπεις)">
        <div className="space-y-1 text-sm">{players.map((p) => {
          const role = V.roleOf(v.roles?.[p.id]);
          return <div key={p.id} className="flex flex-wrap justify-between gap-2"><span>{p.name}</span><span className="opacity-75">{role ? `${role.icon} ${role.name}` : 'Villa Guest'} · 🔑 {(v.clues?.[p.id] || []).map((i) => i + 1).join(',') || '—'} · 🧦 {(v.socks || {})[p.id] || 0}</span></div>;
        })}</div>
        {(v.alliances || []).length > 0 && <div className="text-sm">🤝 {v.alliances.map((a) => a.members.map(nameOf).join(' + ')).join(' · ')}</div>}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => upV((cur) => ({ ...cur, night: !cur.night }))}>{v.night ? '☀️ Τέλος νύχτας' : '🌙 Night Mode'}</Btn>
          {!v.extended && (v.sq || 1) >= 40 && <Btn color="bg-amber-500" onClick={() => { if (!window.confirm('Η ομάδα αποφάσισε την επέκταση 72h «After Dark: The Final 24»;')) return; upV((cur) => V.pushAlert({ ...cur, extended: true }, { title: 'AFTER DARK', text: 'Ξεκλειδώθηκε η επέκταση: The Final 24.' })); updateState?.({ gameDurationMinutes: (Number(state.gameDurationMinutes) || 2880) + 1440 }); log('🌑 Ξεκλειδώθηκε το After Dark (72h)'); }}>🌑 Ξεκλείδωμα 72h</Btn>}
        </div>
      </Panel>

      <Panel title="👑 Κατάταξη & βραβεία">
        {ranking.map((p, i) => <div key={p.id} className="flex justify-between text-sm"><span>{i + 1}. {p.name}</span><span className="tabular-nums">{pointsOf(mg, p.id)}</span></div>)}
        <div className="grid gap-2 sm:grid-cols-2">{VILLA_AWARDS.map((award) => (
          <label key={award} className="flex items-center justify-between gap-2 text-sm"><span>{award}</span>
            <select className="ui-input max-w-[50%]" value={v.awards?.[award] || ''} onChange={(e) => upV((cur) => ({ ...cur, awards: { ...(cur.awards || {}), [award]: e.target.value }, ...(award === 'Queen of the Villa' ? { queen: e.target.value } : {}) }))}>
              <option value="">—</option>{players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        ))}</div>
        <Btn color="bg-amber-500" disabled={!v.queen} onClick={() => { upV((cur) => V.pushAlert(cur, { title: 'THE WINNER', text: `Queen of the Villa: ${nameOf(cur.queen)}` })); setMg({ villaQueen: v.queen }); log(`👑 Queen of the Villa: ${nameOf(v.queen)}`); onFinish(); }}>👑 Grand Finale — στέψη</Btn>
      </Panel>
    </div>
  );
}
