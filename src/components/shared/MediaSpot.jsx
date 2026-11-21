import React, { useEffect, useState } from 'react';
import VideoFilm from '@/components/shared/VideoFilm';
import { MEDIA_FOCAL_POINTS } from '@/data/brandArt';
import { mediaKindOf } from '@/lib/mediaKind';

// Ένα σημείο πολυμέσων: δείχνει φωτογραφία ή βίντεο ανάλογα με το αρχείο.
// Αν το αρχείο λείπει ή δεν φορτώνει, εμφανίζεται το `fallback` (ή τίποτα) — ποτέ σπασμένο εικονίδιο.
export default function MediaSpot({ wrapClassName, ...props }) {
  // wrapClassName: πλαίσιο γύρω από το αρχείο, που εμφανίζεται μόνο όταν υπάρχει αρχείο.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [props.src]);
  if (!wrapClassName) return <MediaElement {...props} />;
  if (!props.src || failed) return props.fallback ?? null;
  return <div className={wrapClassName}><MediaElement {...props} fallback={null} onFail={() => setFailed(true)} /></div>;
}

function MediaElement({ src, slot, className = '', alt = '', fallback = null, controls = false, eager = false, onFail }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  useEffect(() => { if (failed) onFail?.(); }, [failed]);
  if (!src || failed) return fallback;
  const kind = mediaKindOf(src);
  if (kind === 'video') {
    return controls
      ? <video src={src} data-media={slot} controls playsInline preload="metadata" className={className} onError={() => setFailed(true)} />
      : <VideoFilm src={src} slot={slot} className={className} onError={() => setFailed(true)} />;
  }
  if (kind === 'audio') return <audio src={src} controls preload="none" className={className} onError={() => setFailed(true)} />;
  return (
    <img
      src={src}
      data-media={slot}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={{ objectPosition: MEDIA_FOCAL_POINTS[src] || '50% 50%' }}
      onError={() => setFailed(true)}
    />
  );
}
