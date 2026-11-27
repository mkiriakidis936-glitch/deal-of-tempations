import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import MissionPanel from '@/components/modes/MissionPanel';
import { blockedBy, textOf, pickAllowed, consentOf } from '@/lib/consent';
import { sfx, pick } from '@/lib/modeKit';
import { pointsOf, rankPlayers } from '@/lib/modeRanking';
import {
  VILLA_MISSIONS, VILLA_ALERTS, VILLA_AWARDS, SQUARE_TYPES, VILLA_SAFETY, SOCK_LOOT, SLIP_POINTS, CODE_POINTS, STRIP_LATE_POINTS,
  VILLA_VERSIONS, VILLA_RINGS, STRIP_STEPS, STRIP_RULES, VILLA_ROYAL_COMMANDS, VILLA_TWISTS, VILLA_PUNISH_WHEEL, PUNISH_WHEEL_RULE,
  VILLA_MECHANICS, VILLA_SPECIAL_CARDS, COPS_GAME, VILLA_ALLIANCE_TYPES, VILLA_LOOT, VILLA_TV, VILLA_DAYS, VILLA_EXECUTION,
  VILLA_RESTRAINTS, VILLA_RULES, NAIL_COLORS, deckOf, deckCards, KIND_LABEL, ROYAL_COMMAND_MINUTES,
} from '@/data/modes/villaContent';
import * as V from '@/lib/villaEngine';

const VOTE_Q = { nail: 'Ποιο χρώμα νυχιών στα πόδια τραβάει περισσότερο την προσοχή;', sealed: 'Sealed Vote: η πιο τολμηρή, η πιο ύπουλη, η πιο προκλητική;', jury: 'Grand Jury: ποια είπε την αλήθεια;', card: 'Ψηφοφορία κάρτας' };

// VILLA TAKEOVER 48/72 — Tablet της διοργανώτριας (ακριβώς όπως το «VILLA LOCKDOWN 72H (UPDATE).pdf»).
export default function ActVilla({ ctx, updateState, onFinish }) {
  const { players, mg, setMg, log, addScore, nameOf, stopped } = ctx;
  const v = mg.villa || {};
  const [who, setWho] = useState('');
  const [alertTo, setAlertTo] = useState('all');
  const [custom, setCustom] = useState('');
  const [pair, setPair] = useState([]);
  const [allyType, setAllyType] = useState(VILLA_ALLIANCE_TYPES[0]);
  const [victim, setVictim] = useState('');
  const [cmdId, setCmdId] = useState(VILLA_ROYAL_COMMANDS[0].id);
  const [lootKind, setLootKind] = useState('intel');
  const [showGuide, setShowGuide] = useState(false);
  const upV = (fn, extra = {}) => setMg((cur) => ({ villa: fn(cur.villa || {}), ...extra }));

  function start(hours) {
    const now = Date.now();
    setMg({ villa: V.pushAlert(V.initVilla(players, { hours, now }), VILLA_TV.start), timer: { total: hours * 3600, endsAt: now + hours * 3600000, remaining: hours * 3600 } });
    updateState?.({ gameDurationMinutes: hours * 60 });
    log(`🏝️ Villa Takeover ${hours}h ξεκίνησε — οι μυστικοί ρόλοι μοιράστηκαν`);
    sfx.ok?.();
  }

  // Αυτόματη πρόοδος: ένα τετράγωνο ανά ώρα (εκτός ΣΤΟΠ). Η διοργανώτρια μπορεί πάντα να προχωρήσει χειροκίνητα.
  useEffect(() => {
    if (!mg.villa || !v.auto || stopped) return undefined;
    const id = setInterval(() => { if (V.scheduledSquare(v) > (v.sq || 1)) goNext(true); }, 30000);
    return () => clearInterval(id);
  }, [!!mg.villa, v.auto, v.sq, v.startedAt, stopped]);

  const no = v.sq || 1;
  const square = mg.villa ? V.squareAt(no, v) : null;
  const phase = mg.villa ? V.phaseOf(no, v) : null;
  const type = SQUARE_TYPES[square?.type] || SQUARE_TYPES.flow;
  const ring = VILLA_RINGS[square?.ring] || VILLA_RINGS.outer;
  const allowedFor = (pid, item) => blockedBy(mg, pid, textOf(item)).length === 0;
  const eligible = players.filter((p) => square && allowedFor(p.id, square));
  const target = who || v.card?.pid || '';
  const heisters = players.filter((p) => !consentOf(mg, p.id).optOuts.includes('night'));

  function goNext(auto = false) {
    if (no >= V.lastSquare(v)) return;
    const next = V.squareAt(no + 1, v);
    upV((cur) => V.advance(cur));
    setWho(''); setVictim('');
    log(`${auto ? '⏱' : '➡️'} Τετράγωνο #${no + 1}: ${next?.title || ''}`);
    sfx.click?.();
  }

  function resolve(outcome) {
    if (!target) return;
    const pts = V.pointsFor(square, outcome);
    if (pts) addScore(target, pts);
    upV((cur) => {
      let out = { ...cur, done: { ...(cur.done || {}), [cur.sq]: { pid: target, outcome, at: Date.now() } }, card: null };
      if (outcome === 'win' && square.type === 'penalty') out = V.addKarma(out, target, 1);
      return out;
    });
    log(`${outcome === 'win' ? '✅' : outcome === 'lose' ? '❌' : '⏭'} ${nameOf(target)} · #${no} ${square?.title}${pts ? ` · ${pts > 0 ? '+' : ''}${pts}` : ' · PASS'}`);
    sfx[outcome === 'lose' ? 'fail' : 'ok']?.();
  }

  function slip(pid) {
    addScore(pid, SLIP_POINTS);
    upV((cur) => V.addKarma(V.addSlip(cur, pid), pid, -1));
    log(`🫨 Slip: ${nameOf(pid)} (${SLIP_POINTS})`);
  }

  function drawCard(deckId) {
    if (!target) return;
    const deck = deckOf(deckId);
    const pool = deckCards(deckId).filter((c) => !c.only || c.only === V.hoursOf(v));
    const card = pickAllowed(pool, mg, target);
    if (!card) { log(`⏭ Καμία κάρτα «${deck.label}» δεν ταιριάζει στα όρια της ${nameOf(target)} — PASS`); return; }
    upV((cur) => ({ ...cur, card: { ...card, kind: deck.kind, deckLabel: deck.label, pid: target, at: Date.now() } }));
    log(`🎴 ${nameOf(target)}: ${deck.label} #${card.no} «${card.title}»`);
  }

  function showSpecial(id) {
    const card = VILLA_SPECIAL_CARDS.find((c) => c.id === id);
    if (!card) return;
    upV((cur) => V.pushAlert({ ...cur, card: { ...card, kind: 'command', deckLabel: 'Ειδική κάρτα', pid: target || '', at: Date.now() } }, { title: card.title.toUpperCase(), text: card.text }));
    if (card.mech === 'statue' || card.mech === 'alarm48') upV((cur) => V.startStatue(cur, card.secs || 30));
    log(`✨ ${card.title}`);
  }

  const sendAlert = (preset) => {
    const title = preset?.title || 'VILLA';
    const text = preset?.text || custom.trim();
    if (!text) return;
    upV((cur) => V.pushAlert(cur, { to: alertTo, title, text }));
    log(`🔔 Ειδοποίηση ${alertTo === 'all' ? 'σε όλες' : `στη ${nameOf(alertTo)}`}: ${title}`);
    setCustom('');
  };

  // Ενέργειες από τα κινητά: κωδικός, ψήφος, ώρες ησυχίας, απάντηση σε κάρτα, προφίλ ποδιών, δήλωση κλοπής.
  useEffect(() => {
    const action = mg.playerAction;
    if (!action || !mg.villa) return;
    const pid = action.playerId;
    const cur = mg.villa;
    if (action.type === 'villa_code') {
      const { villa, ok } = V.tryCode(cur, pid, action.code);
      setMg({ villa, playerAction: null });
      log(ok ? `🔓 LOCKDOWN OVERRIDE — ${nameOf(pid)} έσπασε τον κωδικό!` : `🚨 ALARM / PENALTY SURGE — λάθος κωδικός από ${nameOf(pid)}`);
      if (ok) { addScore(pid, CODE_POINTS); sfx.ok?.(); } else { addScore(pid, -10); sfx.fail?.(); }
      return;
    }
    if (action.type === 'villa_vote' && cur.vote?.open) {
      setMg({ villa: { ...cur, vote: { ...cur.vote, votes: { ...(cur.vote.votes || {}), [pid]: action.target } } }, playerAction: null });
      return;
    }
    if (action.type === 'villa_quiet') {
      setMg({ villa: { ...cur, quiet: { ...(cur.quiet || {}), [pid]: action.value === true } }, playerAction: null });
      return;
    }
    if (action.type === 'villa_profile') {
      const prev = cur.profile?.[pid] || {};
      const next = { ...prev, ...(NAIL_COLORS.includes(action.nail) ? { nail: action.nail } : {}), ...(Number.isInteger(action.footwear) ? { footwear: action.footwear } : {}) };
      setMg({ villa: { ...cur, profile: { ...(cur.profile || {}), [pid]: next } }, playerAction: null });
      return;
    }
    if (action.type === 'villa_heist' && cur.night && heisters.some((p) => p.id === pid) && heisters.some((p) => p.id === action.target) && action.target !== pid) {
      const { villa, n } = V.logHeist(cur, pid, action.target);
      setMg({ villa, playerAction: null });
      addScore(pid, SOCK_LOOT * n);
      log(`🧦 ${nameOf(pid)} δήλωσε κλοπή κάλτσας από ${nameOf(action.target)} (+${SOCK_LOOT * n})`);
      return;
    }
    if (action.type === 'villa_response' && cur.card?.pid === pid) {
      log(action.value === 'pass' ? `⏭ ${nameOf(pid)} έκανε PASS στην κάρτα` : `✋ ${nameOf(pid)}: «Το έκανα» — περιμένει επιβεβαίωση`);
      setMg({ villa: { ...cur, card: { ...cur.card, response: action.value } }, playerAction: null });
      return;
    }
    setMg({ playerAction: null });
  }, [mg.playerAction?.at]);

  const ranking = useMemo(() => rankPlayers(players, mg), [players, mg.scores, mg.tokens]);
  const voteTally = useMemo(() => {
    const tally = {};
    Object.values(v.vote?.votes || {}).forEach((t) => { tally[t] = (tally[t] || 0) + 1; });
    return Object.entries(tally).sort((a, b) => b[1] - a[1]);
  }, [v.vote]);

  const PlayerSelect = ({ value, onChange, list = players, label = 'Παίκτρια' }) => (
    <select className="ui-input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">— {label} —</option>
      {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );

  // ---------- Επιλογή έκδοσης ----------
  if (!mg.villa) {
    return (
      <Panel title="🏝️ Villa Takeover — διάλεξε έκδοση" accent="gold">
        <p className="text-sm opacity-80">Το ταμπλό έχει 1 τετράγωνο ανά ώρα. Οι μυστικοί ρόλοι μοιράζονται αυτόματα στα κινητά με την έναρξη.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[48, 72].map((h) => (
            <div key={h} className="space-y-2 rounded-2xl bg-[#2C2C2E] p-4">
              <div className="text-lg font-bold">{VILLA_VERSIONS[h].title}</div>
              <p className="text-sm opacity-80">{VILLA_VERSIONS[h].text}</p>
              <Btn color="bg-amber-500" disabled={!players.length || stopped} onClick={() => start(h)}>▶ Ξεκίνα {VILLA_VERSIONS[h].label}</Btn>
            </div>
          ))}
        </div>
      </Panel>
    );
  }

  const strip = V.stripInfo(v);
  const morning = square?.morning ? (v.morningSummary || V.morningReveal(v)) : null;
  const command = V.commandActive(v) ? v.command : null;
  const wheelCard = v.wheel ? VILLA_PUNISH_WHEEL.find((w) => w.id === v.wheel) : null;
  const twistCard = v.twist ? VILLA_TWISTS.find((t) => t.id === v.twist) : null;
  const mech = square?.mech ? VILLA_MECHANICS.find((m) => m.id === square.mech) : null;

  return (
    <div className="space-y-4">
      <Panel title={`Ημέρα ${phase.day} · ${phase.title}${phase.name ? ` (${phase.name})` : ''}`} accent="gold">
        <div className="text-sm opacity-75">{phase.zone} · {V.hoursOf(v)}ωρο{v.night ? ' · 🌙 Night Mode' : ''}</div>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-[#2C2C2E] p-2"><b>Βασική ροή:</b> {phase.flow}</div>
          <div className="rounded-xl bg-[#2C2C2E] p-2"><b>Δεσίματα & πέλματα:</b> {phase.restraints}</div>
          <div className="rounded-xl bg-[#2C2C2E] p-2"><b>Ειδοποιήσεις & κωδικός:</b> {phase.alerts}</div>
        </div>
        <div className="grid grid-cols-8 gap-1 sm:grid-cols-12" aria-label={`Ταμπλό ${V.lastSquare(v)} τετραγώνων`}>
          {V.boardOf(v).map((s) => (
            <div key={s.no} title={`#${s.no} ${s.title}`} className="flex h-7 items-center justify-center rounded-md text-[11px] font-semibold"
              style={{ background: s.no === no ? '#E8C26B' : s.no < no ? '#2C2C2E' : `${VILLA_RINGS[s.ring].color}33`, color: s.no === no ? '#000' : s.no < no ? '#8E8E93' : '#fff', outline: s.clue !== undefined ? '1px solid #E8C26B' : 'none' }}>
              {s.no}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Btn color="bg-amber-500" onClick={() => goNext(false)} disabled={no >= V.lastSquare(v) || stopped}>➡️ Επόμενο τετράγωνο</Btn>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!v.auto} onChange={(e) => upV((cur) => ({ ...cur, auto: e.target.checked }))} /> Αυτόματα 1 τετράγωνο / ώρα</label>
          {v.auto && no < V.lastSquare(v) && <span className="opacity-60">Επόμενο: {new Date(V.nextUnlockAt(v)).toLocaleString('el-GR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          <Btn onClick={() => setShowGuide((x) => !x)}>📖 Οδηγός εκτέλεσης</Btn>
        </div>
        {showGuide && (
          <div className="space-y-2 text-sm">
            <div className="font-semibold">{VILLA_DAYS[phase.day].title}</div><p className="opacity-80">{VILLA_DAYS[phase.day].text}</p>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="opacity-60"><th>Δοκιμασία</th><th>Χρόνος</th><th>Κύριο στοιχείο</th><th>Αποτυχία / Ποινή</th></tr></thead>
              <tbody>{VILLA_EXECUTION.map((r) => <tr key={r.name} className="border-t border-white/10"><td className="py-1 pr-2 font-semibold">{r.name}</td><td className="pr-2">{r.time}</td><td className="pr-2">{r.core}</td><td>{r.fail}</td></tr>)}</tbody></table></div>
            {VILLA_RESTRAINTS.map((r) => <div key={r.name}><b>{r.name}:</b> <span className="opacity-80">{r.text}</span></div>)}
            {VILLA_RULES.map((r, i) => <div key={r.title}><b>{i + 1}. {r.title}:</b> <span className="opacity-80">{r.text}</span></div>)}
          </div>
        )}
      </Panel>

      <Panel title={`👟 4-Step Round Strip · γύρος ${v.strip || 0}/4`}>
        <div className="grid grid-cols-4 gap-2">{STRIP_STEPS.map((s) => (
          <div key={s.step} className="rounded-xl p-2 text-center text-xs" style={{ background: (v.strip || 0) >= s.step ? '#E8C26B' : '#2C2C2E', color: (v.strip || 0) >= s.step ? '#000' : '#fff' }}>
            <div className="font-bold">{s.step}ος · {s.item}</div><div className="opacity-75">{s.state}</div>
          </div>
        ))}</div>
        {strip && <p className="text-sm opacity-85">{strip.rule}</p>}
        <div className="flex flex-wrap gap-2">
          <Btn color="bg-amber-500" disabled={(v.strip || 0) >= 4 || stopped} onClick={() => { const nextStep = (v.strip || 0) + 1; upV((cur) => V.setStrip(cur, nextStep)); log(`👟 Round Strip ${nextStep}/4 — ${STRIP_STEPS[nextStep - 1].item}`); }}>
            {(v.strip || 0) >= 4 ? '✓ Πλήρες Barefoot' : `▶ Γύρος ${(v.strip || 0) + 1}: ${STRIP_STEPS[v.strip || 0].item}`}
          </Btn>
        </div>
        {(v.strip || 0) > 0 && (
          <div className="flex flex-wrap gap-2 text-sm"><span className="opacity-70">Άργησε / αρνήθηκε (Karma Drop {STRIP_LATE_POINTS}):</span>
            {players.map((p) => <Btn key={p.id} disabled={!!v.stripLate?.[p.id]} onClick={() => { addScore(p.id, STRIP_LATE_POINTS); upV((cur) => ({ ...V.addKarma(cur, p.id, -1), stripLate: { ...(cur.stripLate || {}), [p.id]: true } })); log(`⏰ ${p.name}: καθυστέρηση στο Round Strip (${STRIP_LATE_POINTS})`); }}>{p.name}</Btn>)}
          </div>
        )}
        <details className="text-xs opacity-75"><summary>Κανόνες Round Strip</summary>{STRIP_RULES.map((r) => <div key={r}>• {r}</div>)}</details>
      </Panel>

      {square && (
        <Panel title={`#${square.no} · ${square.title}`}>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${type.color}22`, color: type.color }}>{type.icon} {type.label}</span>
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${ring.color}22`, color: ring.color }}>{ring.title} · {ring.subtitle}</span>
          </div>
          <p className="text-[17px] leading-relaxed">{square.text}</p>
          {mech && <div className="rounded-xl bg-[#2C2C2E] p-3 text-sm"><div className="font-semibold">{mech.icon} {mech.title}</div><div className="opacity-85">{mech.text}</div><div className="mt-1 text-xs opacity-60">Παράδειγμα: {mech.example}</div></div>}
          {square.needsStrip && (v.strip || 0) < square.needsStrip && <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">🔒 Ξεκλειδώνει μετά τον 4ο γύρο Round Strip — τώρα είστε στον {v.strip || 0}ο.</p>}
          {square.type === 'penalty' && <p className="rounded-xl bg-[#FF9F0A]/10 px-3 py-2 text-xs text-[#FFB340]">🛟 {VILLA_SAFETY}</p>}
          <div className="text-xs opacity-70">Επιτρέπεται για: {eligible.length ? eligible.map((p) => p.name).join(', ') : 'καμία (όλες το απέκλεισαν — PASS)'}</div>
          <div className="flex flex-wrap gap-2">
            <PlayerSelect value={target} onChange={setWho} list={eligible} label="Ποια παίζει" />
            <Btn onClick={() => eligible.length && setWho(pick(eligible).id)}>🎲 Τυχαία</Btn>
          </div>

          {square.action === 'start' && <Btn color="bg-amber-500" onClick={() => { upV((cur) => V.pushAlert(cur, { title: 'SILENT PING', text: 'Γνωριμία: κοίτα τον μυστικό σου ρόλο στο κινητό και βρες την πρώτη σου σύμμαχο.' })); log('📲 Silent Ping γνωριμίας'); }}>📲 Silent Ping γνωριμίας σε όλες</Btn>}
          {(square.action === 'strip' || square.action === 'finalStrip') && (
            <Btn color="bg-amber-500" disabled={square.action === 'strip' ? (v.strip || 0) >= square.step : false} onClick={() => {
              if (square.action === 'strip') { upV((cur) => V.setStrip(cur, square.step)); log(`👟 Round Strip ${square.step}/4`); }
              else { upV((cur) => V.pushAlert(V.setStrip(cur, 4), { title: 'FINAL ROUND STRIP', text: 'Τελικό Round Strip για όλους — ξεκινά η Τελική Αναμέτρηση.' })); log('👟 Final Round Strip'); }
            }}>👟 {square.action === 'strip' ? `Εντολή οθόνης: ${STRIP_STEPS[square.step - 1].item}` : 'Final Round Strip'}</Btn>
          )}
          {square.decks && <div className="flex flex-wrap gap-2">{square.decks.map((d) => <Btn key={d} color="bg-rose-600" disabled={!target} onClick={() => drawCard(d)}>{deckOf(d).icon} {deckOf(d).label}</Btn>)}</div>}
          {square.special && <Btn color="bg-rose-600" onClick={() => showSpecial(square.special)}>✨ Δείξε την κάρτα στην TV</Btn>}
          {square.mech && <Btn color="bg-rose-600" onClick={() => showSpecial(VILLA_SPECIAL_CARDS.find((c) => c.mech === square.mech)?.id)}>✨ Κάρτα «{mech?.title}» στην TV</Btn>}
          {v.card && (
            <div className="rounded-2xl bg-[#2C2C2E] p-3">
              <div className="text-xs opacity-60">{v.card.deckLabel || KIND_LABEL[v.card.kind]}{v.card.pid ? ` · για ${nameOf(v.card.pid)}` : ''}{v.card.response ? ` · απάντηση: ${v.card.response === 'pass' ? 'PASS' : 'το έκανε'}` : ''}{v.card.secs ? ` · ⏱ ${v.card.secs}″` : ''}</div>
              <div className="font-semibold">{v.card.no ? `#${v.card.no} — ` : ''}{v.card.title}</div><div className="text-sm opacity-85">{v.card.text}</div>
              {v.card.vote && <Btn onClick={() => upV((cur) => V.pushAlert({ ...cur, vote: { id: Date.now(), q: cur.card.title, open: true, votes: {} } }, { title: 'SEALED VOTE', text: 'Άνοιξε ψηφοφορία στα κινητά.' }))}>🗳️ Ψηφοφορία της κάρτας</Btn>}
            </div>
          )}
          {square.slip && <div className="flex flex-wrap gap-2 text-sm"><span className="opacity-70">Slip ({SLIP_POINTS}):</span>{players.map((p) => <Btn key={p.id} onClick={() => slip(p.id)}>🫨 {p.name} · {v.slips?.[p.id] || 0}</Btn>)}</div>}

          {square.clue !== undefined && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">🔑 Ένδειξη #{square.clue + 1} (ψηφίο <b>{v.code?.[square.clue]}</b>) στη νικήτρια:</span>
              <Btn color="bg-amber-500" disabled={!target} onClick={() => { upV((cur) => V.pushAlert(V.awardClue(cur, square.clue, target), { to: target, title: 'VAULT CLUE', text: `Ξεκλείδωσες την ένδειξη #${square.clue + 1}. Δες την στο κινητό.` })); log(`🔑 Η ${nameOf(target)} πήρε την ένδειξη #${square.clue + 1}`); }}>Δώσε την ένδειξη</Btn>
            </div>
          )}
          {square.alliance && (
            <div className="flex flex-wrap items-center gap-2">
              <PlayerSelect value={pair[0] || ''} onChange={(x) => setPair([x, pair[1]])} label="Σύμμαχος 1" />
              <PlayerSelect value={pair[1] || ''} onChange={(x) => setPair([pair[0], x])} label="Σύμμαχος 2" />
              <select className="ui-input" value={allyType} onChange={(e) => setAllyType(e.target.value)} aria-label="Είδος συμμαχίας">{VILLA_ALLIANCE_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <Btn disabled={!pair[0] || !pair[1] || pair[0] === pair[1]} onClick={() => { upV((cur) => V.addAlliance(cur, pair, Date.now(), allyType)); log(`🤝 Νέα μυστική συμμαχία: ${allyType}`); setPair([]); }}>🤝 Κλείσε συμμαχία</Btn>
            </div>
          )}
          {square.shift && (v.alliances || []).filter((a) => !a.broken).length > 0 && (
            <div className="space-y-1 text-sm"><div className="opacity-70">Alliance Shift — σπάσιμο συμμαχίας:</div>
              {(v.alliances || []).filter((a) => !a.broken).map((a) => <div key={a.id} className="flex flex-wrap items-center gap-2"><span>{a.type || 'Συμμαχία'}: {a.members.map(nameOf).join(' + ')}</span><Btn onClick={() => { upV((cur) => V.pushAlert(V.breakAlliance(cur, a.id, target), { title: 'ΠΡΟΔΟΣΙΑ', text: 'Μια συμμαχία έσπασε. Ο προδότης κερδίζει πλεονέκτημα και ο πρώην σύμμαχος δέχεται το τίμημα.' })); log('💔 Συμμαχία έσπασε'); }}>💔 Σπάσιμο</Btn></div>)}
            </div>
          )}
          {square.vote && (
            <div className="space-y-2">
              {!v.vote?.open
                ? <Btn color="bg-amber-500" onClick={() => upV((cur) => V.pushAlert({ ...cur, vote: { id: Date.now(), q: VOTE_Q[square.vote] || square.title, kind: square.vote, open: true, votes: {} } }, { title: square.vote === 'nail' ? 'NAIL COLOR VOTE' : 'SEALED VOTE', text: 'Άνοιξε η ψηφοφορία στα κινητά.' }))}>🗳️ Άνοιγμα ψηφοφορίας στα κινητά</Btn>
                : <Btn onClick={() => { upV((cur) => ({ ...cur, vote: { ...cur.vote, open: false } })); if (voteTally[0]) { addScore(voteTally[0][0], 10); log(`🗳️ Νικήτρια ψηφοφορίας: ${nameOf(voteTally[0][0])} (+10)`); } }}>Κλείσιμο ψηφοφορίας ({Object.keys(v.vote.votes || {}).length}/{players.length})</Btn>}
              {voteTally.length > 0 && <div className="text-sm">{voteTally.map(([pid, n]) => `${nameOf(pid)} ${n}`).join(' · ')}</div>}
            </div>
          )}
          {square.ping && (
            <div className="flex flex-wrap gap-2">
              <Btn disabled={!target} onClick={() => { const preset = { silent: VILLA_ALERTS[1], duel: VILLA_ALERTS[2], decoy: VILLA_ALERTS[3] }[square.ping]; upV((cur) => V.pushAlert(cur, { to: target, title: preset.title, text: preset.text })); log(`📲 ${preset.title} → ${nameOf(target)}`); }}>📲 Στείλε στην επιλεγμένη</Btn>
            </div>
          )}
          {square.royal && (
            <div className="flex flex-wrap items-center gap-2">
              <select className="ui-input" value={cmdId} onChange={(e) => setCmdId(e.target.value)} aria-label="Διαταγή">{VILLA_ROYAL_COMMANDS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
              <Btn color="bg-red-600" onClick={() => { const commander = target || pick(players)?.id; if (!commander) return; const c = VILLA_ROYAL_COMMANDS.find((x) => x.id === cmdId); upV((cur) => V.startCommand(cur, commander, c, Date.now(), ROYAL_COMMAND_MINUTES)); log(`👑 Απόλυτη Διαταγή: ${nameOf(commander)} Διοικητής (${c.title})`); }}>🟥 Κόκκινη οθόνη «ΑΠΟΛΥΤΗ ΔΙΑΤΑΓΗ»</Btn>
              <div className="flex flex-wrap gap-2">{['cmdSubmit', 'cmdSole', 'cmdChain', 'cmdPublic'].map((k) => <Btn key={k} onClick={() => upV((cur) => V.pushAlert(cur, VILLA_TV[k]))}>{VILLA_TV[k].title}</Btn>)}</div>
            </div>
          )}
          {command && <div className="rounded-xl bg-red-600/20 p-2 text-sm">🟥 Διοικητής: <b>{nameOf(command.pid)}</b> · {command.title} · λήγει {new Date(command.until).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</div>}
          {square.statue && <Btn color="bg-red-600" onClick={() => { upV((cur) => V.startStatue(cur, 30)); log('🗿 Σήμα Αγάλματος (30″)'); }}>🗿 ΑΓΑΛΜΑ σε κινητά & TV (30″)</Btn>}
          {square.wheel && (
            <div className="space-y-2"><Btn color="bg-red-600" onClick={() => { const w = pick(VILLA_PUNISH_WHEEL); upV((cur) => V.pushAlert({ ...cur, wheel: w.id }, { title: 'ΤΡΟΧΟΣ ΤΙΜΩΡΙΑΣ', text: `${w.title}: ${w.text}` })); log(`🎡 Τροχός Τιμωρίας: ${w.title}`); }}>🎡 Γύρνα τον Τροχό Τιμωρίας</Btn>
              <div className="text-xs opacity-70">{PUNISH_WHEEL_RULE}</div>
              {wheelCard && <div className="rounded-xl bg-[#2C2C2E] p-2 text-sm"><b>{wheelCard.title}</b> — {wheelCard.text}</div>}
            </div>
          )}
          {square.twist && (
            <div className="space-y-2"><Btn color="bg-violet-600" onClick={() => {
              const t = pick(VILLA_TWISTS);
              upV((cur) => {
                let out = V.pushAlert({ ...cur, twist: t.id }, { title: 'ΑΝΑΤΡΟΠΗ', text: t.tv });
                if (t.judas) { const judas = pick(players)?.id; if (judas) out = V.pushAlert(out, { to: judas, title: 'JUDAS PING', text: 'Κρυφή εντολή: «πούλησε» τη σύμμαχό σου. Αν τη βάλεις κρυφά σε δοκιμασία Hogtie ή γαργάλημα, κλέβεις όλους τους πόντους της.' }); }
                if (t.sockBomb) out = { ...out, sockBomb: pick(players)?.id || null };
                return out;
              });
              log(`🌀 Ανατροπή: ${t.title}`);
            }}>🌀 Τυχαία ανατροπή</Btn>
              {twistCard && <div className="rounded-xl bg-[#2C2C2E] p-2 text-sm"><b>{twistCard.title}</b> — {twistCard.text}</div>}
              {v.sockBomb && <div className="text-xs opacity-70">💣 Μαρκαρισμένη κάλτσα: της {nameOf(v.sockBomb)} (μόνο εσύ το βλέπεις)</div>}
            </div>
          )}
          {square.cops && (
            <div className="space-y-2">
              {!v.cops ? <Btn color="bg-red-600" onClick={() => { upV((cur) => V.startCops(cur, players)); log('🚨 Κλέφτρες & Αστυνομικίνες ξεκίνησε'); }}>🚨 Συναγερμός Επιχείρησης (2 Αστυνομικίνες)</Btn> : (
                <div className="space-y-2 text-sm">
                  <div>👮‍♀️ {v.cops.cops.map(nameOf).join(', ')} · 🦹‍♀️ {v.cops.thieves.map(nameOf).join(', ')}</div>
                  <div className="rounded-xl bg-[#2C2C2E] p-2"><b>Φάση {v.cops.phase + 1}/5 — {COPS_GAME.phases[v.cops.phase].title}:</b> {COPS_GAME.phases[v.cops.phase].text}</div>
                  <div className="flex flex-wrap gap-2">
                    {v.cops.phase < 4 && <Btn onClick={() => upV((cur) => ({ ...cur, cops: { ...cur.cops, phase: cur.cops.phase + 1 } }))}>➡️ Επόμενη φάση</Btn>}
                    {v.cops.thieves.map((id) => <Btn key={id} disabled={v.cops.caught.includes(id)} onClick={() => { upV((cur) => ({ ...cur, cops: { ...cur.cops, caught: [...cur.cops.caught, id] } })); v.cops.cops.forEach((c) => addScore(c, 10)); log(`🚔 Σύλληψη: ${nameOf(id)}`); }}>🚔 {nameOf(id)}</Btn>)}
                    <Btn onClick={() => { upV((cur) => ({ ...cur, cops: null })); log('✓ Τέλος Κλέφτρες & Αστυνομικίνες'); }}>✓ Τέλος</Btn>
                  </div>
                </div>
              )}
            </div>
          )}
          {square.heist && (
            <div className="space-y-2">
              <Btn color="bg-violet-600" onClick={() => { upV((cur) => V.pushAlert({ ...cur, night: true }, VILLA_TV.raid)); log('🌙 Night Raid Alert'); }}>🌙 Night Raid Alert (10–20′)</Btn>
              <div className="text-xs opacity-70">Μόνο όσες δεν απέκλεισαν το Night Raid: {heisters.map((p) => p.name).join(', ') || 'καμία'}. Οι παίκτριες δηλώνουν την κλοπή και από το κινητό.</div>
              <div className="flex flex-wrap gap-2">
                <PlayerSelect value={target} onChange={setWho} list={heisters} label="Ποια έκλεψε" />
                <PlayerSelect value={victim} onChange={setVictim} list={heisters.filter((p) => p.id !== target)} label="Από ποια" />
                <Btn disabled={!target || !victim} onClick={() => { const { villa, n } = V.logHeist(v, target, victim); setMg({ villa }); addScore(target, SOCK_LOOT * n); log(`🧦 ${nameOf(target)} ← κάλτσα της ${nameOf(victim)} (+${SOCK_LOOT * n})`); setVictim(''); }}>🧦 Καταγραφή</Btn>
              </div>
              {(v.heistLog || []).filter((h) => h.night === (v.nights || 1)).slice(0, 8).map((h) => <div key={h.at} className="text-xs opacity-80">🧦 {nameOf(h.thief)} ← {nameOf(h.victim)}{h.n > 1 ? ' ×2' : ''}</div>)}
            </div>
          )}
          {morning && (
            <div className="rounded-xl bg-[#2C2C2E] p-2 text-sm">☀️ Χωρίς κάλτσες: {morning.victims.map(nameOf).join(', ') || 'καμία'} · Περισσότερα Sock Loot: {morning.top ? nameOf(morning.top) : '—'} ({morning.total} κάλτσες)</div>
          )}
          {square.blackmail && (
            <div className="flex flex-wrap items-center gap-2">
              <PlayerSelect value={target} onChange={setWho} label="Παίκτρια" />
              <select className="ui-input" value={lootKind} onChange={(e) => setLootKind(e.target.value)} aria-label="Loot">{VILLA_LOOT.map((l) => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}</select>
              <Btn disabled={!target} onClick={() => { upV((cur) => V.addLoot(cur, target, lootKind, 1)); log(`💼 +1 ${lootKind} στη ${nameOf(target)}`); }}>+1</Btn>
              <Btn disabled={!target} onClick={() => { upV((cur) => V.addLoot(cur, target, lootKind, -1)); log(`💼 −1 ${lootKind} από ${nameOf(target)}`); }}>−1</Btn>
            </div>
          )}
          {square.finale === 'code' && (
            <div className="space-y-1 text-sm">
              <div>Κωδικός: <b className="tracking-[0.3em]">{v.code}</b> · ενδείξεις που βρέθηκαν: {V.cluesFound(v)}/4</div>
              {(v.attempts || []).slice(0, 6).map((a) => <div key={a.at}>{a.ok ? '✅' : '❌'} {nameOf(a.pid)} · {new Date(a.at).toLocaleTimeString('el-GR')}</div>)}
              {v.winner && <div className="font-semibold text-[#E8C26B]">🔓 Lockdown Override από τη {nameOf(v.winner)}</div>}
            </div>
          )}
          {square.finale === 'reveal' && <Btn color="bg-amber-500" disabled={v.revealed} onClick={() => { upV((cur) => V.pushAlert({ ...cur, revealed: true }, { title: 'ΜΕΓΑΛΗ ΑΠΟΚΑΛΥΨΗ', text: 'Οι μυστικοί ρόλοι και οι συμμαχίες αποκαλύπτονται στην TV.' })); log('🎭 Μεγάλη Αποκάλυψη ρόλων & συμμαχιών'); }}>🎭 Αποκάλυψη ρόλων & συμμαχιών στην TV</Btn>}

          <div className="grid grid-cols-3 gap-2">
            <Btn color="bg-emerald-600" disabled={!target} onClick={() => resolve('win')}>✅ Επιτυχία</Btn>
            <Btn color="bg-red-600" disabled={!target} onClick={() => resolve('lose')}>❌ Αποτυχία</Btn>
            <Btn disabled={!target} onClick={() => resolve('pass')}>⏭ PASS</Btn>
          </div>
        </Panel>
      )}

      <Panel title="🎴 Όλες οι τράπουλες του PDF (εκτός σειράς)">
        <div className="flex flex-wrap gap-2">
          <PlayerSelect value={target} onChange={setWho} label="Για ποια" />
          {['int', 'truth', 'teaseq', 'flirt', 'dare', 'nail', 'cmd', 'pun', 'hunt', 'blind', 'night'].map((d) => <Btn key={d} disabled={!target} onClick={() => drawCard(d)}>{deckOf(d).icon} {deckOf(d).label}</Btn>)}
        </div>
        <div className="flex flex-wrap gap-2">{VILLA_SPECIAL_CARDS.filter((c) => !c.only || c.only === V.hoursOf(v)).map((c) => <Btn key={c.id} onClick={() => showSpecial(c.id)}>✨ {c.title}</Btn>)}</div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => { upV((cur) => V.startStatue(cur, 30)); log('🗿 Σήμα Αγάλματος'); }}>🗿 Άγαλμα</Btn>
          <Btn onClick={() => { const w = pick(VILLA_PUNISH_WHEEL); upV((cur) => V.pushAlert({ ...cur, wheel: w.id }, { title: 'ΤΡΟΧΟΣ ΤΙΜΩΡΙΑΣ', text: `${w.title}: ${w.text}` })); log(`🎡 ${w.title}`); }}>🎡 Τροχός Τιμωρίας</Btn>
          <Btn onClick={() => upV((cur) => V.pushAlert(cur, VILLA_TV.punishFull))}>⛓️ Μήνυμα τιμωρίας</Btn>
          <Btn onClick={() => upV((cur) => V.pushAlert(cur, VILLA_TV.chain))}>🔗 Αλυσιδωτή τιμωρία</Btn>
        </div>
      </Panel>

      <Panel title="🔔 Ειδοποιήσεις στα κινητά">
        <div className="flex flex-wrap gap-2"><PlayerSelect value={alertTo === 'all' ? '' : alertTo} onChange={(x) => setAlertTo(x || 'all')} label="Σε όλες" /></div>
        <div className="flex flex-wrap gap-2">{VILLA_ALERTS.map((a) => <Btn key={a.id} onClick={() => sendAlert(a)}>{a.title}</Btn>)}</div>
        <div className="flex gap-2"><input className="ui-input flex-1" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Δικό σου μήνυμα…" /><Btn color="bg-amber-500" disabled={!custom.trim()} onClick={() => sendAlert(null)}>Αποστολή</Btn></div>
        <div className="text-xs opacity-60">Σε ώρες ησυχίας: {players.filter((p) => v.quiet?.[p.id]).map((p) => p.name).join(', ') || 'καμία'} — δεν λαμβάνουν push.</div>
      </Panel>

      <MissionPanel ctx={ctx} pool={VILLA_MISSIONS} title="📲 Μυστικές αποστολές Villa" onSuccess={(_m, pid) => addScore(pid, 20)} onFail={(_m, pid) => addScore(pid, -5)} />

      <Panel title="🎭 Ρόλοι, συμμαχίες, Loot & Karma (μόνο εσύ τα βλέπεις)">
        <div className="space-y-1 text-sm">{players.map((p) => {
          const role = V.roleOf(v.roles?.[p.id]);
          const loot = V.lootOf(v, p.id);
          const prof = v.profile?.[p.id] || {};
          return <div key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-1"><span>{p.name}{prof.nail ? ` · 💅 ${prof.nail}` : ''}</span><span className="opacity-75">{role ? `${role.icon} ${role.name}` : 'Villa Guest'} · 🔑 {(v.clues?.[p.id] || []).map((i) => i + 1).join(',') || '—'} · 🧦 {loot.sock} · 🧩 {loot.intel} · 🛡️ {loot.veto} · 💼 {loot.blackmail} · Karma {v.karma?.[p.id] || 0} · Slip {v.slips?.[p.id] || 0}</span></div>;
        })}</div>
        {(v.alliances || []).length > 0 && <div className="text-sm">🤝 {v.alliances.map((a) => `${a.broken ? '💔 ' : ''}${a.type ? `${a.type}: ` : ''}${a.members.map(nameOf).join(' + ')}`).join(' · ')}</div>}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => upV((cur) => V.pushAlert({ ...cur, night: !cur.night, nights: cur.night ? cur.nights : (cur.nights || 0) + 1 }, cur.night ? VILLA_TV.morning : VILLA_TV.night))}>{v.night ? '☀️ Ξημέρωσε (πρωινός απολογισμός)' : '🌙 Night Mode'}</Btn>
        </div>
      </Panel>

      <Panel title="👑 Κατάταξη & τελικά βραβεία">
        {ranking.map((p, i) => <div key={p.id} className="flex justify-between text-sm"><span>{i + 1}. {p.name}</span><span className="tabular-nums">{pointsOf(mg, p.id)}</span></div>)}
        <div className="grid gap-2 sm:grid-cols-2">{VILLA_AWARDS.map((award, i) => (
          <label key={award} className="flex items-center justify-between gap-2 text-sm"><span>{award}</span>
            <select className="ui-input max-w-[50%]" value={v.awards?.[award] || ''} onChange={(e) => upV((cur) => ({ ...cur, awards: { ...(cur.awards || {}), [award]: e.target.value }, ...(i === 0 ? { queen: e.target.value } : {}) }))}>
              <option value="">—</option>{players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        ))}</div>
        <Btn color="bg-amber-500" disabled={!v.queen} onClick={() => { upV((cur) => V.pushAlert({ ...cur, revealed: true }, { title: 'Η ΜΕΓΑΛΗ ΝΙΚΗΤΡΙΑ', text: `Queen of the Villa: ${nameOf(cur.queen)}` })); setMg({ villaQueen: v.queen }); log(`👑 Queen of the Villa: ${nameOf(v.queen)}`); onFinish(); }}>👑 Απονομή & κλείσιμο</Btn>
      </Panel>
    </div>
  );
}
