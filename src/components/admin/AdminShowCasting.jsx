import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES, TOENAIL_PERKS } from '@/data/gameConfig';
import { isNewMode, modeMeta } from '@/data/modes/modeRegistry';

const CAST_KEY = 'show_casting_plan';
const SHOE_TO_LEVEL = { boots: 3, sneakers: 2, sandals: 1, barefoot: 0 };

function modesForIntake(item, source) {
  if (source === 'pajama') {
    if (Array.isArray(item.preferredModes) && item.preferredModes.length) return item.preferredModes;
    return item.formType === 'modes' ? [] : ['pajama'];
  }
  if (Array.isArray(item.preferredModes) && item.preferredModes.length) return item.preferredModes;
  return [item.vipGameMode || item.gameMode || 'classic'];
}

function normalizeName(value) {
  return String(value || '').trim().toLocaleLowerCase('el-GR');
}

function playerLimits(mode) {
  if (isNewMode(mode)) {
    const meta = modeMeta(mode);
    return { min: meta.min, max: meta.max };
  }
  if (mode === 'marathon') return { min: 8, max: 10 };
  if (mode === 'arrest_heist') return { min: 4, max: 10 };
  return { min: 2, max: mode === 'pajama' ? 10 : 6 };
}

export default function AdminShowCasting() {
  const [mode, setMode] = useState('classic');
  const [playerIntakes, setPlayerIntakes] = useState([]);
  const [pajamaIntakes, setPajamaIntakes] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [plan, setPlan] = useState(null);

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [players, pajama, settings, eventResult] = await Promise.all([
        base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 500 }),
        base44.entities.PajamaIntake.filter({}, { sort: '-created_date', limit: 500 }),
        base44.entities.AppSetting.filter({ key: CAST_KEY }, { limit: 1 }),
        base44.entities.DotEvent.filter({}, { sort: '-created_date', limit: 200 }),
      ]);
      const loadedEvents = eventResult.items || [];
      setEvents(loadedEvents);
      setSelectedEventId((current) => current || loadedEvents.find((event) => event.status !== 'completed')?.id || loadedEvents[0]?.id || '');
      setPlayerIntakes(players.items || []);
      setPajamaIntakes((pajama.items || []).filter((item) => item.approved === true));
      const record = settings.items?.[0] || null;
      const current = record?.value && typeof record.value === 'object' ? record.value : null;
      setPlan(current ? { ...current, settingId: record.id } : null);

    } catch (error) {
      console.error('Show casting load failed', error);
      setMessage(error.message || 'Δεν φορτώθηκαν οι συμμετοχές.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedEvent = events.find((event) => event.id === selectedEventId) || null;
  const scopeToEvent = useCallback((items) => (items || []).filter((item) => selectedEventId
    ? item.dotEventId === selectedEventId || item.roomCode === selectedEvent?.room_code || item.sessionCode === selectedEvent?.room_code
    : !item.dotEventId && !item.roomCode && !item.sessionCode), [selectedEventId, selectedEvent?.room_code]);

  useEffect(() => {
    if (!plan?.mode || !Array.isArray(plan.players)) { setSelected([]); return; }
    const matchesEvent = selectedEventId
      ? plan.dotEventId === selectedEventId || (!!plan.roomCode && plan.roomCode === selectedEvent?.room_code) || (!!plan.sessionCode && plan.sessionCode === selectedEvent?.room_code)
      : !plan.dotEventId && !plan.roomCode && !plan.sessionCode;
    if (!matchesEvent) { setSelected([]); return; }
    setMode(plan.mode);
    setSelected(plan.players.map((player) => normalizeName(player.name)).filter(Boolean));
  }, [plan, selectedEventId, selectedEvent?.room_code]);

  const candidates = useMemo(() => {
    const byName = new Map();
    const add = (item, source) => {
      const name = String(item.name || '').trim();
      const key = normalizeName(name);
      if (!key) return;
      const modes = modesForIntake(item, source);
      if (!modes.includes(mode)) return;
      const previous = byName.get(key) || {
        name,
        sourceIds: [],
        shoeType: '',
        slipperType: '',
        nailColor: '',
        vipProfile: null,
        accommodation: '',
        preferredModes: [],
      };
      previous.sourceIds.push({ source, id: item.id });
      previous.shoeType = item.shoeType || previous.shoeType;
      previous.slipperType = item.slipperType || previous.slipperType;
      previous.nailColor = item.nailColor || previous.nailColor;
      previous.vipProfile = item.vipProfile || previous.vipProfile;
      previous.accommodation = item.accommodation || item.stayAtVilla || item.vipProfile?.answers?.stayAtVilla || previous.accommodation;
      previous.preferredModes = [...new Set([...previous.preferredModes, ...modes])];
      byName.set(key, previous);
    };
    scopeToEvent(playerIntakes).filter((item) => item.approved === true || item.approvalStatus === 'approved').forEach((item) => add(item, 'player'));
    scopeToEvent(pajamaIntakes).forEach((item) => add(item, 'pajama'));
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'el'));
  }, [mode, playerIntakes, pajamaIntakes, scopeToEvent]);

  const modeCounts = useMemo(() => {
    const counts = new Map();
    const add = (item, source) => {
      const key = normalizeName(item.name);
      if (!key) return;
      modesForIntake(item, source).forEach((modeId) => {
        if (!counts.has(modeId)) counts.set(modeId, new Set());
        counts.get(modeId).add(key);
      });
    };
    scopeToEvent(playerIntakes).filter((item) => item.approved === true || item.approvalStatus === 'approved').forEach((item) => add(item, 'player'));
    scopeToEvent(pajamaIntakes).forEach((item) => add(item, 'pajama'));
    return GAME_MODES.map((item) => ({ ...item, count: counts.get(item.id)?.size || 0 }));
  }, [playerIntakes, pajamaIntakes, scopeToEvent]);

  const limits = playerLimits(mode);
  const selectedCandidates = candidates.filter((item) => selected.includes(normalizeName(item.name)));

  useEffect(() => {
    setSelected((current) => current.filter((name) => candidates.some((item) => normalizeName(item.name) === name)));
  }, [candidates]);

  function toggle(name) {
    const key = normalizeName(name);
    setSelected((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (current.length >= limits.max) return current;
      return [...current, key];
    });
  }

  async function publish() {
    if (selectedCandidates.length < limits.min || selectedCandidates.length > limits.max) {
      setMessage(`Για το συγκεκριμένο λειτουργία απαιτούνται ${limits.min}–${limits.max} παίκτριες.`);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const players = selectedCandidates.map((item, index) => ({
        name: item.name,
        footwearLevel: SHOE_TO_LEVEL[item.shoeType] ?? 2,
        toenailPerk: TOENAIL_PERKS[index % TOENAIL_PERKS.length].id,
        slipperType: item.slipperType || '',
        nailColor: item.nailColor || 'Pink',
      }));
      const value = {
        mode,
        players,
        source: 'admin-casting',
        publishedAt: new Date().toISOString(),
        ...(selectedEvent ? {
          dotEventId: selectedEvent.id,
          roomCode: selectedEvent.room_code || '',
          sessionCode: selectedEvent.room_code || '',
          eventTitle: selectedEvent.title || selectedEvent.name || '',
        } : {}),
      };
      if (plan?.settingId) {
        await base44.entities.AppSetting.update(plan.settingId, { value });
      } else {
        const record = await base44.entities.AppSetting.create({ key: CAST_KEY, value });
        setPlan({ ...value, settingId: record.id });
      }
      setPlan((current) => ({ ...(current || {}), ...value }));
      setMessage('Η επιλογή επεισοδίου αποθηκεύτηκε. Τα ονόματα είναι έτοιμα στο Tablet.');
    } catch (error) {
      console.error('Show casting publish failed', error);
      setMessage(error.message || 'Δεν αποθηκεύτηκε η επιλογή επεισοδίου.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center font-heading text-xl comic-pulse">ΦΟΡΤΩΣΗ ΣΥΜΜΕΤΟΧΩΝ...</div>;

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-card space-y-3">
        <div>
          <div className="font-heading text-xl text-primary">ΕΠΙΛΟΓΗ ΣΥΜΜΕΤΕΧΟΥΣΩΝ · ΕΠΙΛΟΓΗ ΕΠΕΙΣΟΔΙΟΥ</div>
          <p className="text-sm text-foreground/65">Οι εγκεκριμένες συμμετοχές συγκεντρώνονται εδώ. Επίλεξε τη λειτουργία που θα πραγματοποιηθεί και τις παίκτριες του συγκεκριμένου επεισοδίου.</p>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-bold text-foreground/60">ΕΠΙΛΟΓΕΣ ΠΑΙΚΤΡΙΩΝ ΑΝΑ MODE</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {modeCounts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setMode(item.id); setSelected([]); }}
                className={`rounded-lg border p-2 text-left ${mode === item.id ? 'border-primary bg-primary/10' : 'border-border/60 bg-secondary'}`}
              >
                <div className="text-xs font-bold">{item.name}</div>
                <div className="font-heading text-xl text-primary">{item.count}</div>
                <div className="text-[10px] text-foreground/50">ενδιαφερόμενες</div>
              </button>
            ))}
          </div>
        </div>
        <label className="block space-y-1 text-sm font-bold">
          ΕΝΕΡΓΟ EVENT
          <select value={selectedEventId} onChange={(event) => { setSelectedEventId(event.target.value); setSelected([]); }} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2">
            <option value="">Γενικές συμμετοχές χωρίς Event</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title || event.name || event.room_code || 'Event'}{event.room_code ? ` · ${event.room_code}` : ''}</option>)}
          </select>
        </label>
        <label className="block space-y-1 text-sm font-bold">
          ΤΕΛΙΚΟ MODE
          <select value={mode} onChange={(event) => { setMode(event.target.value); setSelected([]); }} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2">
            {GAME_MODES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Διαθέσιμες συμμετοχές: <strong>{candidates.length}</strong></span>
          <span>Επιλεγμένες: <strong>{selectedCandidates.length}/{limits.max}</strong> · Ελάχιστο: {limits.min}</span>
        </div>
        {candidates.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-secondary p-4 text-sm text-foreground/65">Δεν βρέθηκαν εγκεκριμένες συμμετοχές για αυτή τη λειτουργία στις υπάρχουσες φόρμες.</div>
        ) : (
          <div className="space-y-2">
            {candidates.map((item) => {
              const checked = selected.includes(normalizeName(item.name));
              return (
                <label key={normalizeName(item.name)} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${checked ? 'border-primary bg-primary/10' : 'border-border/60 bg-secondary'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(item.name)} disabled={!checked && selected.length >= limits.max} className="mt-1 h-4 w-4 accent-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{item.name}</span>
                    <span className="block text-xs text-foreground/55">
                      {item.sourceIds.map((source) => source.source === 'player' ? 'Player Intake' : 'Pajama / λειτουργίαs Form').join(' · ')}
                      {item.accommodation ? ` · ${item.accommodation === 'yes' || item.accommodation === true ? 'Παραμονή στο σπίτι' : item.accommodation === 'no' || item.accommodation === false ? 'Μόνο μία βραδιά Game Show' : item.accommodation}` : ''}
                    </span>
                  </span>
                  {checked && <span className="text-xs font-bold text-primary">ΕΠΙΛΕΓΜΕΝΗ</span>}
                </label>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <ComicButton variant="green" disabled={saving || selectedCandidates.length < limits.min || selectedCandidates.length > limits.max} onClick={publish}>
            {saving ? 'ΑΠΟΘΗΚΕΥΣΗ...' : 'ΑΠΟΘΗΚΕΥΣΗ ΕΠΕΙΣΟΔΙΟΥ ΓΙΑ TABLET'}
          </ComicButton>
          <ComicButton variant="dark" onClick={load} disabled={saving}>ΑΝΑΝΕΩΣΗ ΦΟΡΜΩΝ</ComicButton>
        </div>
        {message && <div role="status" className="rounded-lg bg-secondary p-3 text-sm font-bold">{message}</div>}
      </ComicPanel>

      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg text-primary">ΤΕΛΕΥΤΑΙΑ ΑΠΟΘΗΚΕΥΜΕΝΗ ΕΠΙΛΟΓΗ</div>
        {plan?.mode ? (
          <>
            <div className="font-bold">{GAME_MODES.find((item) => item.id === plan.mode)?.name || plan.mode}</div>
            <div className="text-sm text-foreground/65">{(plan.players || []).map((player) => player.name).join(' · ')}</div>
            <div className="text-xs text-foreground/45">Αποθηκεύτηκε: {plan.publishedAt ? new Date(plan.publishedAt).toLocaleString('el-GR') : '—'}</div>
          </>
        ) : <div className="text-sm text-foreground/55">Δεν έχει δημοσιευτεί επιλογή επεισοδίου.</div>}
      </ComicPanel>
    </div>
  );
}
