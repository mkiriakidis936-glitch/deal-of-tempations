import React from 'react';
import { MODE_MEDIA, MEDIA_FOCAL_POINTS } from '@/data/brandArt';
import { isVideoUrl } from '@/lib/mediaKind';
import { phaseIdFor } from '@/data/modes/modeGuide';

// Ποια φωτογραφία ενότητας ταιριάζει ΤΩΡΑ: συγκεκριμένη στιγμή (κάρτα, ποινή, νύχτα, στέψη), αλλιώς η φάση.
export function artSectionFor(state) {
  const mode = state?.mode;
  const mg = state?.mg || {};
  const recent = (event, ms = 90000) => event && Date.now() - (event.timestamp || 0) < ms;
  if (mode === 'classic' && Number(state.stage) === 1) {
    if (['street_truth', 'street_dare'].includes(state.cardAction)) return 'truth_dare';
    const move = (state.history || []).find((e) => e?.type === 'move');
    const square = recent(move) ? move.squareType : '';
    if (square === 'police') return 'police';
    if (square === 'blackmarket') return 'black_market';
    if (square === 'warrant' || state.cardAction === 'warrant') return 'warrant';
  }
  if (mode === 'arrest_heist' && Number(state.stage) === 1 && recent((state.history || [])[0]) && state.history[0].type === 'penalty') return 'penalties';
  if (mode === 'villa_takeover') {
    if (mg.finishedAll) return 'crown';
    if (mg.villa?.night) return 'night';
  }
  return phaseIdFor(state);
}
export const modeSectionId = (state) => artSectionFor(state);

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
