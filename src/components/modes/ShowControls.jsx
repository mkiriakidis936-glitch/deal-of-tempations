import React, { useEffect, useRef, useState } from 'react';
import * as E from '@/lib/boardEngine';
import { base44 } from '@/api/base44Client';
import {
  computeAwards, highlights, checkRecords, DOSSIER_QUESTIONS, DIRECTOR_CUES,
  BETRAY_SHARE, BET_REWARD, DOSSIER_REWARD,
} from '@/lib/showEngine';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { useTick } from '@/lib/modeKit';

const RECORDS_KEY = 'all_time_records';
const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('el-GR')}€`;

async function loadRecords() {
  const { items } = await base44.entities.AppSetting.filter({ key: RECORDS_KEY }, { limit: 1 });
  return items?.[0] || null;
}
async function saveRecords(record, value) {
  if (record?.id) await base44.entities.AppSetting.update(record.id, { value });
  else await base44.entities.AppSetting.create({ key: RECORDS_KEY, value });
}

// Tablet: όλα τα «εργαλεία εκπομπής» του PAJAMA HEIST πάνω στο ίδιο lounge state.
export default function ShowControls({ state, lg, players, RULES, commit, log, nameOf }) {
  const [busy, setBusy] = useState(false);
  useTick(true, E.isGolden(lg) ? 1000 : 15000);
  const lgRef = useRef(lg);
  lgRef.current = lg;
  const now = Date.now();

  // 1) Στήσιμο μία φορά: ποια κρατά την Κάρτα Προδοσίας, ποιες 3 ερωτήσεις έχει ο Φάκελος υπόπτου.
  useEffect(() => {
    if (!players.length || lg.showSetup) return;
    const shuffled = E.shuffleWith(Math.random, DOSSIER_QUESTIONS.map((_, i) => i));
    const betrayCard = players.length >= 3 ? players[Math.floor(Math.random() * players.length)].id : null;
    commit({ ...lg, showSetup: true, betrayCard, dossierSet: shuffled.slice(0, 3) });
  }, [players.length, !!lg.showSetup]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2) Γραμματοκιβώτιο: ό,τι στέλνουν τα κινητά (κάθε παίκτρια έχει δική της θέση, δεν χάνεται τίποτα).
  useEffect(() => {
    const inbox = state.loungeInbox || {};
    let next = lgRef.current;
    let changed = false;
    const texts = [];
    const entries = Object.entries(inbox).flatMap(([pid, list]) => (Array.isArray(list) ? list : [list]).filter(Boolean).map((entry) => [pid, entry]));
    entries.sort((a, b) => a[1].at - b[1].at);
    for (const [pid, entry] of entries) {
      if (!entry?.at || entry.at <= (next.inboxSeen?.[pid] || 0)) continue;
      changed = true;
      next = { ...next, inboxSeen: { ...(next.inboxSeen || {}), [pid]: entry.at } };
      if (entry.type === 'news' && !next.newsUsed?.[pid]) {
        next = { ...next, news: [{ key: uid(), pid, text: entry.text, at: entry.at }, ...(next.news || [])].slice(0, 30), newsUsed: { ...(next.newsUsed || {}), [pid]: true } };
        texts.push(`📰 Breaking από ${nameOf(pid)}: ${entry.text}`);
      }
      if (entry.type === 'confess') next = { ...next, anonBox: [{ key: uid(), text: entry.text, at: entry.at }, ...(next.anonBox || [])].slice(0, 50) };
      if (entry.type === 'bet' && !next.firstArrest) next = { ...next, bets: { ...(next.bets || {}), [pid]: entry.target } };
      if (entry.type === 'dossier') next = { ...next, dossier: { ...(next.dossier || {}), [pid]: entry.answers } };
      if (entry.type === 'guess' && next.dossierQ && !next.dossierQ.revealed && entry.qid === next.dossierQ.id) {
        const guesses = { ...(next.dossierGuesses || {}), [pid]: entry.target };
        next = { ...next, dossierGuesses: guesses, dossierQ: { ...next.dossierQ, guesses: Object.keys(guesses).length } };
      }
      if (entry.type === 'betray' && next.betrayCard === pid && !next.betrayUsed) {
        const amount = Math.floor(E.statOf(next, RULES, entry.target).loot * BETRAY_SHARE);
        next = E.updateStat(next, RULES, entry.target, (s) => ({ loot: s.loot - amount }));
        next = E.updateStat(next, RULES, pid, (s) => ({ loot: s.loot + amount }));
        next = { ...next, betrayUsed: true, betrayals: [...(next.betrayals || []), { from: pid, to: entry.target, amount, at: entry.at }] };
      }
    }
    if (changed) commit(next, texts.join(' · ') || undefined);
  }, [JSON.stringify(state.loungeInbox || {})]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3) Στοίχημα έναρξης: πληρώνεται με την πρώτη σύλληψη.
  useEffect(() => {
    if (!lg.firstArrest || lg.betsPaid) return;
    const winners = Object.entries(lg.bets || {}).filter(([, target]) => target === lg.firstArrest.pid).map(([pid]) => pid);
    let next = { ...lg, betsPaid: true, betWinners: winners };
    for (const pid of winners) next = E.updateStat(next, RULES, pid, (s) => ({ loot: s.loot + BET_REWARD }));
    commit(next, winners.length ? `🎯 Στοίχημα έναρξης: ${winners.map(nameOf).join(', ')} το μάντεψαν (+${money(BET_REWARD)})` : '🎯 Στοίχημα έναρξης: καμία δεν το μάντεψε');
  }, [lg.firstArrest?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch, text) => commit({ ...lgRef.current, ...patch }, text);
  const golden = E.isGolden(lg, now);

  function startGolden() {
    set({ golden: { at: Date.now(), until: Date.now() + 60000 } }, '✨ ΧΡΥΣΟ ΛΕΠΤΟ: για 60″ κάθε λεία μετράει διπλή!');
  }

  function pickDossier() {
    const used = lg.dossierUsed || {};
    const options = [];
    for (const [pid, answers] of Object.entries(lg.dossier || {})) {
      (answers || []).forEach((text, i) => { if (!used[`${pid}:${i}`] && text) options.push({ pid, i, text }); });
    }
    if (!options.length) return;
    const pick = options[Math.floor(Math.random() * options.length)];
    const question = DOSSIER_QUESTIONS[(lg.dossierSet || [0, 1, 2])[pick.i]] || '';
    set({ dossierQ: { id: `q${uid()}`, owner: pick.pid, question, text: pick.text, at: Date.now(), guesses: 0 }, dossierGuesses: {}, dossierUsed: { ...used, [`${pick.pid}:${pick.i}`]: true } }, '🗂️ Φάκελος υπόπτου: ποια το είπε;');
  }

  function revealDossier() {
    const q = lg.dossierQ;
    if (!q) return;
    const winners = Object.entries(lg.dossierGuesses || {}).filter(([, target]) => target === q.owner).map(([pid]) => pid);
    let next = { ...lg, dossierQ: { ...q, revealed: true, winners } };
    for (const pid of winners) next = E.updateStat(next, RULES, pid, (s) => ({ loot: s.loot + DOSSIER_REWARD }));
    commit(next, `🗂️ Το είπε η ${nameOf(q.owner)}${winners.length ? ` · σωστές: ${winners.map(nameOf).join(', ')} (+${money(DOSSIER_REWARD)})` : ''}`);
  }

  async function startCeremony() {
    setBusy(true);
    const base = { ...lgRef.current, betrayRevealed: true };
    let broken = [];
    try {
      const record = await loadRecords();
      const result = checkRecords(record?.value || {}, base, players);
      broken = result.broken;
      if (broken.length) await saveRecords(record, result.records);
    } catch { /* τα ρεκόρ είναι προαιρετικά */ }
    commit({ ...base, ceremony: { stage: 'awards', step: 0, revealed: false, awards: computeAwards(base, players), highlights: highlights(base, players), records: broken, at: Date.now() } }, '🏆 Ξεκινά η Τελετή Απονομής');
    setBusy(false);
  }

  function ceremonyNext() {
    const c = lg.ceremony;
    if (!c) return;
    if (c.stage === 'awards' && !c.revealed) { set({ ceremony: { ...c, revealed: true, at: Date.now() } }); return; }
    if (c.stage === 'awards' && c.step < c.awards.length - 1) { set({ ceremony: { ...c, step: c.step + 1, revealed: false, at: Date.now() } }); return; }
    const order = ['awards', 'highlights', 'records', 'done'];
    let stage = order[order.indexOf(c.stage) + 1] || 'done';
    if (stage === 'records' && !c.records?.length) stage = 'done';
    set({ ceremony: { ...c, stage, at: Date.now() } });
  }

  // Υπενθυμίσεις σκηνοθέτη με βάση τον χρόνο από την έναρξη.
  const minutes = state.gameStartedAt ? (now - state.gameStartedAt) / 60000 : 0;
  const cue = DIRECTOR_CUES.find((c) => minutes >= c.at && !(lg.cuesDone || []).includes(c.id));
  const dossierReady = Object.keys(lg.dossier || {}).length;
  const ceremony = lg.ceremony;
  const award = ceremony?.awards?.[ceremony.step];

  return (
    <>
      {cue && (
        <Panel accent="#E8C26B">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="ui-eyebrow">🎬 Σκηνοθέτης · {Math.floor(minutes)}′</div><div className="text-[17px] font-semibold">{cue.text}</div></div>
            <Btn onClick={() => set({ cuesDone: [...(lg.cuesDone || []), cue.id] })}>Εντάξει</Btn>
          </div>
        </Panel>
      )}

      {ceremony && ceremony.stage !== 'done' && (
        <Panel title="🏆 Τελετή απονομής" accent="#E8C26B">
          {ceremony.stage === 'awards' && award && (
            <div className="text-center">
              <div className="text-3xl">{award.icon}</div>
              <div className="text-[19px] font-semibold">{award.title}</div>
              <div className="ui-subtitle">{ceremony.revealed ? `${award.name} — ${award.line}` : 'Στην TV: «Και το βραβείο πάει σε…»'}</div>
              <div className="ui-subtitle">Βραβείο {ceremony.step + 1}/{ceremony.awards.length}</div>
            </div>
          )}
          {ceremony.stage === 'highlights' && <div className="ui-subtitle text-center">Στην TV: οι μεγάλες στιγμές της βραδιάς</div>}
          {ceremony.stage === 'records' && <div className="ui-subtitle text-center">Στην TV: {ceremony.records.length} νέα ρεκόρ!</div>}
          <Btn color="bg-amber-600" className="w-full" onClick={ceremonyNext}>
            {ceremony.stage === 'awards' && !ceremony.revealed ? '✉️ Αποκάλυψη' : 'Επόμενο ›'}
          </Btn>
        </Panel>
      )}

      <Panel title="🎬 Εκπομπή">
        <div className="flex flex-wrap gap-2">
          <Btn color="bg-amber-600" disabled={golden} onClick={startGolden}>{golden ? `✨ Χρυσό λεπτό · ${Math.ceil((lg.golden.until - now) / 1000)}″` : '✨ Χρυσό λεπτό'}</Btn>
          <Btn onClick={() => set({ weatherAt: Date.now() })}>📊 Δελτίο καιρού</Btn>
          <Btn disabled={!dossierReady || (lg.dossierQ && !lg.dossierQ.revealed)} onClick={pickDossier}>🗂️ Φάκελος υπόπτου ({dossierReady})</Btn>
          {!ceremony && <Btn color="bg-amber-600" disabled={busy} onClick={startCeremony}>🏆 Τελετή απονομής</Btn>}
          {ceremony?.stage === 'done' && <Btn onClick={() => set({ ceremony: null })}>Κλείσιμο τελετής</Btn>}
        </div>

        {lg.dossierQ && !lg.dossierQ.revealed && (
          <div className="ui-card space-y-2" style={{ background: 'var(--ui-surface-2)' }}>
            <div className="ui-eyebrow">Φάκελος υπόπτου · {lg.dossierQ.guesses || 0} μαντεψιές</div>
            <div className="text-[15px]">«{lg.dossierQ.text}» <span className="ui-subtitle">({lg.dossierQ.question})</span></div>
            <div className="ui-subtitle">Μόνο εσύ βλέπεις: το είπε η <b>{nameOf(lg.dossierQ.owner)}</b></div>
            <Btn color="bg-amber-600" onClick={revealDossier}>Αποκάλυψη</Btn>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="ui-card space-y-2" style={{ background: 'var(--ui-surface-2)' }}>
            <div className="ui-eyebrow">📰 Breaking news ({(lg.news || []).length})</div>
            {(lg.news || []).slice(0, 5).map((item) => (
              <div key={item.key || item.id} className="flex items-start justify-between gap-2 text-[14px]">
                <span><b>{nameOf(item.pid)}:</b> {item.text}</span>
                <button type="button" className="ui-btn ui-btn--sm" onClick={() => set({ news: (lg.news || []).filter((n) => n !== item) })}>Αφαίρεση</button>
              </div>
            ))}
            {!(lg.news || []).length && <div className="ui-subtitle text-[13px]">Κάθε παίκτρια μπορεί να στείλει ένα από το κινητό.</div>}
          </div>
          <div className="ui-card space-y-2" style={{ background: 'var(--ui-surface-2)' }}>
            <div className="ui-eyebrow">💌 Εξομολογητήριο · ανώνυμο ({(lg.anonBox || []).length})</div>
            {(lg.anonBox || []).slice(0, 5).map((item) => (
              <div key={item.key || item.id} className="space-y-1 text-[14px]">
                <div>«{item.text}»</div>
                <div className="ui-btn-group-sm flex gap-2">
                  <Btn color="bg-amber-600" onClick={() => set({ onAir: { text: item.text, at: Date.now(), until: Date.now() + 15000 }, anonBox: (lg.anonBox || []).filter((c) => c !== item) })}>Στην TV</Btn>
                  <Btn onClick={() => set({ anonBox: (lg.anonBox || []).filter((c) => c !== item) })}>Διαγραφή</Btn>
                </div>
              </div>
            ))}
            {!(lg.anonBox || []).length && <div className="ui-subtitle text-[13px]">Ό,τι στέλνουν βγαίνει στην TV μόνο αν το εγκρίνεις.</div>}
          </div>
        </div>

        <div className="ui-subtitle text-[13px]">
          🗡️ Κάρτα προδοσίας: {lg.betrayCard ? `${nameOf(lg.betrayCard)} ${lg.betrayUsed ? '(χρησιμοποιήθηκε)' : '(δεν την έχει παίξει)'}` : '—'}
          {' · '}🎯 Στοιχήματα: {Object.keys(lg.bets || {}).length}{lg.betsPaid ? ' (πληρώθηκαν)' : ''}
          {' · '}🗂️ Φάκελοι: {dossierReady}/{players.length}
        </div>
      </Panel>
    </>
  );
}
