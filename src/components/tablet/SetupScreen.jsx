import React, { useState, useEffect, useRef } from 'react';
import { base44, request } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES, FOOTWEAR_LEVELS, TOENAIL_PERKS, INTENSITY_LEVELS } from '@/data/gameConfig';
import { createInitialState, generateSessionCode } from '@/lib/gameLogic';
import { isNewMode, modeMeta } from '@/data/modes/modeRegistry';
import { MODE_COVERS, MODE_MEDIA } from '@/data/brandArt';
import { COLLECTIONS } from '@/lib/modesContentStore';

const SHOE_TO_LEVEL = { boots: 3, sneakers: 2, sandals: 1, barefoot: 0 };

const NAIL_COLORS = ['Red', 'Pink', 'White', 'Black', 'Nude', 'French', 'Blue', 'Purple', 'Green', 'Orange', 'Gold', 'Silver', 'None'];


export default function SetupScreen({ onStart }) {
  const eventCode = (new URLSearchParams(window.location.search).get('event') || new URLSearchParams(window.location.search).get('sessionCode') || new URLSearchParams(window.location.search).get('code') || '').trim().toUpperCase();
  const [mode, setMode] = useState('classic');
  const [dotEvents, setDotEvents] = useState([]);
  const [selectedDotEventId, setSelectedDotEventId] = useState('');
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const [intensity, setIntensity] = useState('standard');
  const [safeWord, setSafeWord] = useState('');
  const [safeWordConfirmed, setSafeWordConfirmed] = useState(false);
  const [players, setPlayers] = useState([
    { name: '', footwearLevel: 2, toenailPerk: 'red' },
    { name: '', footwearLevel: 2, toenailPerk: 'pink' },
  ]);
  const [intakes, setIntakes] = useState([]);
  const [heistIntakes, setHeistIntakes] = useState([]);
  const [pajamaApproved, setPajamaApproved] = useState([]);
  const [pendingIntakes, setPendingIntakes] = useState([]);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [intakesLoaded, setIntakesLoaded] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [customScenarios, setCustomScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [castingPlan, setCastingPlan] = useState(null);

  const applyNames = (names, shoeByName, pjByName = {}, vipByName = {}) => {
    if (!names.length) return;
    setPlayers((prev) => {
      const kept = prev.map((p) => p.name.trim()).filter(Boolean);
      const merged = [...kept];
      names.forEach((n) => { if (!merged.includes(n)) merged.push(n); });
      const currentMode = modeRef.current;
      const currentMeta = isNewMode(currentMode) ? modeMeta(currentMode) : null;
      const limit = currentMeta?.max || (currentMode === 'marathon' || currentMode === 'arrest_heist' ? 10 : 6);
      return merged.slice(0, limit).map((n, idx) => ({
        name: n,
        footwearLevel: shoeByName[n] ?? 2,
        toenailPerk: TOENAIL_PERKS[idx % TOENAIL_PERKS.length].id,
        slipperType: pjByName[n]?.slipperType || '',
        nailColor: pjByName[n]?.nailColor || 'Pink',
        bringsOwnSlippers: pjByName[n]?.bringsOwnSlippers ?? true,
        hasFlipFlops: pjByName[n]?.hasFlipFlops ?? true,
        pajamaStyle: pjByName[n]?.pajamaStyle || '',
        ...(vipByName[n]?.vipProfile ? { vipProfile: vipByName[n].vipProfile } : {}),
      }));
    });
  };

  const loadIntakes = async () => {
    try {
      const [classicRes, pajamaRes, heistRes, castingRes, eventRes, vipRes] = await Promise.all([
        base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 500 }),
        base44.entities.PajamaIntake.filter({}, { sort: '-created_date', limit: 500 }),
        base44.entities.BacheloretteIntake.filter({}, { sort: '-created_date', limit: 500 }),
        base44.entities.AppSetting.filter({ key: 'show_casting_plan' }, { limit: 1 }),
        base44.entities.DotEvent.filter({}, { sort: '-created_date', limit: 200 }),
        base44.entities.VIPInvitationSubmission.filter({}, { sort: '-created_date', limit: 500 }),
      ]);
      const loadedEvents = eventRes.items || [];
      setDotEvents(loadedEvents);
      const selectedEvent = loadedEvents.find((item) => item.id === selectedDotEventId);
      const scopeToEvent = (items) => (items || []).filter((item) => selectedDotEventId
        ? item.dotEventId === selectedDotEventId || item.roomCode === selectedEvent?.room_code || item.sessionCode === selectedEvent?.room_code
        : eventCode ? item.sessionCode === eventCode || item.roomCode === eventCode : !item.sessionCode && !item.roomCode && !item.dotEventId);
      const allClassic = scopeToEvent(classicRes.items).filter((item) => item.approved === true);
      const classic = allClassic.filter((item) => item.gameMode === 'classic' || item.vipGameMode === 'classic' || (!item.gameMode && !item.vipGameMode && !['pajama', 'modes'].includes(item.formType) && !Array.isArray(item.preferredModes)));
      const allPajama = scopeToEvent(pajamaRes.items);
      const approved = allPajama.filter((i) => i.approved === true && i.name);
      const legacyPajama = approved.filter((i) => (i.formType || 'pajama') !== 'modes');
      const pending = [
        ...scopeToEvent(classicRes.items).filter((item) => item.approved !== true).map((item) => ({ ...item, sourceEntity: 'PlayerIntake', modeIds: item.preferredModes?.length ? item.preferredModes : [item.vipGameMode || item.gameMode || 'classic'] })),
        ...allPajama.filter((item) => item.approved !== true).map((item) => ({ ...item, sourceEntity: 'PajamaIntake', modeIds: item.preferredModes?.length ? item.preferredModes : ['pajama'] })),
        ...scopeToEvent(heistRes.items).filter((item) => item.approved !== true).map((item) => ({ ...item, sourceEntity: 'BacheloretteIntake', modeIds: ['arrest_heist'] })),
        ...scopeToEvent(vipRes.items).filter((item) => item.approved !== true && item.approvalStatus !== 'rejected').map((item) => ({ ...item, sourceEntity: 'VIPInvitationSubmission', modeIds: [item.gameMode || 'classic'] })),
      ].sort((a, b) => new Date(b.created_date || b.submittedAt || 0) - new Date(a.created_date || a.submittedAt || 0));
      setPendingIntakes(pending);
      setHeistIntakes([...scopeToEvent(heistRes.items).filter((item) => item.approved === true).map((item) => ({ ...item, modeIds: ['arrest_heist'] })), ...allClassic.filter((item) => item.gameMode === 'arrest_heist')]);
      setIntakes(allClassic);
      setPajamaApproved(approved);

      const shoeByName = {};
      classic.forEach((i) => {
        if (i.name) shoeByName[i.name.trim()] = SHOE_TO_LEVEL[i.shoeType] ?? 2;
      });

      const pjByName = {};
      legacyPajama.forEach((i) => {
        const n = i.name.trim();
        pjByName[n] = { slipperType: i.slipperType || '', nailColor: i.nailColor || '', bringsOwnSlippers: i.bringsOwnSlippers, hasFlipFlops: i.hasFlipFlops, pajamaStyle: i.pajamaStyle || '' };
      });

      const castingRecord = castingRes.items?.[0] || null;
      const savedCastingPlan = castingRecord?.value;
      const eligibleModesByName = new Map();
      const addEligible = (name, modes) => {
        const key = String(name || '').trim().toLocaleLowerCase('el-GR');
        if (!key) return;
        const current = eligibleModesByName.get(key) || new Set();
        modes.filter(Boolean).forEach((modeId) => current.add(modeId));
        eligibleModesByName.set(key, current);
      };
      allClassic.forEach((item) => addEligible(item.name, item.preferredModes?.length ? item.preferredModes : [item.vipGameMode || item.gameMode || 'classic']));
      approved.forEach((item) => addEligible(item.name, item.preferredModes?.length ? item.preferredModes : (item.formType === 'modes' ? [] : ['pajama'])));
      scopeToEvent(heistRes.items).filter((item) => item.approved === true).forEach((item) => {
        [item.name, item.leaderName, item.opponentName].forEach((name) => addEligible(name, ['arrest_heist']));
      });
      const planMatchesEvent = selectedDotEventId
        ? savedCastingPlan?.dotEventId === selectedDotEventId ||
          (!!savedCastingPlan?.roomCode && savedCastingPlan.roomCode === selectedEvent?.room_code) ||
          (!!savedCastingPlan?.sessionCode && savedCastingPlan.sessionCode === selectedEvent?.room_code)
        : eventCode
          ? savedCastingPlan?.sessionCode === eventCode || savedCastingPlan?.roomCode === eventCode
          : !savedCastingPlan?.dotEventId && !savedCastingPlan?.sessionCode && !savedCastingPlan?.roomCode;
      const planHasOnlyApprovedPlayers = Array.isArray(savedCastingPlan?.players) && savedCastingPlan.players.length > 0 &&
        savedCastingPlan.players.every((player) => eligibleModesByName.get(String(player.name || '').trim().toLocaleLowerCase('el-GR'))?.has(savedCastingPlan.mode));
      if (savedCastingPlan?.mode && !savedCastingPlan.usedAt && planMatchesEvent && planHasOnlyApprovedPlayers) {
        const activePlan = { ...savedCastingPlan, settingId: castingRecord.id };
        setCastingPlan(activePlan);
        setMode(activePlan.mode);
        setPlayers(activePlan.players.map((player, index) => ({
          ...player,
          footwearLevel: player.footwearLevel ?? 2,
          toenailPerk: player.toenailPerk || TOENAIL_PERKS[index % TOENAIL_PERKS.length].id,
        })));
      } else {
        setCastingPlan(null);
        if (savedCastingPlan?.players?.length && (!planMatchesEvent || !planHasOnlyApprovedPlayers)) {
          setApprovalMessage('Η αποθηκευμένη επιλογή δεν αντιστοιχεί στο Event ή περιλαμβάνει συμμετοχή χωρίς ενεργή έγκριση. Φορτώθηκαν μόνο οι εγκεκριμένες συμμετοχές.');
        }
        const currentMode = modeRef.current;
        let names = [];
        if (currentMode === 'classic') names = classic.map((item) => item.name?.trim()).filter(Boolean);
        else if (currentMode === 'marathon') names = allClassic.filter((item) => item.gameMode === 'marathon').map((item) => item.name?.trim()).filter(Boolean);
        else if (currentMode === 'arrest_heist') names = [...scopeToEvent(heistRes.items), ...allClassic.filter((item) => item.gameMode === 'arrest_heist')].flatMap((item) => [item.name, item.leaderName, item.opponentName]).map((name) => String(name || '').trim()).filter(Boolean);
        else if (currentMode === 'pajama') names = legacyPajama.map((item) => item.name?.trim()).filter(Boolean);
        else if (isNewMode(currentMode)) names = [...approved.filter((item) => item.preferredModes?.includes(currentMode)).map((item) => item.name?.trim()), ...allClassic.filter((item) => item.vipGameMode === currentMode).map((item) => item.name?.trim())].filter(Boolean);
        const vipByName = Object.fromEntries(allClassic.map((item) => [item.name?.trim(), item]).filter(([name]) => name));
        applyNames([...new Set(names)], shoeByName, pjByName, vipByName);
      }
    } catch (e) {
      console.error('Intake load error', e);
    } finally {
      setIntakesLoaded(true);
    }
  };

  useEffect(() => {
    loadIntakes();
  }, [selectedDotEventId]);

  useEffect(() => {
    const refresh = () => loadIntakes();
    const offPlayers = base44.entities.PlayerIntake.subscribe(refresh);
    const offPajama = base44.entities.PajamaIntake.subscribe(refresh);
    const offEvents = base44.entities.DotEvent.subscribe(refresh);
    const offHeist = base44.entities.BacheloretteIntake.subscribe(refresh);
    const offVip = base44.entities.VIPInvitationSubmission.subscribe(refresh);
    return () => { offPlayers?.(); offPajama?.(); offEvents?.(); offHeist?.(); offVip?.(); };
  }, [selectedDotEventId]);

  useEffect(() => {
    let active = true;
    base44.entities.AppSetting.filter({ key: 'admin_custom_scenarios' }, { limit: 1 })
      .then(({ items }) => { if (active) setCustomScenarios(Array.isArray(items?.[0]?.value?.items) ? items[0].value.items : []); })
      .catch((error) => console.warn('Custom scenarios load failed', error));
    return () => { active = false; };
  }, []);

  const newMode = isNewMode(mode) ? modeMeta(mode) : null;
  const modeDuration = newMode?.minutes || 300;
  const maxPlayers = newMode ? newMode.max : mode === 'marathon' ? 10 : mode === 'arrest_heist' ? 10 : 6;
  const minPlayers = newMode ? newMode.min : mode === 'marathon' ? 8 : mode === 'arrest_heist' ? 4 : 2;
  const modePreferenceRows = GAME_MODES.map((entry) => {
    const names = new Set();
    [...intakes, ...pajamaApproved, ...heistIntakes, ...pendingIntakes].forEach((item) => {
      const name = String(item.name || item.displayName || '').trim().toLocaleLowerCase('el-GR');
      if (!name) return;
      const ids = Array.isArray(item.modeIds) ? item.modeIds
        : Array.isArray(item.preferredModes) && item.preferredModes.length ? item.preferredModes
          : [item.vipGameMode || item.gameMode || ((item.formType || '') === 'pajama' ? 'pajama' : 'classic')];
      if (ids.includes(entry.id)) names.add(name);
    });
    return { ...entry, count: names.size };
  }).filter((entry) => entry.count > 0);

  function addPlayer() {
    if (players.length < maxPlayers) {
      setPlayers([...players, { name: '', footwearLevel: 2, toenailPerk: 'pink' }]);
    }
  }

  function removePlayer(idx) {
    if (players.length > Math.max(2, minPlayers)) {
      setPlayers(players.filter((_, i) => i !== idx));
    }
  }

  function updatePlayer(idx, field, value) {
    setPlayers(players.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }

  function handleModeChange(m) {
    modeRef.current = m.id;
    setMode(m.id);
    const selectedModeMeta = isNewMode(m.id) ? modeMeta(m.id) : null;
    const selectedModeMax = selectedModeMeta ? selectedModeMeta.max : (m.id === 'marathon' || m.id === 'arrest_heist' ? 10 : 6);
    if (m.id === 'marathon') {
      const names = [...new Set(intakes.filter((item) => item.gameMode === 'marathon').map((item) => (item.name || '').trim()).filter(Boolean))].slice(0, 10);
      const seeded = names.map((name, i) => ({ name, footwearLevel: 2, toenailPerk: TOENAIL_PERKS[i % TOENAIL_PERKS.length].id }));
      setPlayers([...seeded, ...Array.from({ length: Math.max(0, 8 - seeded.length) }, (_, i) => ({ name: '', footwearLevel: 2, toenailPerk: TOENAIL_PERKS[(seeded.length + i) % TOENAIL_PERKS.length].id }))]);
    } else if (m.id === 'arrest_heist') {
      const names = [...new Set(heistIntakes.flatMap((item) => [item.name, item.leaderName, item.opponentName]).map((name) => (name || '').trim()).filter(Boolean))].slice(0, 10);
      const seeded = names.map((name, i) => ({ name, footwearLevel: 2, toenailPerk: TOENAIL_PERKS[i % TOENAIL_PERKS.length].id }));
      setPlayers([...seeded, ...Array.from({ length: Math.max(0, 4 - seeded.length) }, (_, i) => ({ name: '', footwearLevel: 2, toenailPerk: TOENAIL_PERKS[(seeded.length + i) % TOENAIL_PERKS.length].id }))]);
    } else if (m.id === 'pajama') {
      const names = [...new Set(pajamaApproved.filter((item) => (item.formType || 'pajama') !== 'modes').map((item) => (item.name || '').trim()).filter(Boolean))].slice(0, 6);
      const seeded = names.map((name, i) => ({ name, footwearLevel: 2, toenailPerk: TOENAIL_PERKS[i % TOENAIL_PERKS.length].id }));
      setPlayers([...seeded, ...Array.from({ length: Math.max(0, 2 - seeded.length) }, (_, i) => ({ name: '', footwearLevel: 2, toenailPerk: TOENAIL_PERKS[(seeded.length + i) % TOENAIL_PERKS.length].id }))]);
    } else if (m.id === 'classic') {
      const names = [...new Set(intakes.filter((item) => item.gameMode === 'classic' || (!item.gameMode && !item.vipGameMode && !['pajama', 'modes'].includes(item.formType) && !Array.isArray(item.preferredModes))).map((item) => (item.name || '').trim()).filter(Boolean))].slice(0, 6);
      const seeded = names.map((name, i) => ({ name, footwearLevel: 2, toenailPerk: TOENAIL_PERKS[i % TOENAIL_PERKS.length].id }));
      setPlayers([...seeded, ...Array.from({ length: Math.max(0, 2 - seeded.length) }, (_, i) => ({ name: '', footwearLevel: 2, toenailPerk: TOENAIL_PERKS[(seeded.length + i) % TOENAIL_PERKS.length].id }))]);
    } else if (isNewMode(m.id)) {
      const meta = modeMeta(m.id);
      const vipForMode = intakes.filter((i) => i.vipGameMode === m.id && i.name).map((i) => i.name.trim());
      const wanted = [...new Set([
        ...pajamaApproved.filter((i) => Array.isArray(i.preferredModes) && i.preferredModes.includes(m.id)).map((i) => i.name.trim()),
        ...vipForMode,
      ])];
      if (wanted.length > 0) {
        const byName = Object.fromEntries([...intakes, ...pajamaApproved].filter((i) => i.name).map((i) => [i.name.trim(), i]));
        const next = [...new Set(wanted)].slice(0, meta.max).map((n, idx) => ({
          name: n, footwearLevel: 2, toenailPerk: TOENAIL_PERKS[idx % TOENAIL_PERKS.length].id,
          slipperType: byName[n]?.slipperType || '', nailColor: byName[n]?.nailColor || 'Pink', bringsOwnSlippers: byName[n]?.bringsOwnSlippers ?? true, hasFlipFlops: byName[n]?.hasFlipFlops ?? true, pajamaStyle: byName[n]?.pajamaStyle || '',
          ...(byName[n]?.vipProfile ? { vipProfile: byName[n].vipProfile } : {}),
        }));
        while (next.length < meta.min) next.push({ name: '', footwearLevel: 2, toenailPerk: 'pink' });
        setPlayers(next);
        return;
      }
      setPlayers(Array.from({ length: meta.min }, () => ({ name: '', footwearLevel: 2, toenailPerk: 'pink' })));
    }
    const vipForLegacyMode = intakes.filter((i) => i.vipGameMode === m.id && i.name);
    if (vipForLegacyMode.length) {
      setPlayers((previous) => {
        const byName = new Map(previous.filter((p) => p.name.trim()).map((p) => [p.name.trim(), p]));
        vipForLegacyMode.forEach((item, index) => {
          const playerName = item.name.trim();
          if (!byName.has(playerName)) byName.set(playerName, {
            name: playerName,
            footwearLevel: 2,
            toenailPerk: TOENAIL_PERKS[(byName.size + index) % TOENAIL_PERKS.length].id,
            vipProfile: item.vipProfile || null,
          });
        });
        return [...byName.values()].slice(0, selectedModeMax);
      });
    }
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

  async function handleStart() {
    const valid = players.filter((p) => p.name.trim());
    if (valid.length < minPlayers) return;
    const selectedScenario = customScenarios.find((scenario) => scenario.id === selectedScenarioId && scenario.modeId === mode);
    const selectedIntensity = mode === 'classic' ? intensity : 'standard';
    if (!safeWord.trim() || !safeWordConfirmed) return;
    const selectedDuration = { id: String(modeDuration), minutes: modeDuration };
    const state = { ...createInitialState(mode, selectedIntensity, valid), gameDurationMinutes: selectedDuration.minutes, gameStartedAt: Date.now(), gamePausedMs: 0, gamePausedAt: null, safetyProfile: { safeWord: safeWord.trim(), confirmedAt: Date.now() }, testMode,
      ...(selectedScenario ? { customScenario: { id: selectedScenario.id, name: selectedScenario.name, description: selectedScenario.description, collections: selectedScenario.collections || [] } } : {})
    };
    if (mode === 'beach_bar') {
      state.mg = { ...state.mg, alcoholFree: true, bb: { ...(state.mg.bb || {}), flops: Object.fromEntries(state.players.map((player) => [player.id, player.hasFlipFlops !== false])) } };
    }
    await onStart({
      sessionCode: generateSessionCode(),
      dotEventId: selectedDotEventId,
      mode,
      duration: selectedDuration.id,
      intensity: selectedIntensity,
      stage: state.stage,
      state,
    });
    if (castingPlan?.settingId && castingPlan.mode === mode) {
      try {
        await base44.entities.AppSetting.update(castingPlan.settingId, {
          value: { ...castingPlan, usedAt: new Date().toISOString() },
        });
      } catch (error) {
        console.warn('Episode cast usage timestamp could not be saved', error);
      }
    }
  }

  const canStart = players.filter((p) => p.name.trim()).length >= minPlayers && safeWord.trim().length >= 2 && safeWordConfirmed;

  return (
    <div className="min-h-screen comic-dots p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        <ComicPanel className="text-center py-8 ds-sheen">
          <h1 className="font-display text-3xl sm:text-5xl text-primary tracking-[0.14em]">DEAL OF TEMPTATION</h1>
          <div className="ds-rule my-4 mx-auto max-w-xs" />
          <p className="ds-eyebrow text-primary/70">ΛΗΣΤΕΙΑ &amp; ΣΥΛΛΗΨΗ — 18+ ALL-GIRLS EDITION</p>
        </ComicPanel>

        {pendingIntakes.length > 0 && (
          <ComicPanel className="bg-card border border-amber-500/50 space-y-2">
            <div className="flex items-center justify-between gap-2"><h2 className="font-heading text-xl text-primary">ΕΓΚΡΙΣΗ ΣΥΜΜΕΤΟΧΩΝ</h2><span className="text-xs font-bold">{pendingIntakes.length} σε αναμονή</span></div>
            {pendingIntakes.map((item) => (
              <div key={`${item.sourceEntity}-${item.id}`} className="rounded-lg border border-border p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0"><b>{item.name || item.displayName || 'Χωρίς όνομα'}</b><div className="flex flex-wrap gap-1 mt-1">{item.modeIds.map((id) => <span key={id} className="rounded bg-primary/15 px-2 py-0.5 text-[10px]">{GAME_MODES.find((entry) => entry.id === id)?.name || id}</span>)}</div></div>
                <ComicButton size="sm" variant="green" onClick={() => approveIntake(item)}>ΕΓΚΡΙΣΗ</ComicButton>
              </div>
            ))}
          </ComicPanel>
        )}
        {approvalMessage && <ComicPanel className="bg-secondary p-2"><p className="text-sm" role="status">{approvalMessage}</p></ComicPanel>}
        {intakesLoaded && (intakes.length > 0 || pajamaApproved.length > 0) && (
          <ComicPanel className="bg-secondary p-2">
            <div className="text-xs font-bold text-foreground font-body">
              ✅ {pajamaApproved.length} εγκεκριμένες φόρμες Pajama Party{intakes.length > 0 ? ` · ${intakes.length} από το /welcome` : ''} — τα ονόματα συμπληρώθηκαν αυτόματα.
            </div>
          </ComicPanel>
        )}

        {modePreferenceRows.length > 0 && (
          <ComicPanel className="bg-secondary space-y-2">
            <div className="font-heading text-lg text-primary">ΕΠΙΛΟΓΕΣ MODE ΑΠΟ ΤΙΣ ΦΟΡΜΕΣ</div>
            <p className="text-xs text-foreground/60">Οι εγκεκριμένες και οι εκκρεμείς προτιμήσεις συμμετοχής.</p>
            <div className="flex flex-wrap gap-2">
              {modePreferenceRows.map((entry) => (
                <button key={entry.id} type="button" onClick={() => handleModeChange(entry)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${mode === entry.id ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-background'}`} aria-pressed={mode === entry.id}>
                  {entry.icon} {entry.name} · {entry.count}
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-primary">ΕΠΙΛΕΓΜΕΝΟ MODE: {GAME_MODES.find((entry) => entry.id === mode)?.name || mode}</div>
          </ComicPanel>
        )}
        <ComicPanel>
          <h2 className="font-heading text-2xl mb-3 text-primary">ΔΙΑΡΚΕΙΑ ΠΑΙΧΝΙΔΙΟΥ</h2>
          <div className="comic-panel-sm p-3 bg-primary/10 border border-primary/40"><div className="font-heading text-xl text-foreground">⏱ ΔΙΑΡΚΕΙΑ · {modeDuration >= 60 ? `${Math.floor(modeDuration / 60)} ΩΡ${Math.floor(modeDuration / 60) === 1 ? 'Α' : 'ΕΣ'}` : `${modeDuration} ΛΕΠΤΑ`}{modeDuration % 60 ? ` ${modeDuration % 60} ΛΕΠΤΑ` : ''}</div><div className="text-sm text-foreground/70 font-body">Η διάρκεια ακολουθεί το επιλεγμένο Mode.</div></div>
        </ComicPanel>

        <ComicPanel className="bg-card space-y-3">
          <h2 className="font-heading text-2xl text-primary">VIBE &amp; SAFETY · ΚΟΙΝΗ ΛΕΞΗ ΑΣΦΑΛΕΙΑΣ</h2>
          <p className="text-sm text-foreground/70">Ορίστε μία λέξη που σημαίνει άμεση παύση για όλη την παρέα. Το κουμπί ΣΤΟΠ παραμένει διαθέσιμο σε όλες τις οθόνες.</p>
          <input
            type="text"
            value={safeWord}
            onChange={(event) => { setSafeWord(event.target.value); setSafeWordConfirmed(false); }}
            maxLength={32}
            placeholder="Πληκτρολόγησε την κοινή λέξη ασφαλείας"
            className="w-full rounded-lg border-2 border-border bg-background px-3 py-3 text-foreground font-bold"
          />
          <label className="flex items-start gap-2 text-sm text-foreground/80">
            <input type="checkbox" checked={safeWordConfirmed} onChange={(event) => setSafeWordConfirmed(event.target.checked)} className="mt-1" />
            <span>Η παρέα συμφώνησε στη λέξη ασφαλείας και γνωρίζει ότι οποιαδήποτε παίκτρια μπορεί να σταματήσει το παιχνίδι οποιαδήποτε στιγμή.</span>
          </label>
        </ComicPanel>

        <ComicPanel className="space-y-3">
          <h2 className="font-heading text-2xl text-primary">ΕΠΙΛΟΓΗ EVENT</h2>
          <select value={selectedDotEventId} onChange={(event) => setSelectedDotEventId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-3 text-foreground">
            <option value="">Χωρίς σύνδεση με Event</option>
            {dotEvents.filter((event) => !['closing', 'completed'].includes(event.status)).map((event) => (
              <option key={event.id} value={event.id}>{event.title} · {event.room_code}</option>
            ))}
          </select>
          {selectedDotEventId && <p className="text-xs text-foreground/65">Οι εγκεκριμένες συμμετοχές και τα Modes της συγκεκριμένης διοργάνωσης θα φορτωθούν αυτόματα.</p>}
        </ComicPanel>

        <ComicPanel>
          <h2 className="font-heading text-2xl mb-3 text-primary">1. ΕΠΙΛΟΓΗ MODE</h2>
          {castingPlan?.mode && (
            <div className="mb-3 rounded-lg border border-primary/50 bg-primary/10 p-3 text-sm">
              <div className="font-heading text-primary">MODE ΕΠΙΛΕΓΜΕΝΟ ΑΠΟ ΤΟ ADMIN</div>
              <div>{GAME_MODES.find((item) => item.id === castingPlan.mode)?.name || castingPlan.mode}</div>
              <div className="mt-1 text-xs text-foreground/55">Για αλλαγή Mode, ενημέρωσε πρώτα την επιλογή επεισοδίου στο Admin.</div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`comic-panel-sm p-3 transition-all sm:col-span-2 ${mode === 'classic' || mode === 'marathon' ? 'ring-2 ring-primary bg-primary/10' : 'bg-secondary'}`}>
              <div className="font-heading text-xl text-foreground">🎲 ΚΛΑΣΣΙΚΗ / MEGA MARATHON</div>
              <div className="text-sm text-foreground/70 font-body mb-2">Ίδιο τραπέζι, ίδιοι κανόνες — αλλάζει μόνο η κλίμακα.</div>
              <div className="grid grid-cols-2 gap-2">
                {GAME_MODES.filter((v) => v.id === 'classic' || v.id === 'marathon').map((v) => {
                  const on = mode === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleModeChange(v)}
                      disabled={!!castingPlan}
                      className={`rounded-md border p-2 text-left transition-all ${on ? 'border-primary bg-primary/15' : 'border-border/60 bg-surface-1 hover:border-primary/50'} ${castingPlan ? 'cursor-not-allowed opacity-75' : ''}`}
                    >
                      {MODE_COVERS["modeCover_" + v.id] && <img src={MODE_COVERS["modeCover_" + v.id]} alt={v.name} className="w-full aspect-[16/9] object-cover rounded-md mb-2 bg-black/30" />}
                      <div className="font-heading text-base text-foreground leading-tight">{v.icon} {v.name}</div>
                      <div className="ds-label mt-1 text-primary/70">{v.id === 'classic' ? '2-6 παίκτριες' : '8-10 παίκτριες'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            {GAME_MODES.filter((m) => m.id !== 'classic' && m.id !== 'marathon').map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m)}
                disabled={!!castingPlan}
                className={`comic-panel-sm p-3 text-left transition-all ${mode === m.id ? 'ring-2 ring-primary bg-primary/10' : 'bg-secondary'} ${castingPlan ? 'cursor-not-allowed opacity-75' : ''}`}
              >
                {MODE_COVERS["modeCover_" + m.id] && <img src={MODE_COVERS["modeCover_" + m.id]} alt={m.name} className="w-full aspect-[16/9] object-cover rounded-md mb-2 bg-black/30" />}
                <div className="font-heading text-xl text-foreground">{m.icon} {m.name}</div>
                <div className="text-sm text-foreground/70 font-body">{m.desc}</div>
              </button>
            ))}
          </div>
        </ComicPanel>

        {mode === 'classic' && (
          <ComicPanel className="bg-card">
            <h2 className="font-heading text-2xl mb-3 text-primary">2. ΕΝΤΑΣΗ ΠΑΙΧΝΙΔΙΟΥ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {INTENSITY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setIntensity(level.id)}
                  className={`comic-panel-sm p-3 text-left transition-all ${intensity === level.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}
                  aria-pressed={intensity === level.id}
                >
                  <div className="font-heading text-lg text-foreground">{level.icon} {level.name}</div>
                  <div className="text-xs text-foreground/70 font-body">{level.desc}</div>
                </button>
              ))}
            </div>
          </ComicPanel>
        )}

        {newMode && (() => {
          const media = MODE_MEDIA[mode] || {};
          const hasMedia = media.hero || media.trailer || media.gallery?.length || media.sections?.some((item) => item.image);
          return hasMedia ? (
            <ComicPanel className="bg-card space-y-3">
              {media.hero && <img src={media.hero} alt={newMode.name} className="w-full max-h-[360px] aspect-[16/7] object-cover rounded-xl" />}
              {media.sections?.some((item) => item.image) && (
                <div className="space-y-2">
                  <div className="font-heading text-lg text-primary">ΕΝΟΤΗΤΕΣ</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {media.sections.filter((item) => item.image).map((item) => (
                      <div key={item.id} className="rounded-lg overflow-hidden bg-secondary">
                        <img src={item.image} alt={item.label || ''} className="w-full aspect-video object-cover" />
                        <div className="p-2 text-xs font-bold">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {media.gallery?.length > 0 && (
                <div className="space-y-2">
                  <div className="font-heading text-lg text-primary">GALLERY</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {media.gallery.map((src, index) => <img key={`${src}-${index}`} src={src} alt="" className="w-full aspect-[4/5] object-cover rounded-lg" />)}
                  </div>
                </div>
              )}
              {media.trailer && <div className="space-y-2"><div className="font-heading text-lg text-primary">TRAILER</div><video src={media.trailer} controls playsInline className="w-full rounded-xl aspect-video bg-black" /></div>}
            </ComicPanel>
          ) : null;
        })()}

        {customScenarios.some((scenario) => scenario.modeId === mode) && (
          <ComicPanel className="bg-card space-y-2">
            <h2 className="font-heading text-xl text-primary">ΠΡΟΑΙΡΕΤΙΚΟ CUSTOM SCENARIO</h2>
            <p className="text-xs text-foreground/60">Επίλεξε αποθηκευμένο σενάριο για το συγκεκριμένο Mode. Η επιλογή καταγράφεται στη συνεδρία.</p>
            <select value={selectedScenarioId} onChange={(e) => setSelectedScenarioId(e.target.value)} className="w-full rounded border border-border bg-background p-2 text-sm">
              <option value="">Χωρίς custom scenario</option>
              {customScenarios.filter((scenario) => scenario.modeId === mode).map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}
            </select>
            {customScenarios.find((scenario) => scenario.id === selectedScenarioId && scenario.modeId === mode)?.description && <p className="text-sm">{customScenarios.find((scenario) => scenario.id === selectedScenarioId && scenario.modeId === mode).description}</p>}
            {selectedScenarioId && customScenarios.find((scenario) => scenario.id === selectedScenarioId && scenario.modeId === mode) && <div className="text-xs text-foreground/60">Περιεχόμενο σεναρίου: {(customScenarios.find((scenario) => scenario.id === selectedScenarioId && scenario.modeId === mode).collections || []).map((id) => COLLECTIONS.find((collection) => collection.id === id)?.label || id).join(' · ') || 'Δεν επιλέχθηκαν κατηγορίες'}</div>}
          </ComicPanel>
        )}

        <ComicPanel>
          {castingPlan?.mode === mode && (
            <div className="mb-3 rounded-lg border border-primary/50 bg-primary/10 p-3">
              <div className="font-heading text-sm text-primary">🎬 ΕΠΙΣΗΜΗ ΕΠΙΛΟΓΗ ΕΠΕΙΣΟΔΙΟΥ ΑΠΟ ADMIN</div>
              <div className="text-xs text-foreground/70">{players.filter((player) => player.name.trim()).map((player) => player.name).join(' · ')}</div>
              {castingPlan.usedAt && <div className="mt-1 text-[10px] text-foreground/45">Η επιλογή έχει χρησιμοποιηθεί σε προηγούμενη έναρξη.</div>}
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-2xl text-primary">2. ΠΑΙΚΤΡΙΕΣ ({players.length}/{maxPlayers})</h2>
            <div className="flex gap-2">
              <ComicButton variant="dark" size="sm" onClick={loadIntakes}>🔄 ΟΝΟΜΑΤΑ</ComicButton>
              <ComicButton variant="green" size="sm" onClick={addPlayer} disabled={players.length >= maxPlayers}>
                + ΠΡΟΣΘΗΚΗ
              </ComicButton>
            </div>
          </div>
          <div className="space-y-2">
            {players.map((p, idx) => (
              <div key={idx} className="comic-panel-sm p-2 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="font-heading text-lg w-8 text-center flex items-center justify-center text-primary">{idx + 1}</div>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                  placeholder={`Όνομα ${idx + 1}`}
                  className="flex-1 min-w-0 px-3 py-1.5 border-2 border-border rounded-lg font-bold bg-background text-foreground focus:outline-none focus:ring-2 ring-primary font-body"
                />
                {newMode ? null : mode === 'pajama' ? (
                  <>
                    <input
                      type="text"
                      value={p.slipperType || ''}
                      onChange={(e) => updatePlayer(idx, 'slipperType', e.target.value)}
                      placeholder="🩴 Παντόφλες (π.χ. fluffy ροζ)"
                      className="px-2 py-1.5 border-2 border-border rounded-lg text-sm bg-background text-foreground font-body w-full sm:w-44"
                    />
                    <select
                      value={p.nailColor || 'Pink'}
                      onChange={(e) => updatePlayer(idx, 'nailColor', e.target.value)}
                      className="px-2 py-1.5 border-2 border-border rounded-lg text-sm bg-background text-foreground font-body"
                    >
                      {NAIL_COLORS.map((c) => (
                        <option key={c} value={c}>💅 {c}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      value={p.footwearLevel}
                      onChange={(e) => updatePlayer(idx, 'footwearLevel', parseInt(e.target.value))}
                      className="px-2 py-1.5 border-2 border-border rounded-lg text-sm bg-background text-foreground font-body"
                    >
                      {FOOTWEAR_LEVELS.map((f) => (
                        <option key={f.level} value={f.level}>{f.icon} {f.label}</option>
                      ))}
                    </select>
                    <select
                      value={p.toenailPerk}
                      onChange={(e) => updatePlayer(idx, 'toenailPerk', e.target.value)}
                      className="px-2 py-1.5 border-2 border-border rounded-lg text-sm bg-background text-foreground font-body"
                    >
                      {TOENAIL_PERKS.map((perk) => (
                        <option key={perk.id} value={perk.id}>{perk.icon} {perk.name}</option>
                      ))}
                    </select>
                  </>
                )}
                {players.length > Math.max(2, minPlayers) && (
                  <button
                    onClick={() => removePlayer(idx)}
                    className="px-2 py-1 border-2 border-border rounded-lg bg-destructive text-foreground font-bold shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-foreground/60 font-body">
            {newMode
              ? '🔞 Μόνο ενήλικες (18+) που συμφωνούν να παίξουν. Κάθε παίκτρια μπορεί να πει ΣΤΟΠ οποιαδήποτε στιγμή.'
              : mode === 'pajama'
              ? '🩴 Παντόφλες & 💅 χρώμα νυχιών — τα βασικά της βραδιάς. Δεν υπάρχουν παπούτσια ή perks σε αυτό το mode.'
              : '👟 Επίπεδο Παπουτσιού καθορίζει τη σκάλα ποινών · 💅 Toenail Perk = 1 ειδική δύναμη ανά παίκτρια'}
          </div>
        </ComicPanel>

        <ComicPanel className={testMode ? 'bg-tarot-royal/40' : 'bg-secondary'}>
          <button onClick={() => setTestMode((t) => !t)} className="w-full flex items-center justify-between gap-3 text-left">
            <div>
              <div className="font-heading text-xl text-primary">🧪 TEST MODE</div>
              <div className="text-sm text-foreground/70 font-body">
                Δοκιμαστική παρτίδα: δεν αποθηκεύεται στο Chronicle ούτε στα στατιστικά.
              </div>
            </div>
            <span className={`font-heading text-lg px-3 py-1 rounded border-2 border-border shrink-0 ${testMode ? 'bg-tarot-forest text-foreground' : 'bg-background text-foreground/60'}`}>
              {testMode ? 'ON' : 'OFF'}
            </span>
          </button>
        </ComicPanel>

        <div className="dot-startbar">
          <ComicButton variant="magenta" size="lg" onClick={handleStart} disabled={!canStart}>
            🎬 ΕΝΑΡΞΗ ΠΑΙΧΝΙΔΙΟΥ
          </ComicButton>
          {!canStart && (
            <div className="dot-startbar-hint">
              Χρειάζονται τουλάχιστον {minPlayers} παίκτριες με όνομα.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}