import React from 'react';
import { MODE_MEDIA, MEDIA_FOCAL_POINTS } from '@/data/brandArt';
import { isVideoUrl } from '@/lib/mediaKind';

// Ποια φωτογραφία ενότητας αντιστοιχεί στη φάση που παίζεται τώρα.
const LOCKDOWN_STAGE_SECTION = { init: 'level1', l1: 'level1', l2: 'level2', l3: 'level3', exit: 'level4', won: 'level5', lost: 'level4' };
const BEACH_PHASE_SECTION = { checkin: 'checkin', dance: 'dance_arena', wheel: 'penalty_wheel', truth: 'shot_truth', finale: 'last_queen' };

export function modeSectionId(state) {
  const mg = state?.mg || {};
  if (state?.mode === 'lockdown') return LOCKDOWN_STAGE_SECTION[mg.ld?.stage || 'init'];
  if (state?.mode === 'beach_bar') return BEACH_PHASE_SECTION[mg.bb?.phase || 'checkin'];
  return '';
}

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
  return <img key={url} src={url} alt={alt} decoding="async" className={`w-full object-cover ${className}`} style={style} />;
}
