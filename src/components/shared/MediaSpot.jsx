import React from 'react';
import VideoFilm from '@/components/shared/VideoFilm';

// Ένα σημείο πολυμέσων μπορεί να εμφανίζει φωτογραφία, βίντεο ή τίποτα.
export default function MediaSpot({ src, slot, className = '', alt = '' }) {
  if (!src) return null;
  const isVideo = /\\.(mp4|webm|mov)(?:[?#]|$)/i.test(src);
  return isVideo
    ? <VideoFilm src={src} slot={slot} className={className} />
    : <img src={src} data-media={slot} alt={alt} loading="lazy" className={className} />;
}
