import React from 'react';
import { MODE_MEDIA, MEDIA_FOCAL_POINTS, SCENE_MEDIA } from '@/data/brandArt';
import { isVideoUrl } from '@/lib/mediaKind';
import { phaseIdFor } from '@/data/modes/modeGuide';
import { MODE_MEDIA_SECTIONS } from '@/data/modes/modeRegistry';
import { SCENES, SCENE_BY_PENALTY_STEP, SCENE_BY_SQUARE } from '@/data/sceneLibrary';
import { pickSectionVariant } from '@/lib/sectionVariants';

// Ποια φωτογραφία ενότητας ταιριάζει ΤΩΡΑ: συγκεκριμένη στιγμή (κάρτα, ποινή, νύχτα, στέψη), αλλιώς η φάση.
const hasSection = (mode, id) => !!MODE_MEDIA[mode]?.sections?.find((item) => item.id === id)?.image;

function baseSectionFor(state) {
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
  if (mode === 'arrest_heist' && Number(state.stage) === 1 && recent((state.history || [])[0]) && state.history[0].type === 'penalty') {
    // Βαριά ποινή (στάδιο 4+): η φωτογραφία «Σύλληψη & ανάκριση», αν υπάρχει.
    return Number(state.history[0].step) >= 4 && hasSection(mode, 'arrest') ? 'arrest' : 'penalties';
  }
  if (mode === 'villa_takeover') {
    if (mg.finishedAll) return 'crown';
    if (mg.villa?.night) return 'night';
    if (mg.villa?.vote && hasSection(mode, 'roles')) return 'roles'; // μυστική ψηφοφορία = «Μυστικοί ρόλοι & συμμαχίες»
  }
  return phaseIdFor(state);
}
// Η φάση/στιγμή, και — αν υπάρχουν «εναλλακτικές» ενότητες (alt) — εναλλάσσεται ζωντανά με αυτές όσο προχωρά το ιστορικό.
export function artSectionFor(state) {
  const base = baseSectionFor(state);
  const mode = state?.mode;
  const registry = MODE_MEDIA_SECTIONS[mode] || [];
  const sections = (MODE_MEDIA[mode]?.sections || []).map((item) => ({ ...item, alt: item.alt || registry.find((r) => r.id === item.id)?.alt }));
  return pickSectionVariant(base, sections, (state?.history || []).length);
}
export const modeSectionId = (state) => artSectionFor(state);

// Σκηνή από τη βιβλιοθήκη σκηνών που ταιριάζει ΤΩΡΑ (μόνο όπου το state έχει πραγματικό γεγονός), αλλιώς ''.
export function artSceneFor(state) {
  const history = state?.history || [];
  const fresh = (event, ms = 90000) => event && Date.now() - (event.timestamp || 0) < ms;
  const find = (prefix) => {
    const hits = SCENES.filter((sc) => (sc.id === prefix || sc.id.startsWith(prefix)) && SCENE_MEDIA[sc.id]);
    return (hits.find((sc) => sc.ratio === '16:9') || hits[0])?.id || '';
  };
  if (state?.mode === 'arrest_heist' && Number(state.stage) === 1 && history[0]?.type === 'penalty' && fresh(history[0])) {
    const prefix = SCENE_BY_PENALTY_STEP[Number(history[0].step)];
    return prefix ? find(prefix) : '';
  }
  if (state?.mode === 'classic' && Number(state.stage) === 1) {
    const move = history.find((e) => e?.type === 'move');
    const prefix = fresh(move) ? SCENE_BY_SQUARE[move.squareType] : '';
    return prefix ? find(prefix) : '';
  }
  return '';
}

// Η φωτογραφία που ανέβηκε από το Admin για αυτό το mode: πρώτα της τρέχουσας ενότητας, μετά hero, μετά εξώφυλλο.
export function modeArtUrl(modeId, sectionId, state = null) {
  const scene = state ? SCENE_MEDIA[artSceneFor(state)] : '';
  if (scene) return scene;
  const media = MODE_MEDIA[modeId] || {};
  const section = sectionId ? media.sections?.find((item) => item.id === sectionId)?.image : '';
  return section || media.hero || media.cover || '';
}

export default function ModeArt({ state, modeId = state?.mode, sectionId = modeSectionId(state), className = '', alt = '' }) {
  const url = modeArtUrl(modeId, sectionId, state);
  if (!url) return null;
  const style = { objectPosition: MEDIA_FOCAL_POINTS[url] || '50% 50%' };
  if (isVideoUrl(url)) return <video key={url} src={url} className={`w-full object-cover ${className}`} style={style} autoPlay muted loop playsInline />;
  return <img key={url} src={url} alt={alt} decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} className={`w-full object-cover ${className}`} style={style} />;
}
