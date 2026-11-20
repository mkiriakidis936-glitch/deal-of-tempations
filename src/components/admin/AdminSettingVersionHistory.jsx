import React, { useCallback, useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { loadAdminSettingVersions, restoreAdminSettingVersion, saveAdminSettingVersion } from '@/lib/adminVersionHistory';

export default function AdminSettingVersionHistory({ settingKey, onRestore, title = 'Ιστορικό εκδόσεων', embedded = false }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const load = useCallback(async () => {
    try { setItems(await loadAdminSettingVersions(settingKey)); }
    catch (error) { setMessage(error.message || 'Δεν φορτώθηκε το ιστορικό.'); }
  }, [settingKey]);
  useEffect(() => { load(); }, [load]);

  async function restore(snapshot) {
    if (!window.confirm(`Επαναφορά στην έκδοση v${snapshot.number}; Η τρέχουσα κατάσταση κρατιέται ως νέα έκδοση.`)) return;
    setBusy(true); setMessage('');
    try {
      await saveAdminSettingVersion(settingKey, undefined, `Πριν την επαναφορά της v${snapshot.number}`);
      const value = await restoreAdminSettingVersion(settingKey, snapshot);
      onRestore?.(value);
      await load();
      setMessage(`Επανήλθε η έκδοση v${snapshot.number}.`);
    } catch (error) { setMessage(error.message || 'Η επαναφορά απέτυχε.'); }
    finally { setBusy(false); }
  }

  const visible = open ? items : items.slice(0, 3);
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="font-heading text-sm">{title}</div>
        <span className="text-[11px] text-foreground/55">{items.length ? `${items.length} εκδόσεις` : 'Καμία έκδοση'}</span>
      </div>
      {visible.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/40 p-2">
          <div className="min-w-0 text-xs">
            <b className="text-primary">v{item.number}</b>
            <span className="ml-2">{new Date(item.createdAt).toLocaleString('el-GR')}</span>
            <div className="truncate text-[11px] text-foreground/55">{[item.changedBy, item.note].filter(Boolean).join(' · ')}</div>
          </div>
          <ComicButton size="sm" variant="dark" disabled={busy} onClick={() => restore(item)}>Επαναφορά</ComicButton>
        </div>
      ))}
      {items.length > 3 && <button type="button" className="adm-pill" onClick={() => setOpen((v) => !v)}>{open ? 'Λιγότερες' : 'Όλες οι εκδόσεις'}</button>}
      {message && <div className="text-xs font-bold">{message}</div>}
    </>
  );
  return embedded ? <div className="space-y-2">{body}</div> : <ComicPanel className="bg-card space-y-2">{body}</ComicPanel>;
}
