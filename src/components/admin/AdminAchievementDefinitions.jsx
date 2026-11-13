import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { ACHIEVEMENTS, ACHIEVEMENTS_SETTING_KEY } from '@/data/achievements';

export default function AdminAchievementDefinitions() {
  const [items, setItems] = useState(ACHIEVEMENTS.map((item) => ({ ...item, reward: '' })));
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: ACHIEVEMENTS_SETTING_KEY }, { limit: 1 })
      .then(({ items: rows }) => {
        const found = rows?.[0] || null;
        setRecord(found);
        if (Array.isArray(found?.value?.items)) {
          setItems(ACHIEVEMENTS.map((base) => ({ reward: '', ...base, ...(found.value.items.find((item) => item.id === base.id) || {}) })));
        }
      })
      .catch((error) => setMessage(error.message || 'Δεν φορτώθηκαν οι ορισμοί.'));
  }, []);

  const update = (id, field, value) => setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const value = { items: items.map(({ id, name, icon, desc, reward }) => ({ id, name, icon, desc, reward: reward || '' })) };
      if (record?.id) await base44.entities.AppSetting.update(record.id, { value });
      else setRecord(await base44.entities.AppSetting.create({ key: ACHIEVEMENTS_SETTING_KEY, value }));
      setMessage('Οι ορισμοί αποθηκεύτηκαν.');
    } catch (error) {
      setMessage(error.message || 'Αποτυχία αποθήκευσης.');
    } finally { setBusy(false); }
  }

  return (
    <ComicPanel className="bg-card space-y-3">
      <div className="font-heading text-lg">ΟΡΙΣΜΟΙ ACHIEVEMENTS</div>
      <p className="text-xs text-foreground/60">Επεξεργασία των τεσσάρων υπαρχόντων achievements. Τα IDs και οι κανόνες απονομής του παιχνιδιού παραμένουν αμετάβλητα.</p>
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border/50 p-3 space-y-2">
          <div className="text-[10px] text-foreground/50">{item.id}</div>
          <label className="block text-xs font-bold">Εικονίδιο<input className="mt-1 w-full rounded border bg-background p-2" value={item.icon} onChange={(e) => update(item.id, 'icon', e.target.value)} /></label>
          <label className="block text-xs font-bold">Τίτλος<input className="mt-1 w-full rounded border bg-background p-2" value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} /></label>
          <label className="block text-xs font-bold">Περιγραφή / υφιστάμενος κανόνας<textarea rows={2} className="mt-1 w-full rounded border bg-background p-2" value={item.desc} onChange={(e) => update(item.id, 'desc', e.target.value)} /></label>
          <label className="block text-xs font-bold">Ανταμοιβή / unlock description (προαιρετικό)<input className="mt-1 w-full rounded border bg-background p-2" value={item.reward || ''} onChange={(e) => update(item.id, 'reward', e.target.value)} placeholder="Περιγραφή ανταμοιβής — χωρίς αλλαγή στους κανόνες απονομής" /></label>
        </div>
      ))}
      {message && <div className="text-xs font-bold">{message}</div>}
      <ComicButton variant="green" disabled={busy} onClick={save}>{busy ? 'ΑΠΟΘΗΚΕΥΣΗ…' : 'ΑΠΟΘΗΚΕΥΣΗ ΟΡΙΣΜΩΝ'}</ComicButton>
    </ComicPanel>
  );
}
