import React, { useCallback, useEffect, useState } from 'react';
import { appApi } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const VERSION_KEY = 'admin_site_versions';
const LIMIT = 20;

async function getVersionRecord() {
  const result = await appApi.entities.AppSetting.filter({ key: VERSION_KEY }, { limit: 1 });
  return result.items?.[0] || null;
}

export async function saveSiteVersion(allContent, eventId, nextContent) {
  const previous = allContent?.[eventId];
  if (!previous) return;
  const [record, user] = await Promise.all([getVersionRecord(), appApi.auth.me().catch(() => null)]);
  const versions = Array.isArray(record?.value?.items) ? record.value.items : [];
  const snapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventId,
    createdAt: new Date().toISOString(),
    changedBy: user?.email || user?.user?.email || 'Admin',
    changedFields: [...new Set([...Object.keys(previous || {}), ...Object.keys(nextContent || {})])].filter((key) => JSON.stringify(previous?.[key]) !== JSON.stringify(nextContent?.[key])),
    content: JSON.parse(JSON.stringify(previous)),
  };
  const value = { items: [snapshot, ...versions].slice(0, LIMIT) };
  if (record?.id) await appApi.entities.AppSetting.update(record.id, { value });
  else await appApi.entities.AppSetting.create({ key: VERSION_KEY, value });
}

export default function AdminSiteVersions({ eventId, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const record = await getVersionRecord();
      setVersions((record?.value?.items || []).filter((item) => item.eventId === eventId));
    } catch (error) {
      setMessage(error.message || 'Δεν φορτώθηκε το ιστορικό.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  async function restore(version) {
    if (!window.confirm(`Να επανέλθει το περιεχόμενο του ${eventId} από ${new Date(version.createdAt).toLocaleString('el-GR')};`)) return;
    setBusy(true);
    setMessage('');
    try {
      onRestore(JSON.parse(JSON.stringify(version.content)));
      setMessage('Το παλιό περιεχόμενο φορτώθηκε στον editor. Πάτησε ΑΠΟΘΗΚΕΥΣΗ για να εφαρμοστεί.');
    } catch (error) {
      setMessage(error.message || 'Δεν έγινε η επαναφορά.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ComicPanel className="bg-card space-y-2">
      <div className="font-heading text-lg">🕘 Ιστορικό εκδόσεων SITE</div>
      {message && <div className="text-xs font-bold text-primary">{message}</div>}
      {loading ? <div className="text-xs">Φόρτωση…</div> : versions.length === 0 ? (
        <div className="text-xs text-foreground/50">Δεν υπάρχουν προηγούμενες εκδόσεις για αυτό το event.</div>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 p-2">
              <div className="text-xs min-w-0"><div>{new Date(version.createdAt).toLocaleString('el-GR')}</div><div className="text-[10px] text-foreground/50">Αλλαγή από: {version.changedBy || 'Admin'}</div><div className="text-[10px] text-foreground/50">Πεδία: {(version.changedFields || []).join(', ') || 'Περιεχόμενο'}</div></div>
              <ComicButton size="sm" variant="dark" disabled={busy} onClick={() => restore(version)}>Αναίρεση / επαναφορά</ComicButton>
            </div>
          ))}
        </div>
      )}
    </ComicPanel>
  );
}
