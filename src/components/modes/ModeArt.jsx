import React from 'react';
import { MODE_MEDIA, MEDIA_FOCAL_POINTS } from '@/data/brandArt';
import { isVideoUrl } from '@/lib/mediaKind';
import { phaseIdFor } from '@/data/modes/modeGuide';

export const modeSectionId = (state) => phaseIdFor(state);

// Η φωτογραφία που ανέβηκε από το Admin για αυτό το mode: πρώτα της τρέχουσας ενότητας, μετά hero, μετά εξώφυλλο.
export function modeArtUrl(modeId, sectionId) {
  const media = MODE_MEDIA[modeId] || {};
  const section = sectionId ? media.sections?.find((item) => item.id === sectionId)?.image : '';
  return section || media.hero || media.cover || '';
}

export default function ModeArt({ state, modeId = state?.mode, sectionId = modeSectionId(state), className = '', alt = '' }) {
  const url = modeArtUrl(modeId, sectionId);
  if (!url) return null;
  const style = { objectPosition: MEDIA_FOCAL_POINTS[url] || '50% 50%' };
  if (isVideoUrl(url)) return <video key={url} src={url} className={`w-full object-cover ${className}`} style={style} autoPlay muted loop playsInline />;
  return <img key={url} src={url} alt={alt} decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} className={`w-full object-cover ${className}`} style={style} />;
}
