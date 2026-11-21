import React, { useRef, useState } from 'react';
import { uploadMedia } from '@/lib/media';
import { IMAGE_ACCEPT, mediaKindOf } from '@/lib/mediaKind';
import MediaSpot from '@/components/shared/MediaSpot';

export default function MediaField({ value, onChange, accept = IMAGE_ACCEPT }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setProgress(0);
    try {
      const result = await uploadMedia(file, setProgress);
      onChange(result.url);
    } catch (e) {
      setError(e.message || 'Το ανέβασμα απέτυχε.');
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2">
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-black">
        <MediaSpot src={value} controls={false} className="h-full w-full object-cover" fallback={<div className="flex h-full items-center justify-center text-[10px] text-foreground/40">{value ? '⚠️' : '—'}</div>} />
        {mediaKindOf(value) === 'video' && <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[9px] text-white">▶</span>}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="adm-pill" disabled={progress !== null} onClick={() => input.current?.click()}>
            {progress !== null ? `Ανέβασμα ${Math.round(progress * 100)}%` : value ? 'Αλλαγή' : 'Ανέβασμα'}
          </button>
          {value && <button type="button" className="adm-pill" onClick={() => onChange('')}>Αφαίρεση</button>}
        </div>
        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>
      <input ref={input} type="file" accept={accept} className="hidden" onChange={pick} />
    </div>
  );
}
