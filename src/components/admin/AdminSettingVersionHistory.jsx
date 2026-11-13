import React, { useCallback, useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { loadAdminSettingVersions, restoreAdminSettingVersion, saveAdminSettingVersion } from '@/lib/adminVersionHistory';

export default function AdminSettingVersionHistory({ settingKey, onRestore }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { setItems(await loadAdminSettingVersions(settingKey)); }
    catch (error) { setMessage(error.message || 'Δεν φορτώθηκε το ιστορικό.'); }
  }, [settingKey]);
  useEffect(() => { load(); }, [load]);

  async function restore(snapshot) {
    if (!window.confirm('Να επανέλθει αυτή η προηγούμενη έκδοση; Θα αντικατασταθούν οι τρέχουσες ρυθμίσεις.')) return;
    setBusy(true); setMessage('');
    try {
      await saveAdminSettingVersion(settingKey);
      const value = await restoreAdminSettingVersion(settingKey, snapshot);
      onRestore?.(value);
      await load();
      setMessage('Η προηγούμενη έκδοση επανήλθε.');
    } catch (error) { setMessage(error.message || 'Η επαναφορά απέτυχε.'); }
    finally { setBusy(false); }
  }

  return <ComicPanel className="bg-card space-y-2">
    <div className="font-heading text-sm">ΙΣΤΟΡΙΚΟ ΕΚΔΟΣΕΩΝ</div>
    <div className="text-[11px] text-foreground/55">Έως 20 προηγούμενες εκδόσεις αυτού του περιεχομένου.</div>
    {items.length === 0 ? <div className="text-xs text-foreground/50">Δεν υπάρχουν αποθηκευμένες εκδόσεις ακόμη.</div> : items.map((item) => <div key={item.id} className="flex items-center justify-between gap-2 border border-border/40 rounded p-2">
      <span className="text-xs">{new Date(item.createdAt).toLocaleString('el-GR')}</span>
      <ComicButton size="sm" variant="dark" disabled={busy} onClick={() => restore(item)}>ΕΠΑΝΑΦΟΡΑ</ComicButton>
    </div>)}
    {message && <div className="text-xs font-bold">{message}</div>}
  </ComicPanel>;
}
