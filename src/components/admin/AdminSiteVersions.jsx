import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const VERSION_KEY = 'admin_site_versions';
const LIMIT = 20;

async function getVersionRecord() {
  const result = await base44.entities.AppSetting.filter({ key: VERSION_KEY }, { limit: 1 });
  return result.items?.[0] || null;
}

export async function saveSiteVersion(allContent, eventId) {
  const previous = allContent?.[eventId];
  if (!previous) return;
  const record = await getVersionRecord();
  const versions = Array.isArray(record?.value?.items) ? record.value.items : [];
  const snapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventId,
    createdAt: new Date().toISOString(),
    content: JSON.parse(JSON.stringify(previous)),
  };
  const value = { items: [snapshot, ...versions].slice(0, LIMIT) };
  if (record?.id) await base44.entities.AppSetting.update(record.id, { value });
  else await base44.entities.AppSetting.create({ key: VERSION_KEY, value });
}

export default function AdminSiteVersions({ eventId, currentValue, onRestore }) {
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
      <div className="font-heading text-lg">🕘 ΙΣΤΟΡΙΚΟ ΕΚΔΟΣΕΩΝ SITE</div>
      <p className="text-xs text-foreground/60">Διατηρούνται έως 20 προηγούμενες αποθηκευμένες εκδόσεις ανά event. Η επαναφορά φορτώνει την έκδοση στον editor και απαιτεί ξεχωριστή αποθήκευση.</p>
      {message && <div className="text-xs font-bold text-primary">{message}</div>}
      {loading ? <div className="text-xs">Φόρτωση…</div> : versions.length === 0 ? (
        <div className="text-xs text-foreground/50">Δεν υπάρχουν προηγούμενες εκδόσεις για αυτό το event.</div>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 p-2">
              <div className="text-xs min-w-0">{new Date(version.createdAt).toLocaleString('el-GR')}</div>
              <ComicButton size="sm" variant="dark" disabled={busy} onClick={() => restore(version)}>Επαναφορά στον editor</ComicButton>
            </div>
          ))}
        </div>
      )}
    </ComicPanel>
  );
}
