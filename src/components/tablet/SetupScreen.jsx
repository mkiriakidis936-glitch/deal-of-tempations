import React, { useState, useEffect, useRef } from 'react';
import { appApi, request } from '@/api/apiClient';
import { GAME_MODES, FOOTWEAR_LEVELS, TOENAIL_PERKS } from '@/data/gameConfig';
import { createInitialState, generateSessionCode } from '@/lib/gameLogic';
import { isNewMode, modeMeta, MODE_MEDIA_SECTIONS } from '@/data/modes/modeRegistry';
import { buildRoster, modeCounts, nameKey } from '@/lib/intakeRoster';
import { MODE_COVERS, MODE_MEDIA, videosFor } from '@/data/brandArt';

const SHOE_TO_LEVEL = { boots: 3, sneakers: 2, sandals: 1, barefoot: 0 };
const SHOE_LABEL = { boots: 'Μπότες', sneakers: 'Αθλητικά', sandals: 'Σανδάλια', barefoot: 'Ξυπόλυτη' };
const playerLimits = (modeId) => {
  const meta = isNewMode(modeId) ? modeMeta(modeId) : null;
  if (meta) return { min: meta.min, max: meta.max };
  return modeId === 'arrest_heist' ? { min: 4, max: 10 } : { min: 2, max: 6 };
};

const ACTIVE_MODE_IDS = new Set(GAME_MODES.map((m) => m.id));

// Στοιχεία από τη φόρμα που χρειάζεται το παιχνίδι.
function playerFromRow(row, index) {
  const i = row.item || {};
  return {
    name: row.name,
    footwearLevel: SHOE_TO_LEVEL[i.shoeType] ?? 2,
    toenailPerk: TOENAIL_PERKS[index % TOENAIL_PERKS.length].id,
    slipperType: i.slipperType || '', nailColor: i.nailColor || 'Pink', pajamaStyle: i.pajamaStyle || '',
    bringsOwnSlippers: i.bringsOwnSlippers ?? true, hasFlipFlops: i.hasFlipFlops ?? true,
    ...(i.vipProfile ? { vipProfile: i.vipProfile } : {}),
    ...(i.movieProfile ? { movieProfile: i.movieProfile } : {}),
    formInfo: [i.shoeType && `👟 ${SHOE_LABEL[i.shoeType] || i.shoeType}`, i.nailColor && `💅 ${i.nailColor}`, i.slipperType && `🩴 ${i.slipperType}`, i.alcoholFree === true && '🚫🍸 χωρίς αλκοόλ', i.boundaries && `⚠️ ${String(i.boundaries).slice(0, 60)}`].filter(Boolean),
  };
}


export default function SetupScreen({ onStart }) {
  const eventCode = (new URLSearchParams(window.location.search).get('event') || new URLSearchParams(window.location.search).get('sessionCode') || new URLSearchParams(window.location.search).get('code') || '').trim().toUpperCase();
  const [mode, setMode] = useState('classic');
  const [dotEvents, setDotEvents] = useState([]);
  const [selectedDotEventId, setSelectedDotEventId] = useState('');
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const [safeWord, setSafeWord] = useState('');
  const [safeWordConfirmed, setSafeWordConfirmed] = useState(false);
  const [players, setPlayers] = useState([
    { name: '', footwearLevel: 2, toenailPerk: 'red' },
    { name: '', footwearLevel: 2, toenailPerk: 'pink' },
  ]);
  const [pendingIntakes, setPendingIntakes] = useState([]);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [roster, setRoster] = useState([]);

  const loadIntakes = async () => {
    try {
      const [classicRes, pajamaRes, eventRes, vipRes] = await Promise.all([
        appApi.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 500 }),
        appApi.entities.PajamaIntake.filter({}, { sort: '-created_date', limit: 500 }),
        appApi.entities.DotEvent.filter({}, { sort: '-created_date', limit: 200 }),
        appApi.entities.VIPInvitationSubmission.filter({}, { sort: '-created_date', limit: 500 }),
      ]);
      const loadedEvents = eventRes.items || [];
      setDotEvents(loadedEvents);
      const selectedEvent = loadedEvents.find((item) => item.id === selectedDotEventId);
      const scopeToEvent = (items) => (items || []).filter((item) => selectedDotEventId
        ? item.dotEventId === selectedDotEventId || item.roomCode === selectedEvent?.room_code || item.sessionCode === selectedEvent?.room_code
        : eventCode ? item.sessionCode === eventCode || item.roomCode === eventCode : !item.sessionCode && !item.roomCode && !item.dotEventId);
      const allPajama = scopeToEvent(pajamaRes.items);
      const pending = [
        ...scopeToEvent(classicRes.items).filter((item) => item.approved !== true).map((item) => ({ ...item, sourceEntity: 'PlayerIntake', modeIds: item.preferredModes?.length ? item.preferredModes : [item.vipGameMode || item.gameMode || 'classic'] })),
        ...allPajama.filter((item) => item.approved !== true).map((item) => ({ ...item, sourceEntity: 'PajamaIntake', modeIds: item.preferredModes?.length ? item.preferredModes : ['pajama'] })),
        ...scopeToEvent(vipRes.items).filter((item) => item.approved !== true && item.approvalStatus !== 'rejected').map((item) => ({ ...item, sourceEntity: 'VIPInvitationSubmission', modeIds: [item.gameMode || 'classic'] })),
      ].sort((a, b) => new Date(b.created_date || b.submittedAt || 0) - new Date(a.created_date || a.submittedAt || 0));
      setPendingIntakes(pending);
      const builtRoster = buildRoster({ player: scopeToEvent(classicRes.items), pajama: allPajama, vip: scopeToEvent(vipRes.items).filter((item) => item.approved !== true) });
      setRoster(builtRoster);

      seedPlayers(modeRef.current, builtRoster, { keepTyped: true });
    } catch (e) {
      console.error('Intake load error', e);
    }
  };

  useEffect(() => {
    loadIntakes();
  }, [selectedDotEventId]);

  useEffect(() => {
    const refresh = () => loadIntakes();
    const offPlayers = appApi.entities.PlayerIntake.subscribe(refresh);
    const offPajama = appApi.entities.PajamaIntake.subscribe(refresh);
    const offEvents = appApi.entities.DotEvent.subscribe(refresh);
    const offVip = appApi.entities.VIPInvitationSubmission.subscribe(refresh);
    return () => { offPlayers?.(); offPajama?.(); offEvents?.(); offVip?.(); };
  }, [selectedDotEventId]);



  const selectedMode = GAME_MODES.find((m) => m.id === mode) || GAME_MODES[0];
  const newMode = isNewMode(mode) ? modeMeta(mode) : null;
  const { min: minPlayers, max: maxPlayers } = playerLimits(mode);
  const counts = modeCounts(roster);
  const countFor = (id) => counts.find((row) => row.id === id) || { approved: [], pending: [] };
  const totalFilled = new Set(roster.map((row) => nameKey(row.name))).size;
  const totalApproved = new Set(roster.filter((row) => row.approved).map((row) => nameKey(row.name))).size;
  const isEngine = selectedMode.kind === 'engine';

  // Γεμίζει τις παίκτριες με τις εγκεκριμένες του mode, μαζί με τα στοιχεία της φόρμας τους.
  function seedPlayers(modeId, rows = roster, { keepTyped = false } = {}) {
    const { min, max } = playerLimits(modeId);
    const approvedRows = [];
    const seen = new Set();
    rows.filter((row) => row.approved && row.modes.includes(modeId)).forEach((row) => {
      if (!seen.has(nameKey(row.name))) { seen.add(nameKey(row.name)); approvedRows.push(row); }
    });
    setPlayers((previous) => {
      const typed = keepTyped ? previous.filter((p) => p.name.trim() && !seen.has(nameKey(p.name))) : [];
      const next = [...approvedRows.map(playerFromRow), ...typed].slice(0, max);
      while (next.length < min) next.push({ name: '', footwearLevel: 2, toenailPerk: TOENAIL_PERKS[next.length % TOENAIL_PERKS.length].id });
      return next;
    });
  }

  function handleModeChange(m) {
    modeRef.current = m.id;
    setMode(m.id);
    seedPlayers(m.id);
  }

  function addPlayer(name = '') {
    if (players.length >= maxPlayers) return;
    const emptyIndex = players.findIndex((p) => !p.name.trim());
    const row = name ? roster.find((r) => nameKey(r.name) === nameKey(name) && r.modes.includes(mode)) : null;
    const entry = row ? playerFromRow(row, players.length) : { name, footwearLevel: 2, toenailPerk: TOENAIL_PERKS[players.length % TOENAIL_PERKS.length].id };
    if (name && emptyIndex >= 0) setPlayers(players.map((p, i) => (i === emptyIndex ? entry : p)));
    else setPlayers([...players, entry]);
  }

  function removePlayer(idx) {
    if (players.length > minPlayers) setPlayers(players.filter((_, i) => i !== idx));
    else setPlayers(players.map((p, i) => (i === idx ? { name: '', footwearLevel: 2, toenailPerk: p.toenailPerk } : p)));
  }

  function updatePlayer(idx, field, value) {
    setPlayers(players.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }

  async function approveIntake(item) {
    setApprovalMessage('');
    try {
      await request('POST', `/api/entities/intake-approvals/${item.sourceEntity}/${encodeURIComponent(item.id)}`, {});
      setApprovalMessage(`Η συμμετοχή της ${item.name || 'παίκτριας'} εγκρίθηκε.`);
      await loadIntakes();
    } catch (error) {
      setApprovalMessage(error.message || 'Η έγκριση απέτυχε.');
    }
  }

  const named = players.filter((p) => p.name.trim());
  const canStart = named.length >= minPlayers && safeWord.trim().length >= 2 && safeWordConfirmed;

  async function handleStart() {
    if (!canStart) return;
    // Η διάρκεια ακολουθεί το mode (ψηφιακά) — δεν εμφανίζεται πλέον στο Setup.
    const durationMinutes = newMode?.minutes || 300;
    const valid = named.map(({ formInfo: _formInfo, ...player }) => player);
    const state = { ...createInitialState(mode, 'standard', valid), gameDurationMinutes: durationMinutes, gameStartedAt: Date.now(), gamePausedMs: 0, gamePausedAt: null, safetyProfile: { safeWord: safeWord.trim(), confirmedAt: Date.now() } };
    await onStart({ sessionCode: generateSessionCode(), dotEventId: selectedDotEventId, mode, duration: String(durationMinutes), intensity: 'standard', stage: state.stage, state });
  }

  const media = MODE_MEDIA[mode] || {};
  const heroSrc = media.hero || media.cover || MODE_COVERS[`modeCover_${mode}`] || '';
  const sections = media.sections?.length ? media.sections : (MODE_MEDIA_SECTIONS[mode] || []);
  const modeVideos = [media.trailer, ...videosFor(mode)].filter(Boolean);
  const current = countFor(mode);
  const notInGame = current.approved.filter((name) => !named.some((p) => nameKey(p.name) === nameKey(name)));
  const step = !named.length || named.length < minPlayers ? 2 : !canStart ? 3 : 4;

  const ModeCard = ({ m }) => {
    const c = countFor(m.id);
    const on = mode === m.id;
    const cover = MODE_MEDIA[m.id]?.cover || MODE_COVERS[`modeCover_${m.id}`];
    return (
      <button type="button" onClick={() => handleModeChange(m)} aria-pressed={on}
        className={`dot-lobby-card group relative overflow-hidden text-left ${on ? 'is-on' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2112] to-black" />
        {cover && <img src={cover} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-4">
          <div className="text-2xl">{m.icon}</div>
          <div className="mt-1 text-lg font-bold leading-tight text-white">{m.name}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
            <span className="rounded-full bg-[#30D158]/20 px-2 py-0.5 text-[#7BE495]">✓ {c.approved.length}</span>
            {c.pending.length > 0 && <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">⏳ {c.pending.length}</span>}
          </div>
        </div>
        {on && <div className="absolute right-3 top-3 rounded-full bg-[#E8C26B] px-2.5 py-1 text-[11px] font-black text-black">ΕΠΙΛΟΓΗ</div>}
      </button>
    );
  };

  const StepTitle = ({ n, title, done }) => (
    <div className="mb-3 flex items-center gap-3">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${done ? 'bg-[#30D158] text-black' : 'bg-[#E8C26B] text-black'}`}>{done ? '✓' : n}</span>
      <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
    </div>
  );

  return (
    <div className="dot-lobby min-h-screen bg-black pb-36 text-[#F5F1E8]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-3">
          <div className="mr-auto min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E8C26B]">Deal of Temptation</div>
            <div className="text-lg font-bold">Νέα βραδιά</div>
          </div>
          <select value={selectedDotEventId} onChange={(event) => setSelectedDotEventId(event.target.value)} className="h-11 min-w-0 max-w-[40vw] rounded-full border border-white/15 bg-[#1C1C1E] px-3 text-sm sm:max-w-none sm:px-4" aria-label="Event">
            <option value="">Χωρίς Event</option>
            {dotEvents.filter((event) => !['closing', 'completed'].includes(event.status)).map((event) => <option key={event.id} value={event.id}>{event.title} · {event.room_code}</option>)}
          </select>
          <button type="button" onClick={loadIntakes} className="h-11 shrink-0 rounded-full bg-[#2C2C2E] px-3 text-sm font-semibold sm:px-4" aria-label="Ανανέωση φορμών">↻<span className="hidden sm:inline"> Φόρμες</span></button>
        </div>
        <ol className="mx-auto mt-3 grid max-w-6xl grid-cols-4 gap-2 text-[11px] font-semibold" aria-label="Βήματα">
          {['Παιχνίδι', 'Παίκτριες', 'Ασφάλεια', 'Έναρξη'].map((label, i) => (
            <li key={label} className={`truncate rounded-full px-2 py-1.5 text-center sm:px-3 ${i + 1 < step ? 'bg-[#30D158]/20 text-[#7BE495]' : i + 1 === step ? 'bg-[#E8C26B] text-black' : 'bg-white/5 text-white/45'}`}><span className="hidden sm:inline">{i + 1}. </span>{label}</li>
          ))}
        </ol>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-5">
        <section className="grid grid-cols-3 gap-3" aria-label="Σύνοψη φορμών">
          {[{ label: 'Συμπλήρωσαν φόρμα', value: totalFilled }, { label: 'Εγκεκριμένες', value: totalApproved }, { label: 'Σε αναμονή', value: pendingIntakes.length }].map((item) => (
            <div key={item.label} className="rounded-3xl bg-[#1C1C1E] p-4"><div className="text-3xl font-bold tabular-nums text-white">{item.value}</div><div className="text-xs text-white/55">{item.label}</div></div>
          ))}
        </section>

        {pendingIntakes.length > 0 && (
          <section className="rounded-3xl border border-[#E8C26B]/40 bg-[#17140C] p-4">
            <div className="mb-2 flex items-center justify-between"><h2 className="text-base font-bold text-[#F7E3A8]">Αιτήσεις για έγκριση</h2><span className="text-xs text-white/55">{pendingIntakes.length}</span></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {pendingIntakes.map((item) => (
                <div key={`${item.sourceEntity}-${item.id}`} className="flex items-center justify-between gap-2 rounded-2xl bg-black/40 p-3">
                  <div className="min-w-0"><div className="truncate font-semibold">{item.name || item.displayName || 'Χωρίς όνομα'}</div><div className="truncate text-[11px] text-white/55">{item.modeIds.filter((id) => ACTIVE_MODE_IDS.has(id)).map((id) => GAME_MODES.find((entry) => entry.id === id)?.name).join(' · ') || 'Χωρίς ενεργό mode'}</div></div>
                  <button type="button" onClick={() => approveIntake(item)} className="h-10 shrink-0 rounded-full bg-[#30D158] px-4 text-sm font-bold text-black">Έγκριση</button>
                </div>
              ))}
            </div>
          </section>
        )}
        {approvalMessage && <p className="rounded-2xl bg-[#1C1C1E] p-3 text-sm" role="status">{approvalMessage}</p>}

        <section>
          <StepTitle n={1} title="Διάλεξε παιχνίδι" done />
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">🎲 Μηχανές παιχνιδιού</div>
          <div className="grid grid-cols-2 gap-3">{GAME_MODES.filter((m) => m.kind === 'engine').map((m) => <ModeCard key={m.id} m={m} />)}</div>
          <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">📱 Ψηφιακά modes</div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{GAME_MODES.filter((m) => m.kind !== 'engine').map((m) => <ModeCard key={m.id} m={m} />)}</div>
        </section>

        <section className="overflow-hidden rounded-[32px] bg-[#1C1C1E]">
          <div className="relative aspect-[21/8] min-h-[180px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a2c10] to-black" />
            {heroSrc && <img src={heroSrc} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1E] via-black/40 to-transparent" />
            <div className="absolute bottom-0 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E8C26B]">{isEngine ? 'Μηχανή παιχνιδιού' : 'Ψηφιακό mode'} · {minPlayers}–{maxPlayers} παίκτριες</div>
              <div className="mt-1 text-3xl font-bold text-white">{selectedMode.icon} {selectedMode.name}</div>
              <p className="mt-1 max-w-2xl text-sm text-white/70">{selectedMode.desc}</p>
            </div>
          </div>
          {sections.length > 0 && (
            <div className="flex gap-3 overflow-x-auto p-4" aria-label="Ενότητες">
              {sections.map((item, index) => (
                <div key={item.id} className="w-44 shrink-0 overflow-hidden rounded-2xl bg-black/40">
                  {item.image ? <img src={item.image} alt="" className="aspect-video w-full object-cover" /> : <div className="flex aspect-video w-full items-center justify-center bg-white/5 text-2xl font-bold text-white/25">{index + 1}</div>}
                  <div className="p-2 text-xs font-semibold leading-tight">{item.label}</div>
                </div>
              ))}
            </div>
          )}
          {modeVideos.length > 0 && (
            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
              {modeVideos.map((src) => <video key={src} src={`${src}#t=0.1`} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-black" />)}
            </div>
          )}
        </section>

        <section>
          <StepTitle n={2} title={`Παίκτριες · ${named.length}/${maxPlayers}`} done={named.length >= minPlayers} />
          <p className="mb-3 text-sm text-white/60">
            {current.approved.length} εγκεκριμένες για {selectedMode.name}{current.pending.length ? ` · ${current.pending.length} περιμένουν έγκριση` : ''}. Χρειάζονται τουλάχιστον {minPlayers}.
          </p>
          {notInGame.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {notInGame.map((name) => <button key={name} type="button" onClick={() => addPlayer(name)} disabled={named.length >= maxPlayers} className="h-9 rounded-full bg-[#30D158]/15 px-3 text-sm font-semibold text-[#7BE495]">+ {name}</button>)}
            </div>
          )}
          {current.pending.length > 0 && <div className="mb-3 text-xs text-white/45">⏳ Σε αναμονή: {current.pending.join(', ')}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            {players.map((p, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-3xl bg-[#1C1C1E] p-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${p.name.trim() ? 'bg-[#E8C26B] text-black' : 'bg-white/10 text-white/40'}`}>{p.name.trim() ? p.name.trim()[0].toUpperCase() : idx + 1}</div>
                <div className="min-w-0 flex-1 space-y-2">
                  <input type="text" value={p.name} onChange={(e) => updatePlayer(idx, 'name', e.target.value)} placeholder={`Παίκτρια ${idx + 1}`} aria-label={`Όνομα παίκτριας ${idx + 1}`}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-black/40 px-3 font-semibold text-white focus:border-[#E8C26B] focus:outline-none" />
                  {p.formInfo?.length > 0 && <div className="flex flex-wrap gap-1">{p.formInfo.map((info) => <span key={info} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/65">{info}</span>)}</div>}
                  {isEngine && (
                    <div className="grid grid-cols-2 gap-2">
                      <select value={p.footwearLevel} onChange={(e) => updatePlayer(idx, 'footwearLevel', parseInt(e.target.value, 10))} aria-label="Παπούτσι" className="h-10 rounded-xl bg-black/40 px-2 text-xs">
                        {FOOTWEAR_LEVELS.map((f) => <option key={f.level} value={f.level}>{f.icon} {f.label}</option>)}
                      </select>
                      <select value={p.toenailPerk} onChange={(e) => updatePlayer(idx, 'toenailPerk', e.target.value)} aria-label="Δύναμη" className="h-10 rounded-xl bg-black/40 px-2 text-xs">
                        {TOENAIL_PERKS.map((perk) => <option key={perk.id} value={perk.id}>{perk.icon} {perk.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => removePlayer(idx)} aria-label={`Αφαίρεση παίκτριας ${idx + 1}`} className="h-9 w-9 shrink-0 rounded-full bg-white/5 text-white/60">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addPlayer()} disabled={players.length >= maxPlayers} className="mt-3 h-12 w-full rounded-full border border-dashed border-white/20 text-sm font-semibold text-white/70 disabled:opacity-30">+ Προσθήκη παίκτριας</button>
        </section>

        <section className="rounded-3xl bg-[#1C1C1E] p-4">
          <StepTitle n={3} title="Λέξη ασφαλείας" done={safeWord.trim().length >= 2 && safeWordConfirmed} />
          <p className="mb-3 text-sm text-white/60">Μία λέξη που σταματά αμέσως το παιχνίδι για όλες. Το κουμπί ΣΤΟΠ υπάρχει πάντα σε όλες τις οθόνες.</p>
          <input type="text" value={safeWord} onChange={(event) => { setSafeWord(event.target.value); setSafeWordConfirmed(false); }} maxLength={32} placeholder="Κοινή λέξη ασφαλείας" aria-label="Λέξη ασφαλείας"
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 font-semibold text-white focus:border-[#E8C26B] focus:outline-none" />
          <label className="mt-3 flex items-start gap-3 text-sm text-white/75">
            <input type="checkbox" checked={safeWordConfirmed} onChange={(event) => setSafeWordConfirmed(event.target.checked)} className="mt-0.5 h-5 w-5 accent-[#E8C26B]" />
            <span>Η παρέα συμφώνησε στη λέξη και ξέρει ότι οποιαδήποτε μπορεί να σταματήσει το παιχνίδι οποιαδήποτε στιγμή.</span>
          </label>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1 text-sm">
            <div className="truncate font-bold">{selectedMode.icon} {selectedMode.name}</div>
            <div className="truncate text-xs text-white/55">{canStart ? named.map((p) => p.name).join(' · ') : named.length < minPlayers ? `Χρειάζονται ${minPlayers - named.length} ακόμα παίκτριες` : 'Όρισε και επιβεβαίωσε τη λέξη ασφαλείας'}</div>
          </div>
          <button type="button" onClick={handleStart} disabled={!canStart} className="h-14 shrink-0 rounded-full bg-[#E8C26B] px-8 text-base font-black text-black disabled:opacity-30">▶ ΕΝΑΡΞΗ</button>
        </div>
      </div>
    </div>
  );
}
