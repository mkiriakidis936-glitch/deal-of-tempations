import React, { useEffect, useMemo, useState } from 'react';
import { movieGuideStep } from '@/lib/movieGuide';
import { botAction, makeBots, hasBots } from '@/lib/rehearsalBots';
import ReadinessCheck from '@/components/tablet/ReadinessCheck';
import { autopilotPlan, autopilotDueAt } from '@/lib/movieAutopilot';
import { fullAutoStep, isFullAutoAllowed } from '@/lib/movieFullAuto';
import { Panel, Btn } from '@/components/modes/ModeShell';
import MissionPanel from '@/components/modes/MissionPanel';
import WorldMap from '@/components/modes/WorldMap';
import MovieGamesTablet, { MandatoryPanel } from '@/components/modes/MovieGamesTablet';
import * as G from '@/lib/movieGamesEngine';
import * as BD from '@/lib/movieBoardEngine';
import MovieBoardTablet from '@/components/modes/MovieBoardTablet';
import { squareOf } from '@/data/modes/movieBoard';
import { firstArt, contArt, trialArt } from '@/lib/movieArt';
import { PlayerAvatar, WantedStars, colorOf, onAirLabel } from '@/components/modes/MovieGameUI';
import { blockedBy, textOf, consentOf } from '@/lib/consent';
import { sfx } from '@/lib/modeKit';
import * as E from '@/lib/campaignEngine';
import {
  CONTINENTS, FORMATS, STATUS_LABEL, TRIALS, MOVIE_CARDS, PHASES, MOVIE_MISSIONS, NAIL_COLORS, WANTED_LEVELS, TOKEN_USES,
  STATE_LABELS, VALUE_LABELS, MOVIE_TV, MOVIE_SAFETY, continentOf, trialOf, cardOf,
} from '@/data/modes/campaignContent';

// 10.5.0: μπροστά μόνο ό,τι χρησιμοποιείται σε κάθε βραδιά· τα υπόλοιπα στο «⋯ Περισσότερα» (δεν σβήστηκε τίποτα).
const SCREENS = [
  { id: 8, icon: '🎲', label: 'Ταμπλό & Ζάρι' },
  { id: 1, icon: '🗺️', label: 'Πράξεις & ΣΤΟΠ' },
  { id: 7, icon: '🎡', label: 'Τροχοί, Deal & Παιχνίδια' },
  { id: 2, icon: '🎰', label: 'Κλήρωση & Νύχια' },
  { id: 5, icon: '👑', label: 'Πόντοι & Κατάταξη' },
  { id: 3, icon: '⛓️', label: 'Δράση, Χοροί & Δεσίματα', more: true },
  { id: 4, icon: '🌙', label: 'Βράδυ στον Ύπνο', more: true },
  { id: 6, icon: '🗄️', label: 'Admin, Backup & Αρχείο', more: true },
];
const STATE_OPTIONS = {
  shoeL: ['on', 'off'], shoeR: ['on', 'off'], sockL: ['on', 'off', 'sleep'], sockR: ['on', 'off', 'sleep'], flipflops: ['no', 'on', 'tied'], outfit: ['normal', 'pajamas'],
  hands: ['free', 'cuffs_front', 'cuffs_back', 'tied_front', 'tied_back', 'tied_up', 'hogtie', 'chair', 'sofa', 'bed'], feet: ['free', 'tied', 'toes', 'tiptoe', 'hogtie', 'chair', 'sofa', 'bed'],
};
const fmt = (d = {}) => [d.points ? `${d.points > 0 ? '+' : ''}${d.points} πόντοι` : '', d.loot ? `${d.loot > 0 ? '+' : ''}${d.loot} λεία` : '', d.tokens ? `${d.tokens > 0 ? '+' : ''}${d.tokens} token` : '', d.wanted ? `+${d.wanted} Wanted` : '', d.zones ? `+${d.zones} ζώνη` : ''].filter(Boolean).join(' · ');
const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([`﻿${text}`], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };

// DEAL OF TEMPTATION — Η ΤΑΙΝΙΑ · Tablet (κονσόλα σκηνοθεσίας): 6 οθόνες εργασίας + σταθερή μπάρα.
export default function ActCampaign({ ctx, state, sessionCode = '', updateState, onFinish, mirror = false }) {
  const { players, mg, setMg, log, nameOf, stopped } = ctx;
  const cg = mg.cg;
  const [screenLocal, setScreenLocal] = useState(() => (mg.cg?.boardMode ? 8 : 1));
  // 12.1.0 · Στην πρόβα, η καρτέλα του Tablet φαίνεται και στα παράθυρα της TV (mirror).
  const screen = mirror ? (state?.rehearsalTab || screenLocal) : screenLocal;
  const setScreen = (id) => { setScreenLocal(id); if (!mirror && hasBots(players)) updateState?.({ rehearsalTab: id }); };
  const [moreTabs, setMoreTabs] = useState(false);
  // 10.5.2 · Οδηγός πρώτης βραδιάς: ανοιχτός από προεπιλογή, θυμάται αν τον έκλεισες σε αυτό το Tablet.
  const [guideOn, setGuideOn] = useState(() => { try { return localStorage.getItem('dot_movie_guide') !== 'off'; } catch { return true; } });
  // 12.0.0 · Αυτόματος πιλότος (μόνο ακίνδυνα βήματα· βλ. lib/movieAutopilot.js).
  const [autoOn, setAutoOn] = useState(() => { try { return localStorage.getItem('dot_autopilot') === 'on'; } catch { return false; } });
  const [autoSince, setAutoSince] = useState({ key: '', at: 0 });
  const [autoCancel, setAutoCancel] = useState('');
  const toggleAuto = (on) => {
    setAutoOn(on); setAutoCancel('');
    try { localStorage.setItem('dot_autopilot', on ? 'on' : 'off'); } catch { /* χωρίς storage */ }
    updateState?.({ videoMode: on ? 'auto' : 'manual' }); // με τον πιλότο, τα βίντεο παίζουν μόνα τους στις στιγμές τους
    log(on ? '🤖 Αυτόματος πιλότος: ON' : '🤖 Αυτόματος πιλότος: OFF');
  };
  const toggleGuide = (on) => { setGuideOn(on); try { localStorage.setItem('dot_movie_guide', on ? 'on' : 'off'); } catch { /* χωρίς storage */ } };
  const [target, setTarget] = useState('');
  const [executors, setExecutors] = useState([]);
  const [previewCard, setPreviewCard] = useState('');
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState('intro');
  const [specialColor, setSpecialColor] = useState(NAIL_COLORS[0]);
  const [nightTarget, setNightTarget] = useState('');
  const [nightExec, setNightExec] = useState('');
  const up = (fn) => setMg((cur) => ({ cg: fn(cur.cg) }));
  const names = Object.fromEntries(players.map((p) => [p.id, p.name]));

  function start(format) {
    const fm = FORMATS[format];
    setMg({ cg: E.logLine(E.initCampaign(players, { format }), `🎬 Η ταινία ξεκίνησε · ${fm.label}`), timer: fm.minutes ? { total: fm.minutes * 60, endsAt: Date.now() + fm.minutes * 60000, remaining: fm.minutes * 60 } : undefined });
    updateState?.({ gameDurationMinutes: fm.minutes });
    log(`🎬 Deal of Temptation — Η Ταινία · ${fm.label}`);
  }

  // Ενέργειες από τα κινητά: νύχια, ψήφοι, tokens, ρίσκο, εξαγορά.
  useEffect(() => {
    const a = mg.playerAction;
    if (mirror || !a || !mg.cg) return;
    const pid = a.playerId;
    let c = mg.cg;
    if (a.type === 'cg_nail' && c.nailsOpen && !E.statsOf(c, pid).nailLocked && NAIL_COLORS.includes(a.nail)) {
      const s = E.statsOf(c, pid);
      c = { ...c, players: { ...c.players, [pid]: { ...s, nail: a.nail, nailLocked: true } } };
      c = E.applyDelta(c, pid, { points: 2, tokens: 1 }, { undoable: false });
      log(`💅 ${nameOf(pid)} δήλωσε ${a.nail} (+2, +1 token)`);
    } else if (a.type === 'cg_vote' && c.votes?.open && typeof a.value === 'string') {
      c = { ...c, votes: { ...c.votes, ballots: { ...(c.votes.ballots || {}), [pid]: a.value.slice(0, 40) } } };
    } else if (a.type === 'cg_final' && typeof a.target === 'string' && a.target !== pid) {
      c = { ...c, finalVotes: { ...(c.finalVotes || {}), [pid]: a.target } };
    } else if (a.type === 'cg_risk' && ['lock', 'risk'].includes(a.value)) {
      c = { ...c, risk: { ...(c.risk || {}), [pid]: a.value } };
      log(`🎲 ${nameOf(pid)}: ${a.value === 'risk' ? 'Ρισκάρει ±6' : 'Κλειδώνει το σκορ'}`);
    } else if (a.type === 'cg_token') {
      const res = E.spendToken(c, pid, a.use, { target: a.target, players });
      if (res.ok) { c = res.cg; log(`🪙 ${nameOf(pid)}: ${TOKEN_USES.find((t) => t.id === a.use)?.label}${res.victim ? ` από ${nameOf(res.victim)}` : ''}`); }
    } else if (a.type === 'cg_tod' && c.game === 'tod' && c.tod?.pid === pid) {
      c = G.todChoose(c, a.value);
      log(`🎭 ${nameOf(pid)} διάλεξε ${a.value === 'dare' ? 'ΘΑΡΡΟΣ' : 'ΑΛΗΘΕΙΑ'}`);
    } else if (a.type === 'cg_dond_box' && c.game === 'dond' && c.dond?.pid === pid) {
      const no = Number(a.value);
      if (c.dond.status === 'pick') { c = G.dondPick(c, no); log(`💼 ${nameOf(pid)} κράτησε το κουτί ${no}`); }
      else if (c.dond.status === 'open') {
        const box = c.dond.boxes.find((b) => b.no === no);
        const r = G.dondOpen(c, no);
        if (r.box) {
          c = r.cg;
          log(`💼 Κουτί ${no}: ${box.label}`);
          if (box.wheel && !G.isFree(c, pid)) {
            const w = G.allWheelItems().filter((i) => i.wheel === box.wheel && blockedBy(mg, pid, textOf({ title: i.title, text: i.tv })).length === 0 && G.profileAllows(players.find((p) => p.id === pid)?.movieProfile, i));
            const chosen = w.length ? w[Math.floor(Math.random() * w.length)].id : null;
            c = G.spinWheel(c, box.wheel, pid, { allowedIds: chosen ? [chosen] : [], reason: 'dond' }).cg;
          }
        }
      }
    } else if (a.type === 'cg_dond' && c.game === 'dond' && c.dond?.pid === pid && c.dond.status === 'offer') {
      c = G.dondDecide(c, a.value);
      log(a.value === 'deal' ? `🤝 ${nameOf(pid)}: DEAL` : `✋ ${nameOf(pid)}: NO DEAL`);
    } else if (a.type === 'cg_roll' && BD.turnPid(c) === pid && !c.board?.pending) {
      const v = BD.rollDie();
      const res = BD.boardRoll(c, pid, v);
      if (res.ok) { c = res.cg; log(`🎲 ${nameOf(pid)} έφερε ${v} → ${squareOf(res.cg.board.roll.to).title}`); sfx.click?.(); }
    } else if (a.type === 'cg_wheel_ok' && c.wheel?.pid === pid && !c.wheel.done) {
      c = G.confirmWheel(c);
    } else if (a.type === 'cg_buyout') {
      const res = E.buyout(c, pid);
      if (res.ok) { c = res.cg; log(`🪙 ${nameOf(pid)} εξαγόρασε ένα επίπεδο Wanted`); }
    }
    setMg({ cg: c, playerAction: null });
  }, [mg.playerAction?.at]);

  // 12.0.0 · Πρόβα: οι εικονικές παίκτριες «παίζουν» από εδώ, σαν να ήταν κινητά. Ποτέ σε ΣΤΟΠ.
  const botsOn = hasBots(players);
  useEffect(() => {
    if (mirror || !botsOn) return undefined;
    const t = setInterval(() => {
      if (stopped || mg.playerAction) return;
      const a = botAction({ cg: mg.cg, players });
      if (a) setMg({ playerAction: { ...a, at: Date.now() } });
    }, 1500);
    return () => clearInterval(t);
  }, [botsOn, stopped, mg.cg, mg.playerAction, players]);
  // 12.0.0 · Εκτέλεση βήματος πιλότου (ίδιες ενέργειες με τα κουμπιά της διοργανώτριας).
  const runPlan = (plan) => {
    if (!plan || stopped) return;
    if (plan.action === 'startAct') { up((c) => { const o = E.startAct(c, players); return o.boardMode ? BD.boardStart(o, players) : o; }); log('▶ ΕΝΑΡΞΗ ΠΡΑΞΗΣ'); }
    else if (plan.action === 'goNext') { up((c) => E.goNext(c)); log('➡️ Μετάβαση στην επόμενη ήπειρο'); }
    else if (plan.action === 'rollFor' && plan.pid) {
      const v = BD.rollDie();
      up((c) => (BD.turnPid(c) === plan.pid && !c.board?.pending ? BD.boardRoll(c, plan.pid, v).cg : c));
      log(`🎲 Ο πιλότος έριξε για ${nameOf(plan.pid)}: ${v}`);
    } else if (plan.action === 'finale' && window.confirm('Πέρασμα στο Μεγάλο Φινάλε;')) up((c) => E.toFinale(c));
  };
  const [, setAutoTick] = useState(0);
  useEffect(() => {
    if (mirror || !autoOn || !mg.cg) return undefined;
    const t = setInterval(() => {
      const g = movieGuideStep({ mg, players, stopped, nameOf });
      const plan = autopilotPlan(g, mg.cg, { stopped, players });
      const key = plan ? `${g.id}:${plan.action}:${plan.pid || ''}:${mg.cg.act}:${mg.cg.status}:${mg.cg.board?.rolls || 0}` : '';
      if (key !== autoSince.key) { setAutoSince({ key, at: Date.now() }); return; }
      if (plan?.auto && autoCancel !== key && Date.now() >= autopilotDueAt(plan, autoSince.at)) { runPlan(plan); setAutoSince({ key: '', at: 0 }); return; }
      setAutoTick((x) => x + 1);
    }, 500);
    return () => clearInterval(t);
  }, [autoOn, mg, players, stopped, autoSince, autoCancel]);

  // 12.1.0 · Πλήρης αυτόματη πρόβα (μόνο όταν ΟΛΕΣ είναι εικονικές· βλ. lib/movieFullAuto.js).
  const ra = state?.rehearsalAuto || {};
  const fullAllowed = isFullAutoAllowed(players);
  const [fullShown, setFullShown] = useState({ key: '', at: 0, label: '', wait: 0 });
  useEffect(() => {
    if (mirror || !ra.on) return undefined;
    if (!fullAllowed) { updateState?.({ rehearsalAuto: { ...ra, on: false } }); log('⛔ Αυτόματη πρόβα: σταμάτησε (μπήκε αληθινή παίκτρια)'); return undefined; }
    const t = setInterval(() => {
      if (stopped || mg.playerAction) return;
      const st = fullAutoStep({ cg: mg.cg, players, speed: ra.speed || 'normal', stopped });
      if (!st) { if (fullShown.key) setFullShown({ key: '', at: 0, label: '', wait: 0 }); return; }
      if (st.key !== fullShown.key) { setFullShown({ key: st.key, at: Date.now(), label: st.label, wait: st.wait }); return; }
      if (Date.now() - fullShown.at >= st.wait) { up(st.run); log(`🎬 ${st.label}`); setFullShown({ key: '', at: 0, label: '', wait: 0 }); }
    }, 500);
    return () => clearInterval(t);
  }, [mirror, ra.on, ra.speed, fullAllowed, stopped, mg, players, fullShown]);
  const setFullAuto = (on, speed = ra.speed || 'normal') => { updateState?.({ rehearsalAuto: { on, speed } }); log(on ? `🎬 Αυτόματη πρόβα: ON (${speed === 'fast' ? 'γρήγορη' : 'κανονική'})` : '🎬 Αυτόματη πρόβα: OFF'); };
  const FullAutoBar = botsOn && !mirror ? (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#2de2ff]/15 px-3 py-2 text-sm" style={{ boxShadow: '0 0 0 1.5px rgba(45,226,255,.6)' }}>
      <b>🎬 Αυτόματη πρόβα</b>
      {!fullAllowed && <span className="text-xs opacity-75">(μόνο όταν παίζουν ΜΟΝΟ εικονικές)</span>}
      {fullAllowed && (ra.on ? (
        <>
          <span className="text-xs opacity-80">{fullShown.label ? `${fullShown.label} σε ${Math.max(0, Math.ceil((fullShown.at + fullShown.wait - Date.now()) / 1000))}″` : 'περιμένει τις εικονικές…'}</span>
          <Btn onClick={() => setFullAuto(true, ra.speed === 'fast' ? 'normal' : 'fast')}>{ra.speed === 'fast' ? '🐢 Κανονική' : '⚡ Γρήγορη'}</Btn>
          <Btn color="bg-red-600" onClick={() => setFullAuto(false)}>■ Σταμάτα</Btn>
        </>
      ) : (
        <>
          <Btn color="bg-emerald-600" onClick={() => setFullAuto(true, 'normal')}>▶ Κανονική</Btn>
          <Btn color="bg-amber-500" onClick={() => setFullAuto(true, 'fast')}>⚡ Γρήγορη (~10–15′)</Btn>
        </>
      ))}
      {sessionCode && <a className="ml-auto text-xs underline" href={`/tv?code=${encodeURIComponent(sessionCode)}&view=wall`} target="_blank" rel="noreferrer">🪟 Παράθυρα στην TV ↗</a>}
    </div>
  ) : null;

  const addBots = () => {
    const bots = makeBots(players, Math.max(1, 4 - players.filter((p) => !p.bot).length));
    if (!bots.length) return;
    updateState?.({ players: [...players, ...bots] });
    const at = Date.now();
    setMg({ consent: { ...(mg.consent || {}), players: { ...((mg.consent || {}).players || {}), ...Object.fromEntries(bots.map((b) => [b.id, { confirmed: true, at, optOuts: [] }])) } } });
    log(`🤖 Πρόβα: μπήκαν ${bots.length} εικονικές παίκτριες`);
  };
  const removeBots = () => { updateState?.({ players: players.filter((p) => !p.bot) }); log('🤖 Οι εικονικές παίκτριες βγήκαν'); };

  const rank = useMemo(() => (cg ? E.ranking(cg, players, { final: cg.status === 'finale' }) : []), [cg, players]);

  if (!cg) {
    return (
      <div className="mvg"><Panel title="🎬 Deal of Temptation — Η Ταινία · διάλεξε ροή" accent="gold">
        <p className="text-sm opacity-80">Ο χάρτης των 5 ηπείρων γίνεται μία ενιαία ιστορία. Πόντοι, λεία, tokens, Wanted και συμμαχίες περνούν από πράξη σε πράξη χωρίς να μηδενίζουν.</p>
        <WorldMap className="aspect-[2/1] w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.values(FORMATS).map((f) => (
            <div key={f.id} className="mvg-glass mvg-3d space-y-2 p-4">
              <div className="text-lg font-bold">{f.label}</div>
              <p className="text-sm opacity-75">{f.text}</p>
              <ol className="space-y-0.5 text-xs opacity-70">{f.acts.map((a, i) => <li key={i}>{i + 1}. {continentOf(a.continent).name} — {a.title}</li>)}</ol>
              <Btn color="bg-amber-500" disabled={!players.length || stopped} onClick={() => start(f.id)}>▶ Ξεκίνα</Btn>
            </div>
          ))}
        </div>
        {sessionCode && !mirror && <ReadinessCheck state={state} sessionCode={sessionCode} />}
        {/* 12.0.0 · Πρόβα χωρίς κόσμο */}
        <div className="mvg-glass flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="font-bold">🤖 Πρόβα με εικονικές παίκτριες</div>
            <p className="text-sm opacity-75">Μπαίνουν «Ρομπο-» παίκτριες που ρίχνουν ζάρι, ανοίγουν κουτιά, ψηφίζουν και επιβεβαιώνουν ποινές μόνες τους. Δοκιμάζεις όλη τη βραδιά, TV και φώτα, χωρίς κόσμο.</p>
          </div>
          {botsOn ? <Btn onClick={removeBots}>Βγάλε τις εικονικές</Btn> : <Btn color="bg-amber-500" disabled={stopped} onClick={addBots}>🤖 Βάλε εικονικές</Btn>}
        </div>
        {botsOn && isFullAutoAllowed(players) && (
          <div className="mvg-glass flex flex-wrap items-center gap-2 p-4">
            <div className="min-w-0 flex-1"><div className="font-bold">🎬 Πλήρης αυτόματη πρόβα</div><p className="text-sm opacity-75">Όλη η ταινία τρέχει μόνη της (Γρήγορο σετ) και τη βλέπεις στην TV.</p></div>
            <Btn color="bg-emerald-600" disabled={stopped} onClick={() => { start('quick'); setFullAuto(true, 'normal'); }}>▶ Κανονική</Btn>
            <Btn color="bg-amber-500" disabled={stopped} onClick={() => { start('quick'); setFullAuto(true, 'fast'); }}>⚡ Γρήγορη</Btn>
            {sessionCode && <a className="text-sm underline" href={`/tv?code=${encodeURIComponent(sessionCode)}&view=wall`} target="_blank" rel="noreferrer">🪟 Παράθυρα στην TV ↗</a>}
          </div>
        )}
      </Panel></div>
    );
  }

  const act = E.currentAct(cg);
  const status = cg.status || 'transition';
  const now = Date.now();
  const allowed = (pid, item) => blockedBy(mg, pid, textOf(item)).length === 0;
  const pickTarget = target || cg.drawn?.pid || '';
  const nightOk = players.filter((p) => !consentOf(mg, p.id).optOuts.includes('night'));
  const PlayerSelect = ({ value, onChange, list = players, label = 'Παίκτρια' }) => (
    <select className="ui-input" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">— {label} —</option>{list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );

  const draw = (list) => {
    const { cg: next, pid } = E.drawPlayer(cg, players, { eligible: list });
    if (!pid) { log('⏭ Καμία διαθέσιμη παίκτρια για κλήρωση'); return; }
    setMg({ cg: E.logLine(next, `🎲 Κλήρωση: ${nameOf(pid)}`) });
    setTarget(pid);
    sfx.click?.();
  };
  const startTrial = (id, pid = pickTarget, execs = executors) => {
    const t = trialOf(id);
    if (!pid) return;
    if (!allowed(pid, t)) { log(`⏭ «${t.title}» εκτός ορίων της ${nameOf(pid)} — PASS`); return; }
    if (t.needsBare && !E.isBareFoot(E.statsOf(cg, pid).state)) { if (!window.confirm(`Η ${nameOf(pid)} δεν έχει ακόμα γυμνό πέλμα. Να ξεκινήσει το γαργάλημα;`)) return; }
    up((c) => E.logLine(E.startTrial({ ...c, card: null }, id, pid, { executors: execs }), `${t.icon} ${t.title}: ${nameOf(pid)}`));
  };
  const resolve = (outcome) => {
    const t = cg.trial && trialOf(cg.trial.id);
    if (!t) return;
    up((c) => E.logLine(E.resolveTrial(c, outcome), `${outcome === 'win' ? '✅' : outcome === 'lose' ? '❌' : '⏭'} ${t.title} · ${nameOf(cg.trial.pid)}${outcome === 'win' ? ` · ${fmt(t.win)}` : outcome === 'lose' ? ` · ${fmt(t.lose)}` : ' · PASS'}`));
    if (outcome === 'lose' && t.lose.next) setTimeout(() => startTrial(t.lose.next, cg.trial.pid), 0);
    sfx[outcome === 'lose' ? 'fail' : 'ok']?.();
  };
  const piece = (pid, p, outcome = 'win') => {
    if (!pid) return;
    if (outcome === 'lose') { up((c) => E.logLine(E.applyDelta(c, pid, trialOf('shoe').lose, { penalty: true }), `❌ ${nameOf(pid)} αρνήθηκε/καθυστέρησε (−2, +1 Wanted)`)); return; }
    const res = E.removePiece(cg, pid, p);
    if (!res.ok) { log('Αυτό το κομμάτι δεν μπορεί να βγει ακόμα (πρώτα το παπούτσι του ίδιου ποδιού).'); return; }
    const t = trialOf(p.startsWith('shoe') ? 'shoe' : 'sock');
    setMg({ cg: E.logLine({ ...E.applyDelta(res.cg, pid, t.win), trial: { id: t.id, pid, at: Date.now(), done: true, side: p, executors: [], until: null, secs: 0, outcome: 'win' }, card: null }, `${t.icon} ${nameOf(pid)}: ${STATE_LABELS[p]} βγήκε (${fmt(t.win)})`) });
  };
  const sendCard = (id, pidOverride = '') => {
    const card = cardOf(id);
    if (!card) return;
    let pid = pidOverride || pickTarget;
    if (card.target === 'wanted') pid = E.wantedOne(cg, players) || rank[0]?.id || pid;
    let pid2 = '';
    if (card.pair) { const others = players.filter((p) => p.id !== pid); pid2 = others[Math.floor(Math.random() * others.length)]?.id || ''; }
    up((c) => {
      let out = { ...c, trial: null, card: { id, pid, pid2, prompt: prompt.trim(), at: Date.now() } };
      if (card.vote && card.vote !== 'final' && card.vote !== 'risk') out = E.openVote(out, { kind: card.vote, q: card.title, cardId: id, pid });
      if (card.vote === 'final') out = E.openVote(out, { kind: 'final', q: card.title, cardId: id });
      if (card.vote === 'risk') out = E.openVote(out, { kind: 'risk', q: card.title, cardId: id });
      return E.logLine(out, `🎴 ${card.title}${pid ? ` → ${nameOf(pid)}` : ''}${pid2 ? ` & ${nameOf(pid2)}` : ''}`);
    });
    setPreviewCard(''); setPrompt('');
  };
  const cardResult = (outcome) => {
    const card = cg.card && cardOf(cg.card.id);
    if (!card || !cg.card.pid) return;
    const d = outcome === 'win' ? card.win : card.lose;
    up((c) => E.logLine(E.applyDelta(c, c.card.pid, d, { penalty: outcome === 'lose' }), `${outcome === 'win' ? '✅' : '❌'} ${card.title} · ${nameOf(cg.card.pid)} · ${fmt(d)}`));
  };

  const onAir = onAirLabel(cg, nameOf, now);
  const Bar = (
    <div className="mvg-glass mvg-hud -mx-1 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {/* 11.0.0 · Κονσόλα σκηνοθέτη */}
        <span className="show-title text-[20px]">Κονσόλα</span>
        {botsOn && <span className="rounded-full bg-[#2de2ff] px-2.5 py-0.5 text-xs font-black text-black" title="Παίζουν εικονικές παίκτριες">🤖 ΠΡΟΒΑ</span>}
        <span className="show-lower text-[13px]"><span className="flex items-center gap-1.5"><span className="gx-live-dot" />{status === 'active' ? 'ON AIR' : STATUS_LABEL[status]}</span></span>
        <span className="font-semibold">Πράξη {String(act.index + 1).padStart(2, '0')} / {String(act.total).padStart(2, '0')} · {act.info.name}</span>
        {act.day && <span className="opacity-60">Ημέρα {act.day}</span>}
        {cg.actStartedAt && status === 'active' && <span className="tabular-nums opacity-70">⏱ {Math.floor((now - cg.actStartedAt) / 60000)}′</span>}
        <span className="ml-auto flex gap-2">
          <Btn disabled={!(cg.undo || []).length} onClick={() => { up((c) => E.undo(c)); log('↶ Αναίρεση τελευταίας κίνησης'); }}>↶ Αναίρεση</Btn>
        </span>
      </div>
      <div className="gx-onair" aria-live="polite">
        <span className="gx-live-dot" style={{ fontSize: 14 }} />
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[#FF6961]">Στον αέρα</span>
        <span className="min-w-0 truncate text-sm font-semibold">{onAir.icon} {onAir.text}</span>
      </div>
      <div className="gx-strip" role="list" aria-label="Παίκτριες και σκορ">
        {rank.map((p, i) => (
          <div key={p.id} role="listitem" className="gx-strip-item" style={i === 0 ? { borderColor: 'rgba(232,194,107,.55)', background: 'rgba(232,194,107,.10)' } : undefined}>
            <PlayerAvatar name={p.name} color={colorOf(players, p.id)} size={30} />
            <span className="font-semibold">{i === 0 ? '👑 ' : ''}{p.name}</span>
            <b className="show-led tabular-nums">{p.score}</b>
            {p.stats.wanted > 0 && <WantedStars n={p.stats.wanted} size={11} />}
          </div>
        ))}
      </div>
      <div className="mvg-tabs" role="tablist">
        {SCREENS.filter((s) => !s.more || moreTabs || screen === s.id).map((s) => <button key={s.id} type="button" role="tab" aria-selected={screen === s.id} onClick={() => setScreen(s.id)} className="mvg-tab">{s.icon} {s.label}</button>)}
        <button type="button" onClick={() => setMoreTabs((v) => !v)} className="mvg-tab" aria-expanded={moreTabs}>{moreTabs ? '✕ Λιγότερα' : '⋯ Περισσότερα'}</button>
      </div>
    </div>
  );

  const trialLive = cg.trial && !cg.trial.done ? trialOf(cg.trial.id) : null;
  const TrialBox = trialLive && (
    <div className="space-y-2 rounded-2xl bg-[#3A0A12] p-3">
      {trialArt(trialLive.id) && <img src={trialArt(trialLive.id)} alt="" className="h-32 w-full rounded-xl object-cover" />}
      <div className="font-bold">{trialLive.icon} {trialLive.title} · {nameOf(cg.trial.pid)}{cg.trial.until ? ` · ⏱ ${E.trialSecondsLeft(cg, now)}″` : ''}</div>
      <div className="text-xs opacity-75">Επιτυχία: {fmt(trialLive.win)} · Ποινή: {fmt(trialLive.lose)}{trialLive.lose.warrant ? ' + Κάρτα Εντάλματος' : ''}</div>
      <div className="grid grid-cols-3 gap-2">
        <Btn color="bg-emerald-600" onClick={() => resolve('win')}>✅ Επιτυχία</Btn>
        <Btn color="bg-red-600" onClick={() => resolve('lose')}>❌ Ποινή</Btn>
        <Btn onClick={() => resolve('pass')}>⏭ PASS</Btn>
      </div>
    </div>
  );

  return (
    <div className="mvg space-y-4">
      {firstArt('bg_tablet_console') && <div aria-hidden="true" className="mvg-bgimg" style={{ backgroundImage: `linear-gradient(180deg, rgba(5,5,8,.7), rgba(5,5,8,.94)), url("${firstArt('bg_tablet_console')}")` }} />}
      {Bar}
      {FullAutoBar}
      {guideOn ? (() => {
        const g = movieGuideStep({ mg, players, stopped, nameOf });
        return (
          <div className="gx-guide show-panel--gold flex items-start gap-3 rounded-[22px] p-3" role="status" aria-live="polite">
            <span className="text-3xl leading-none" aria-hidden="true">{g.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="show-kicker text-[11px]">🧭 Τώρα</div>
              <div className="show-title text-[22px]">{g.title}</div>
              <div className="text-sm opacity-80">{g.text}</div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {(() => {
                const plan = autopilotPlan(g, cg, { stopped, players });
                const key = plan ? `${g.id}:${plan.action}:${plan.pid || ''}:${cg.act}:${cg.status}:${cg.board?.rolls || 0}` : '';
                const due = autoOn && plan?.auto && autoCancel !== key && autoSince.key === key ? autopilotDueAt(plan, autoSince.at) : null;
                return (
                  <>
                    {plan && <Btn color="bg-emerald-600" onClick={() => runPlan(plan)}>{plan.label}</Btn>}
                    {due && <div className="text-right text-xs"><b className="show-led text-base">{Math.max(0, Math.ceil((due - Date.now()) / 1000))}″</b> αυτόματα · <button type="button" className="underline" onClick={() => setAutoCancel(key)}>Άκυρο</button></div>}
                  </>
                );
              })()}
              {g.tab && g.tab !== screen && <Btn color="bg-amber-500" onClick={() => setScreen(g.tab)}>Πήγαινε εκεί →</Btn>}
              <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" className="accent-[#ffd23f]" checked={autoOn} onChange={(e) => toggleAuto(e.target.checked)} />🤖 Αυτόματος πιλότος</label>
              <button type="button" className="text-xs opacity-60 underline" onClick={() => toggleGuide(false)}>Κρύψε τον οδηγό</button>
            </div>
          </div>
        );
      })() : (
        <div className="text-right"><button type="button" className="text-xs opacity-60 underline" onClick={() => toggleGuide(true)}>🧭 Δείξε τον οδηγό</button></div>
      )}
      {sessionCode && !mirror && status === 'transition' && act.index === 0 && !cg.lastClosed && <ReadinessCheck state={state} sessionCode={sessionCode} compact />}
      <p className="rounded-xl bg-[#FF9F0A]/10 px-3 py-2 text-xs text-[#FFB340]">🛟 {MOVIE_SAFETY}</p>

      {screen === 1 && (
        <Panel title="🗺️ Χάρτης των 5 ηπείρων & Πράξεις" accent="gold">
          <WorldMap active={status === 'active' || status === 'transition' ? act.continent : null} conquered={cg.conquered} names={names} className="aspect-[2/1] w-full rounded-2xl" />
          <div className="mvg-glass mvg-3d flex gap-3 p-3 text-sm">
            {contArt('card', act.continent) && <img src={contArt('card', act.continent)} alt="" className="w-28 shrink-0 rounded-2xl object-cover shadow-xl" style={{ aspectRatio: '4/5' }} />}
            <div>
            <div className="font-bold">ΠΡΑΞΗ {String(act.index + 1).padStart(2, '0')}: {act.title} · {act.info.name}{act.when ? ` · ${act.when}` : ''}</div>
            <p className="opacity-80">{act.text}</p>
            <p className="mt-1 text-xs opacity-60">Γύροι ηπείρου: {act.info.rounds}</p>
            </div>
          </div>
          <MandatoryPanel ctx={ctx} cg={cg} up={up} players={players} allowed={allowed} />
          <div className="grid gap-2 sm:grid-cols-3">
            <Btn color="bg-emerald-600" disabled={status === 'active' || status === 'finale' || G.mandatoryPending(cg)} onClick={() => { up((c) => { const o = E.startAct(c, players); return o.boardMode ? BD.boardStart(o, players) : o; }); log(`▶ ΕΝΑΡΞΗ ΠΡΑΞΗΣ ${act.index + 1}`); }}>▶ ΕΝΑΡΞΗ ΠΡΑΞΗΣ</Btn>
            <Btn color="bg-red-600" disabled={status !== 'active'} onClick={() => { if (window.confirm('Κλείσιμο πράξης: κλειδώνουν τα αποτελέσματα. Συνέχεια;')) up((c) => E.closeAct(c, players)); }}>■ ΚΛΕΙΣΙΜΟ ΠΡΑΞΗΣ</Btn>
            <Btn color="bg-amber-500" disabled={status === 'active' || !cg.lastClosed || act.index >= act.total - 1 || (cg.conquered || {})[act.index + 1] || G.mandatoryPending(cg)} onClick={() => up((c) => E.goNext(c))}>➡️ ΜΕΤΑΒΑΣΗ ΣΕ ΕΠΟΜΕΝΗ ΗΠΕΙΡΟ</Btn>
            <Btn onClick={() => up((c) => ({ ...c, status: 'transition', previously: { at: Date.now(), from: (c.conquered || {})[Math.max(0, act.index - 1)]?.continent || act.continent, to: act.continent } }))}>⏪ PREVIOUSLY ON → TV</Btn>
            <Btn onClick={() => up((c) => E.setStandby(c, c.status !== 'standby'))}>{status === 'standby' ? '▶ STANDBY OFF' : '⏸ STANDBY ON'}</Btn>
            <Btn color="bg-amber-500" disabled={status === 'finale'} onClick={() => { if (window.confirm('Πέρασμα στο Μεγάλο Φινάλε;')) up((c) => E.toFinale(c)); }}>👑 ΦΙΝΑΛΕ</Btn>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold">⚡ Έκτακτο άλμα ηπείρου</div>
            <div className="flex flex-wrap gap-2">{CONTINENTS.map((c) => <Btn key={c.id} disabled={c.id === act.continent || G.mandatoryPending(cg)} onClick={() => { if (window.confirm(`Έκτακτο άλμα στο ${c.name};`)) up((x) => E.jumpTo(x, c.id)); }}>{c.no}. {c.name}</Btn>)}</div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="font-semibold">Carry-Over · τι περνάει στην επόμενη ήπειρο</div>
            <p className="opacity-75">{act.info.legacy}</p>
          </div>
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {E.actsOf(cg).map((a, i) => {
              const done = (cg.conquered || {})[i];
              return <li key={i} className={`rounded-xl px-3 py-2 ${i === act.index ? 'bg-[#FF3B5C]/20' : done ? 'bg-[#45D98A]/10' : 'bg-white/5'}`}>{i + 1}. {continentOf(done?.continent || a.continent).name} — {a.title}{done?.winner ? ` · 👑 ${nameOf(done.winner)}` : ''}</li>;
            })}
          </ol>
          <MissionPanel ctx={ctx} pool={MOVIE_MISSIONS} title="📲 Μυστικές αποστολές (και σε Standby)" onSuccess={(_m, pid) => up((c) => E.applyDelta(c, pid, { points: 3 }))} onFail={(_m, pid) => up((c) => E.applyDelta(c, pid, { points: -1 }, { penalty: true }))} />
        </Panel>
      )}

      {screen === 2 && (
        <Panel title="🎲 Κλήρωση, Νύχια & Παπούτσια / Κάλτσες (ένα-ένα)" accent="gold">
          <div className="flex flex-wrap gap-2">
            <Btn color="bg-amber-500" onClick={() => draw(players)}>🎲 ΚΛΗΡΩΣΗ ΠΑΙΚΤΡΙΑΣ</Btn>
            <Btn onClick={() => { up((c) => ({ ...E.logLine(c, '💅 Άνοιξε η δήλωση νυχιών'), nailsOpen: !c.nailsOpen, card: c.nailsOpen ? c.card : null })); }}>{cg.nailsOpen ? '🔒 Κλείσιμο δήλωσης νυχιών' : '💅 ΑΝΟΙΓΜΑ ΔΗΛΩΣΗΣ ΝΥΧΙΩΝ'}</Btn>
            <PlayerSelect value={pickTarget} onChange={setTarget} label="Κληρωμένη" />
          </div>
          {cg.nailsOpen && <p className="text-xs opacity-70">{MOVIE_TV.nails.text}</p>}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Κάρτα Ειδικού Χρώματος:</span>
            <select className="ui-input" value={specialColor} onChange={(e) => setSpecialColor(e.target.value)} aria-label="Χρώμα">{NAIL_COLORS.map((c) => <option key={c}>{c}</option>)}</select>
            <Btn onClick={() => { const hit = players.filter((p) => E.statsOf(cg, p.id).nail === specialColor); if (!hit.length) { log(`Καμία με ${specialColor}`); return; } up((c) => hit.reduce((acc, p) => E.applyDelta(acc, p.id, { points: 3 }, { undoable: false }), E.withUndo(E.logLine(c, `🎨 Ειδικό Χρώμα ${specialColor}: ${hit.map((p) => p.name).join(', ')} (+3)`)))); }}>🎨 ΚΑΡΤΑ ΕΙΔΙΚΟΥ ΧΡΩΜΑΤΟΣ</Btn>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-xs opacity-60"><th>Παίκτρια</th><th>Νύχια</th><th>Αρ. παπ.</th><th>Δεξ. παπ.</th><th>Αρ. κάλτσα</th><th>Δεξ. κάλτσα</th><th /></tr></thead>
            <tbody>{players.map((p) => {
              const s = E.statsOf(cg, p.id).state;
              const btn = (k) => <td key={k}><button type="button" disabled={!E.canRemove(s, k)} onClick={() => piece(p.id, k)} className={`rounded-lg px-2 py-1 text-xs ${s[k] === 'on' ? 'bg-white/10' : 'bg-[#45D98A]/20 text-[#7BE495]'} disabled:opacity-60`}>{VALUE_LABELS[s[k]]}</button></td>;
              return <tr key={p.id} className={`border-t border-white/10 ${pickTarget === p.id ? 'bg-[#E8C26B]/10' : ''}`}><td className="py-1.5 pr-2 font-semibold">{p.name}</td><td className="pr-2">{E.statsOf(cg, p.id).nail || '—'}</td>{['shoeL', 'shoeR', 'sockL', 'sockR'].map(btn)}<td><button type="button" onClick={() => piece(p.id, null, 'lose')} className="rounded-lg bg-red-600/30 px-2 py-1 text-xs">Άρνηση</button></td></tr>;
            })}</tbody></table></div>
          <p className="text-xs opacity-60">Κανόνας: 1 κομμάτι ανά γύρο· η κάλτσα βγαίνει μόνο από πόδι χωρίς παπούτσι. Βγάλσιμο: +2 πόντοι & +1 Λεία · άρνηση: −2 & +1 Wanted. Με γυμνό πέλμα ξεκλειδώνει το «Γαργάλημα στα πόδια».</p>
        </Panel>
      )}

      {screen === 3 && (
        <Panel title="⛓️ Δράση, Χοροί & Δεσίματα" accent="gold">
          <div className="flex flex-wrap gap-2">
            <Btn color="bg-amber-500" onClick={() => draw(players)}>🎲 Κλήρωση</Btn>
            <PlayerSelect value={pickTarget} onChange={setTarget} label="Στόχος" />
            <select multiple className="ui-input h-20" value={executors} onChange={(e) => setExecutors([...e.target.selectedOptions].map((o) => o.value))} aria-label="Εκτελέστριες">
              {players.filter((p) => p.id !== pickTarget).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {TrialBox}
          <div className="grid gap-2 sm:grid-cols-2">
            {TRIALS.filter((t) => t.screen === 3).map((t) => {
              const blocked = pickTarget && !allowed(pickTarget, t);
              return (
                <button key={t.id} type="button" disabled={!pickTarget || !!trialLive || blocked} onClick={() => startTrial(t.id)} className="rounded-2xl bg-[#2C2C2E] p-3 text-left disabled:opacity-40">
                  <div className="font-bold">{t.icon} {t.title}{t.secs ? ` · ${t.secs}″` : ''}</div>
                  <div className="text-xs opacity-70">Επιτυχία {fmt(t.win)} · Ποινή {fmt(t.lose)}{blocked ? ' · εκτός ορίων' : ''}</div>
                </button>
              );
            })}
          </div>
          {pickTarget && E.statsOf(cg, pickTarget).state.hands !== 'free' && <Btn onClick={() => { up((c) => E.logLine(E.releaseAll(c, pickTarget), `🔓 Απελευθέρωση / λήξη σκηνής: ${nameOf(pickTarget)}`)); }}>🔓 Απελευθέρωση / Λήξη σκηνής</Btn>}
          <div className="space-y-2 rounded-2xl bg-white/5 p-3">
            <div className="font-semibold">🎴 Τράπεζα καρτών — προεπισκόπηση πριν σταλεί</div>
            <div className="flex flex-wrap gap-1.5">{PHASES.map((p) => <button key={p.id} type="button" onClick={() => setPhase(p.id)} className={`rounded-full px-3 py-1 text-xs ${phase === p.id ? 'bg-[#E8C26B] text-black' : 'bg-white/10'}`}>{p.title}</button>)}</div>
            <div className="flex flex-wrap gap-2">{MOVIE_CARDS.filter((c) => c.phase === phase && (!c.continent || c.continent === act.continent)).map((c) => <Btn key={c.id} onClick={() => setPreviewCard(c.id)}>{c.title}</Btn>)}</div>
            {previewCard && (
              <div className="space-y-2 rounded-xl bg-black/40 p-3">
                <div className="text-xs opacity-60">Προεπισκόπηση TV</div>
                <div className="font-bold">{cardOf(previewCard).title}</div>
                <div className="text-sm opacity-85">{cardOf(previewCard).text}</div>
                <input className="ui-input w-full" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Δήλωση / θέμα για την TV (προαιρετικό)…" />
                <div className="flex gap-2"><Btn color="bg-amber-500" onClick={() => sendCard(previewCard)}>📺 Αποστολή σε TV & κινητά</Btn><Btn onClick={() => setPreviewCard('')}>Άκυρο</Btn></div>
              </div>
            )}
            {cg.card && (
              <div className="space-y-2 rounded-xl bg-[#2C2C2E] p-3 text-sm">
                <div className="font-semibold">Στην TV: {cardOf(cg.card.id)?.title}{cg.card.pid ? ` · ${nameOf(cg.card.pid)}` : ''}</div>
                {cg.votes && <div>🗳️ {cg.votes.open ? `Ψήφοι ${Object.values(cg.votes.ballots || {}).filter(Boolean).length}/${players.length}` : 'Κλειστή'} · {E.tallyVotes(cg).map(([k, n]) => `${names[k] || k} ${n}`).join(' · ') || '—'}</div>}
                <div className="flex flex-wrap gap-2">
                  {cg.votes?.open && <Btn onClick={() => up((c) => E.closeVote(c))}>🔒 Κλείσιμο ψηφοφορίας</Btn>}
                  <Btn color="bg-emerald-600" disabled={!cg.card.pid} onClick={() => cardResult('win')}>✅ Κέρδος</Btn>
                  <Btn color="bg-red-600" disabled={!cg.card.pid} onClick={() => cardResult('lose')}>❌ Ποινή</Btn>
                  <Btn onClick={() => up((c) => ({ ...c, card: null, votes: null }))}>Τέλος κάρτας</Btn>
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {screen === 4 && (
        <Panel title="🌙 Βράδυ στον Ύπνο" accent="gold">
          <div className="flex flex-wrap gap-2">
            <Btn color="bg-violet-600" onClick={() => up((c) => E.logLine({ ...c, night: !E.isNight(c) }, E.isNight(c) ? '☀️ Τέλος νυχτερινής λειτουργίας' : '🌙 Νυχτερινή λειτουργία (σιωπηλή TV)'))}>{E.isNight(cg) ? '☀️ Κλείσιμο νύχτας / πρωινό recap' : '🌙 Νυχτερινή λειτουργία'}</Btn>
            <Btn onClick={() => up((c) => players.reduce((acc, p) => E.setState(acc, p.id, { outfit: 'pajamas' }), E.logLine(c, `👘 ${MOVIE_TV.pajamas.title}`)))}>👘 Πέρασμα στις πιτζάμες</Btn>
          </div>
          <p className="text-xs opacity-70">Μόνο ανάμεσα σε όσες δέχτηκαν τη νυχτερινή επιδρομή: {nightOk.map((p) => p.name).join(', ') || 'καμία'}.</p>
          <div className="flex flex-wrap gap-2">
            <PlayerSelect value={nightTarget} onChange={setNightTarget} list={nightOk.filter((p) => E.canRemove(E.statsOf(cg, p.id).state, 'sockL') || E.canRemove(E.statsOf(cg, p.id).state, 'sockR') || E.statsOf(cg, p.id).state.sockL === 'on')} label="Στόχος (έχει κάλτσα)" />
            <PlayerSelect value={nightExec} onChange={setNightExec} list={nightOk.filter((p) => p.id !== nightTarget)} label="Εκτελέστρια" />
            <Btn color="bg-amber-500" onClick={() => { const pool = nightOk.filter((p) => E.statsOf(cg, p.id).state.sockL === 'on' || E.statsOf(cg, p.id).state.sockR === 'on'); const pick = pool[Math.floor(Math.random() * pool.length)]; if (pick) setNightTarget(pick.id); }}>🎲 Κλήρωση στόχου</Btn>
            <Btn color="bg-violet-600" disabled={!nightTarget || !nightExec || !!trialLive} onClick={() => startTrial('nightsock', nightTarget, [nightExec])}>🧦 Έναρξη νυχτερινού γύρου</Btn>
          </div>
          {TrialBox}
          <p className="text-xs opacity-60">Επιτυχία: εκτελέστρια +4 & +2 Λεία · στόχος −2 & +1 Wanted · η κάλτσα σημειώνεται «Βγαλμένη στον ύπνο». Μία κάλτσα ανά απόπειρα.</p>
          <MissionPanel ctx={ctx} pool={MOVIE_MISSIONS} title="📲 Κρυφές νυχτερινές αποστολές" onSuccess={(_m, pid) => up((c) => E.applyDelta(c, pid, { points: 3 }))} onFail={(_m, pid) => up((c) => E.applyDelta(c, pid, { points: -1 }, { penalty: true }))} />
        </Panel>
      )}

      {screen === 5 && (
        <Panel title="👑 Σκορ, Λεία, Tokens, Καταζητούμενη & Μεγάλο Δώρο" accent="gold">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-xs opacity-60"><th>#</th><th>Παίκτρια</th><th>Σκορ</th><th>Πόντοι</th><th>Λεία</th><th>Tokens</th><th>Wanted</th><th>Ζώνες</th></tr></thead>
            <tbody>{rank.map((p, i) => {
              const s = p.stats;
              const b = (delta, label) => <button type="button" onClick={() => up((c) => E.logLine(E.applyDelta(c, p.id, delta), `✎ ${p.name}: ${fmt(delta) || label}`))} className="rounded-md bg-white/10 px-1.5 text-xs">{label}</button>;
              return (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="py-1.5 pr-2">{i + 1}</td><td className="pr-2 font-semibold">{p.name}</td><td className="pr-2 font-bold text-[#E8C26B]">{p.score}</td>
                  <td className="pr-2 whitespace-nowrap">{b({ points: -1 }, '−')} {s.points} {b({ points: 1 }, '+')}</td>
                  <td className="pr-2 whitespace-nowrap">{b({ loot: -1 }, '−')} {s.loot} {b({ loot: 1 }, '+')}</td>
                  <td className="pr-2 whitespace-nowrap">{b({ tokens: -1 }, '−')} {s.tokens} {b({ tokens: 1 }, '+')}</td>
                  <td className="pr-2 whitespace-nowrap">{b({ wanted: -1 }, '−')} <span title={WANTED_LEVELS[s.wanted].label}>{s.wanted}</span> {b({ wanted: 1 }, '+')}</td>
                  <td className="whitespace-nowrap">{b({ zones: -1 }, '−')} {s.zones} {b({ zones: 1 }, '+')}</td>
                </tr>
              );
            })}</tbody></table></div>
          <p className="text-xs opacity-60">Τελικό Σκορ = Πόντοι + Λεία×2 + Ζώνες Βίλας×3 + αχρησιμοποίητα Tokens + μπόνους φινάλε · Wanted 5 στο φινάλε: −4.</p>
          <details className="rounded-2xl bg-white/5 p-3 text-sm"><summary className="cursor-pointer font-semibold">🧾 Μητρώο κατάστασης παίκτριας (live)</summary>
            <div className="mt-2 space-y-2">{players.map((p) => {
              const s = E.statsOf(cg, p.id).state;
              return (
                <div key={p.id} className="space-y-1 rounded-xl bg-black/30 p-2">
                  <div className="font-semibold">{p.name}{s.hands === 'hogtie' ? ' · 🔒 Συνδυαστικό Δέσιμο Hogtie' : ''}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(STATE_OPTIONS).map((k) => (
                      <label key={k} className="text-xs">{STATE_LABELS[k]}<select className="ui-input ml-1 text-xs" value={s[k]} onChange={(e) => up((c) => E.setState(c, p.id, { [k]: e.target.value }))}>{STATE_OPTIONS[k].map((v) => <option key={v} value={v}>{VALUE_LABELS[v]}</option>)}</select></label>
                    ))}
                    <label className="text-xs"><input type="checkbox" checked={!!s.mask} onChange={(e) => up((c) => E.setState(c, p.id, { mask: e.target.checked }))} /> Μάσκα ύπνου</label>
                  </div>
                </div>
              );
            })}</div>
          </details>
          <div className="space-y-2 rounded-2xl bg-[#2A2112] p-3">
            <div className="font-semibold">🎁 Τελική κρίση & Μεγάλο Δώρο</div>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => up((c) => E.openVote({ ...c, card: { id: 'partyvote', at: Date.now() } }, { kind: 'final', q: 'Η Ψήφος της Παρέας', cardId: 'partyvote' }))}>🗳️ Ψήφος της Παρέας (+5/+3)</Btn>
              <Btn onClick={() => up((c) => E.openVote({ ...c, card: { id: 'lastrisk', at: Date.now() } }, { kind: 'risk', q: 'Τελευταίο Ρίσκο', cardId: 'lastrisk' }))}>🎲 Τελευταίο Ρίσκο (Top 3)</Btn>
              <Btn color="bg-amber-500" disabled={cg.finalApplied} onClick={() => up((c) => E.logLine(E.applyFinalVotes(c), '🗳️ Εφαρμόστηκε η Ψήφος της Παρέας'))}>✓ Εφαρμογή ψήφου παρέας</Btn>
            </div>
            <div className="text-xs opacity-70">Ψήφοι παρέας: {Object.keys(cg.finalVotes || {}).length}/{players.length}{cg.finalTally ? ` · ${cg.finalTally.map(([k, n]) => `${names[k]} ${n}`).join(' · ')}` : ''}</div>
            {Object.entries(cg.risk || {}).filter(([, v]) => v === 'risk').map(([pid]) => (
              <div key={pid} className="flex flex-wrap items-center gap-2 text-sm"><span>🎲 {nameOf(pid)} ρισκάρει ±6</span>
                {(cg.riskDone || {})[pid] ? <b>{cg.riskDone[pid] === 'win' ? '+6' : '−6'}</b> : <><Btn color="bg-emerald-600" onClick={() => up((c) => E.resolveRisk(c, pid, true))}>+6</Btn><Btn color="bg-red-600" onClick={() => up((c) => E.resolveRisk(c, pid, false))}>−6</Btn></>}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Btn color="bg-amber-500" disabled={status === 'finale'} onClick={() => up((c) => E.toFinale(c))}>👑 Τελετή νικήτριας στην TV</Btn>
              <Btn color="bg-emerald-600" disabled={status !== 'finale'} onClick={() => { const w = E.ranking(cg, players, { final: true })[0]; setMg({ movieWinner: w?.id, villaQueen: w?.id }); log(`👑 Μεγάλη νικήτρια: ${w?.name || '—'}`); onFinish(); }}>■ Τέλος & αρχειοθέτηση</Btn>
            </div>
          </div>
        </Panel>
      )}

      {screen === 7 && <MovieGamesTablet ctx={ctx} cg={cg} up={up} players={players} allowed={allowed} />}
      {screen === 8 && <MovieBoardTablet ctx={ctx} cg={cg} up={up} players={players} allowed={allowed} startTrial={startTrial} sendCard={sendCard} setScreen={setScreen} />}

      {screen === 6 && (
        <Panel title="🗄️ Admin, Backup & Αρχείο Στατιστικών" accent="gold">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => { const { json } = E.exportCampaign(cg, players); download(`deal-tainia-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json'); }}>⬇ Εξαγωγή JSON</Btn>
            <Btn onClick={() => { const { csv } = E.exportCampaign(cg, players); download(`deal-tainia-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8'); }}>⬇ Εξαγωγή CSV</Btn>
            <Btn onClick={() => up((c) => E.checkpoint(c, players, 'Χειροκίνητο σημείο'))}>📌 Σημείο επαναφοράς τώρα</Btn>
          </div>
          <div className="space-y-1 text-sm">
            <div className="font-semibold">Σημεία επαναφοράς (αυτόματα σε κάθε Έναρξη/Κλείσιμο πράξης)</div>
            {(cg.checkpoints || []).length === 0 && <div className="opacity-60">Κανένα ακόμα.</div>}
            {(cg.checkpoints || []).map((cp) => (
              <div key={cp.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
                <span>{new Date(cp.at).toLocaleString('el-GR')} · Πράξη {cp.act + 1} · {cp.label} · {cp.top.map((t) => `${t.name} ${t.score}`).join(', ')}</span>
                <Btn onClick={() => { if (window.confirm('ΕΠΑΝΑΦΟΡΑ σε αυτό το σημείο; Οι μεταγενέστερες αλλαγές χάνονται.')) up((c) => E.restoreCheckpoint(c, cp.id)); }}>↩ Επαναφορά</Btn>
              </div>
            ))}
          </div>
          <details className="text-sm"><summary className="cursor-pointer font-semibold">Χρονολόγιο ({(cg.log || []).length})</summary>
            <div className="mt-2 max-h-72 space-y-0.5 overflow-auto text-xs opacity-80">{(cg.log || []).map((l) => <div key={l.t + l.text}>{new Date(l.t).toLocaleTimeString('el-GR')} · {l.text}</div>)}</div>
          </details>
        </Panel>
      )}
    </div>
  );
}
