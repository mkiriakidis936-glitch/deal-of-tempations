import React, { useEffect, useMemo, useState } from 'react';
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
  return [item.vipGameMode || 'classic'];
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
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [plan, setPlan] = useState(null);

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [players, pajama, settings] = await Promise.all([
        base44.entities.PlayerIntake.filter({}, { sort: '-created_date', limit: 500 }),
        base44.entities.PajamaIntake.filter({}, { sort: '-created_date', limit: 500 }),
        base44.entities.AppSetting.filter({ key: CAST_KEY }, { limit: 1 }),
      ]);
      setPlayerIntakes(players.items || []);
      setPajamaIntakes((pajama.items || []).filter((item) => item.approved === true || item.formType === 'modes'));
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
      previous.accommodation = item.accommodation || item.stayAtVilla || previous.accommodation;
      previous.preferredModes = [...new Set([...previous.preferredModes, ...modes])];
      byName.set(key, previous);
    };
    playerIntakes.forEach((item) => add(item, 'player'));
    pajamaIntakes.forEach((item) => add(item, 'pajama'));
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'el'));
  }, [mode, playerIntakes, pajamaIntakes]);

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
      setMessage(`Για το συγκεκριμένο Mode απαιτούνται ${limits.min}–${limits.max} παίκτριες.`);
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
        ...(item.vipProfile ? { vipProfile: item.vipProfile } : {}),
      }));
      const value = {
        mode,
        players,
        source: 'admin-casting',
        publishedAt: new Date().toISOString(),
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
          <div className="font-heading text-xl text-primary">SHOW CASTING · ΕΠΙΛΟΓΗ ΕΠΕΙΣΟΔΙΟΥ</div>
          <p className="text-sm text-foreground/65">Οι υπάρχουσες φόρμες συγκεντρώνονται εδώ. Επίλεξε το Mode που θα πραγματοποιηθεί και τις παίκτριες του συγκεκριμένου επεισοδίου.</p>
        </div>
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
          <div className="rounded-lg border border-border/60 bg-secondary p-4 text-sm text-foreground/65">Δεν βρέθηκαν συμμετοχές για αυτό το Mode στις υπάρχουσες φόρμες.</div>
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
                      {item.sourceIds.map((source) => source.source === 'player' ? 'Player Intake' : 'Pajama / Modes Form').join(' · ')}
                      {item.accommodation ? ` · Διαμονή: ${item.accommodation === true ? 'Ναι' : item.accommodation === false ? 'Όχι' : item.accommodation}` : ''}
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
