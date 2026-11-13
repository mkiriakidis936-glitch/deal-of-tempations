import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import AdminSettingVersionHistory from '@/components/admin/AdminSettingVersionHistory';
import { saveAdminSettingVersion } from '@/lib/adminVersionHistory';
import { NEW_MODES } from '@/data/modes/modeRegistry';
import { COLLECTIONS } from '@/lib/modesContentStore';

const KEY = 'admin_custom_scenarios';
const empty = () => ({ id: `scenario-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, name: '', description: '', modeId: NEW_MODES[0].id, collections: [] });

export default function AdminCustomScenarios() {
  const [items, setItems] = useState([]);
  const [record, setRecord] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 }).then(({ items: rows }) => {
      const found = rows?.[0] || null;
      setRecord(found);
      setItems(Array.isArray(found?.value?.items) ? found.value.items : []);
    }).catch((error) => setMessage(error.message || 'Δεν φορτώθηκαν τα σενάρια.'));
  }, []);

  const groups = useMemo(() => {
    const selectedMode = NEW_MODES.find((mode) => mode.id === editing?.modeId);
    const keys = selectedMode?.acts || [];
    return COLLECTIONS.filter((collection) => {
      if (editing?.modeId === 'pedi_extended' || editing?.modeId === 'marathon_4h') return /Pedi-Glam|Act 1|Act 2|Act 4|Marathon/i.test(collection.group);
      if (editing?.modeId === 'lockdown') return /Pajama Lockdown/i.test(collection.group);
      if (editing?.modeId === 'beach_bar') return /Beach Bar/i.test(collection.group);
      return keys.length > 0;
    });
  }, [editing?.modeId]);

  const change = (key, value) => setEditing((current) => ({ ...current, [key]: value }));

  async function save() {
    if (!editing?.name?.trim()) { setMessage('Συμπλήρωσε τίτλο σεναρίου.'); return; }
    setBusy(true); setMessage('');
    try {
      const normalized = { ...editing, name: editing.name.trim(), description: editing.description.trim(), collections: [...new Set(editing.collections || [])] };
      const next = editing.id && items.some((item) => item.id === editing.id)
        ? items.map((item) => item.id === editing.id ? normalized : item)
        : [...items, normalized];
      const value = { items: next };
      if (record?.id) await saveAdminSettingVersion(KEY, { items });
      let saved;
      if (record?.id) saved = await base44.entities.AppSetting.update(record.id, { value });
      else saved = await base44.entities.AppSetting.create({ key: KEY, value });
      setRecord(saved?.id ? saved : record);
      setItems(next); setEditing(null); setMessage('Το σενάριο αποθηκεύτηκε.');
    } catch (error) { setMessage(error.message || 'Αποτυχία αποθήκευσης.'); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    if (!window.confirm('Να διαγραφεί αυτό το αποθηκευμένο σενάριο;')) return;
    const next = items.filter((item) => item.id !== id);
    setBusy(true);
    try {
      if (record?.id) await saveAdminSettingVersion(KEY, { items });
      if (record?.id) await base44.entities.AppSetting.update(record.id, { value: { items: next } });
      setItems(next); if (editing?.id === id) setEditing(null);
      setMessage('Το σενάριο διαγράφηκε.');
    } catch (error) { setMessage(error.message || 'Αποτυχία διαγραφής.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-xl text-primary">CUSTOM GAME SCENARIOS</div>
        <p className="text-xs text-foreground/60">Δημιούργησε αποθηκευμένα presets χρησιμοποιώντας αποκλειστικά υπάρχοντα Modes και κατηγορίες Game Content. Οι επιλεγμένες κατηγορίες χρησιμοποιούν το περιεχόμενο που έχεις διαμορφώσει στο Game Editor. Οι υπόλοιπες παραμένουν στο αρχικό περιεχόμενο. Δεν προστίθενται νέοι κανόνες ή μηχανισμοί.</p>
        <ComicButton onClick={() => setEditing(empty())}>＋ ΝΕΟ ΣΕΝΑΡΙΟ</ComicButton>
      </ComicPanel>

      {message && <ComicPanel className="bg-secondary"><div className="text-sm font-bold">{message}</div></ComicPanel>}

      {editing && <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">{items.some((item) => item.id === editing.id) ? 'ΕΠΕΞΕΡΓΑΣΙΑ' : 'ΝΕΟ ΣΕΝΑΡΙΟ'}</div>
        <label className="block text-xs font-bold">Τίτλος<input className="mt-1 w-full rounded border border-border bg-background p-2" value={editing.name} onChange={(e) => change('name', e.target.value)} /></label>
        <label className="block text-xs font-bold">Περιγραφή<textarea rows={3} className="mt-1 w-full rounded border border-border bg-background p-2" value={editing.description} onChange={(e) => change('description', e.target.value)} /></label>
        <label className="block text-xs font-bold">Υφιστάμενο Mode<select className="mt-1 w-full rounded border border-border bg-background p-2" value={editing.modeId} onChange={(e) => change('modeId', e.target.value)}>{NEW_MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.name}</option>)}</select></label>
        <div className="space-y-2">
          <div className="text-xs font-bold">Κατηγορίες που θα χρησιμοποιούν το περιεχόμενο του Game Editor</div>
          {groups.map((group) => <label key={group.id} className="flex items-center gap-2 rounded border border-border/50 p-2 text-xs"><input type="checkbox" checked={(editing.collections || []).includes(group.id)} onChange={(e) => change('collections', e.target.checked ? [...(editing.collections || []), group.id] : (editing.collections || []).filter((id) => id !== group.id))} /><span>{group.label}</span></label>)}
        </div>
        <div className="flex flex-wrap gap-2"><ComicButton variant="green" disabled={busy} onClick={save}>ΑΠΟΘΗΚΕΥΣΗ</ComicButton><ComicButton variant="dark" disabled={busy} onClick={() => setEditing(null)}>ΑΚΥΡΟ</ComicButton></div>
      </ComicPanel>}

      <div className="space-y-2">
        {items.length === 0 && <ComicPanel className="bg-card text-sm text-foreground/60">Δεν υπάρχουν αποθηκευμένα custom scenarios.</ComicPanel>}
        {items.map((item) => <ComicPanel key={item.id} className="bg-card space-y-2">
          <div className="font-heading text-lg">{item.name}</div>
          <div className="text-xs text-foreground/60">{NEW_MODES.find((mode) => mode.id === item.modeId)?.name || item.modeId}</div>
          {item.description && <p className="text-sm">{item.description}</p>}
          <div className="text-xs text-foreground/60">Περιεχόμενο: {(item.collections || []).map((id) => COLLECTIONS.find((c) => c.id === id)?.label || id).join(' · ') || 'Δεν επιλέχθηκαν κατηγορίες'}</div>
          <div className="flex gap-2"><ComicButton size="sm" variant="dark" onClick={() => setEditing({ ...item })}>ΕΠΕΞΕΡΓΑΣΙΑ</ComicButton><ComicButton size="sm" variant="red" disabled={busy} onClick={() => remove(item.id)}>ΔΙΑΓΡΑΦΗ</ComicButton></div>
        </ComicPanel>)}
      </div>
      <AdminSettingVersionHistory settingKey={KEY} onRestore={(value) => setItems(value?.items || [])} />
    </div>
  );
}
