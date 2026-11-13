import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import AdminSettingVersionHistory from '@/components/admin/AdminSettingVersionHistory';
import { saveAdminSettingVersion } from '@/lib/adminVersionHistory';
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
      const value = { items: items.map(({ id, name, icon, desc, reward, conditionId, enabled }) => ({ id, name, icon, desc, reward: reward || '', conditionId, enabled: enabled !== false })) };
      if (record?.id) await saveAdminSettingVersion(ACHIEVEMENTS_SETTING_KEY, record.value || { items: ACHIEVEMENTS });
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
      <p className="text-xs text-foreground/60">Διαχείριση των τεσσάρων υπαρχόντων achievements. Μπορείς να ενεργοποιήσεις/απενεργοποιήσεις κάθε achievement και να αντιστοιχίσεις μόνο έναν από τους ήδη υπάρχοντες κανόνες του παιχνιδιού.</p>
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border/50 p-3 space-y-2">
          <div className="text-[10px] text-foreground/50">{item.id}</div>
          <label className="block text-xs font-bold">Εικονίδιο<input className="mt-1 w-full rounded border bg-background p-2" value={item.icon} onChange={(e) => update(item.id, 'icon', e.target.value)} /></label>
          <label className="block text-xs font-bold">Τίτλος<input className="mt-1 w-full rounded border bg-background p-2" value={item.name} onChange={(e) => update(item.id, 'name', e.target.value)} /></label>
          <label className="block text-xs font-bold">Κανόνας απονομής<select className="mt-1 w-full rounded border bg-background p-2" value={item.conditionId || ''} onChange={(e) => update(item.id, 'conditionId', e.target.value)}><option value="pajama_top_score">Πρώτη θέση σε σκορ Pajama Pedi-Glam</option><option value="pajama_saboteur">Secret Saboteur σε Pajama</option><option value="classic_highest_bounty">Μεγαλύτερο bounty σε Classic</option><option value="winning_team">Μέλος νικήτριας ομάδας</option></select></label>
          <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={item.enabled !== false} onChange={(e) => update(item.id, 'enabled', e.target.checked)} /> Ενεργό — απονομή achievement</label>
          <label className="block text-xs font-bold">Περιγραφή / υφιστάμενος κανόνας<textarea rows={2} className="mt-1 w-full rounded border bg-background p-2" value={item.desc} onChange={(e) => update(item.id, 'desc', e.target.value)} /></label>
          <label className="block text-xs font-bold">Ανταμοιβή / unlock description (προαιρετικό)<input className="mt-1 w-full rounded border bg-background p-2" value={item.reward || ''} onChange={(e) => update(item.id, 'reward', e.target.value)} placeholder="Περιγραφή ανταμοιβής — χωρίς αλλαγή στους κανόνες απονομής" /></label>
        </div>
      ))}
      {message && <div className="text-xs font-bold">{message}</div>}
      <ComicButton variant="green" disabled={busy} onClick={save}>{busy ? 'ΑΠΟΘΗΚΕΥΣΗ…' : 'ΑΠΟΘΗΚΕΥΣΗ ΟΡΙΣΜΩΝ'}</ComicButton>
      <AdminSettingVersionHistory settingKey={ACHIEVEMENTS_SETTING_KEY} onRestore={(value) => setItems(ACHIEVEMENTS.map((base) => ({ reward: '', ...base, ...(value?.items || []).find((item) => item.id === base.id) }))) } />
    </ComicPanel>
  );
}
