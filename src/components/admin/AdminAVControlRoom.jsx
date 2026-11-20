import React, { useCallback, useEffect, useState } from 'react';
import AVControlRoom from '@/components/admin/AVControlRoom';
import { listMedia } from '@/lib/media';

export default function AdminAVControlRoom() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshMedia = useCallback(async () => {
    try {
      setMediaFiles(await listMedia({ force: true }));
      setError('');
    } catch (cause) {
      setError(cause?.message || 'Δεν φορτώθηκε η βιβλιοθήκη πολυμέσων.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshMedia(); }, [refreshMedia]);

  return (
    <div className="space-y-3">
      {loading && <p className="text-xs text-foreground/60">Φόρτωση πολυμέσων…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AVControlRoom mediaFiles={mediaFiles} onRefreshMedia={refreshMedia} />
    </div>
  );
}
