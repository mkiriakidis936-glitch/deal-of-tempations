import { PHOTO_SPOT_IDS, MODE_COVER_SLOTS } from '@/data/mediaSlots';
import { MEDIA_MODES } from '@/data/modes/modeRegistry';

const BASE = '/assets/';

export const MEDIA_FOCAL_POINTS = {};

export const ART = {
  emblem: '/icons/icon-512.png',
  poster: `${BASE}a6f4b0278_l5k9kkl5k9kkl5k9.jpeg`,
  group: `${BASE}6699d79d8_i94p4ai94p4ai94j.jpeg`,
  scene: `${BASE}f73b71f5b_os4kmvos4kmvos4k.jpeg`,
  vault: `${BASE}8da1bee92_o8278mo8278mo827.jpeg`,
  slipper: `${BASE}f01a06ccc_k79v6qk79v6qk79v.jpeg`,
  party1: `${BASE}277f6be9f_udycmzudycmzudyc.jpeg`,
  party2: `${BASE}6a2c4ef78_28nlwv28nlwv28nl.jpeg`,
  photoGame: `${BASE}0d6206d2a_82fecb6c2_Gemini_Generated_Image_mcx255mcx255mcx2.jpeg`,
  photoSlippers: `${BASE}d93c887c9_e6cfd0151_Gemini_Generated_Image_4r1hj54r1hj54r1h.jpeg`,
  photoPediGlam: `${BASE}1ef972214_4a4d9d959_Gemini_Generated_Image_ryxfyxryxfyxryxf.jpeg`,
  photoHeistRoom: `${BASE}b69ab6678_19b98c43c_Gemini_Generated_Image_hrqtvohrqtvohrqt.jpeg`,
  photoHeistNight: `${BASE}ce9621f6f_2fbd3f250_Gemini_Generated_Image_dhdjofdhdjofdhdj.jpeg`,
  heistNight: `${BASE}ce9621f6f_2fbd3f250_Gemini_Generated_Image_dhdjofdhdjofdhdj.jpeg`,
  heist1: `${BASE}06eace33a_heist-h1.jpeg`,
  heist2: `${BASE}64110af4d_heist-h2.jpeg`,
  heist3: `${BASE}b55b10975_heist-h3.jpeg`,
  heist4: `${BASE}99b007a47_heist-h4.jpeg`,
  heist5: `${BASE}36d89c813_heist-h5.jpeg`,
  heist6: `${BASE}51f4df360_heist-h6.jpeg`,
  heist7: `${BASE}ccd85b58d_heist-h7.jpeg`,
  heist8: `${BASE}e012b807a_heist-h8.jpeg`,
  heist9: `${BASE}64ab52272_heist-h9.jpeg`,
  heist10: `${BASE}c0901d88c_heist-h10.jpeg`,
  banner: '/assets/059bca0c5_Gemini_Generated_Image_hmy5gghmy5gghmy5.jpeg',
  logo: '/brand/logo-full.jpg',
  invitationBg: '/assets/38a7c85ef_DealofTemptation2.jpeg',
  invitation: '',
  extraHeistRoom: '',
  extraPediGlam: '',
  wallpaperPhone: '',
  wallpaperTablet: '',
  wallpaperTv: `${BASE}8da1bee92_o8278mo8278mo827.jpeg`,
  patternSeamless: '',
};

export const MODE_COVERS = {
  modeCover_classic: ART.poster,
  modeCover_marathon: ART.heistNight,
  modeCover_arrest_heist: ART.photoHeistRoom,
  modeCover_pajama: ART.party1,
  modeCover_pedi_extended: ART.photoPediGlam,
  modeCover_lockdown: ART.vault,
  modeCover_beach_bar: ART.photoSlippers,
  modeCover_pedi_glam: ART.extraPediGlam || ART.photoPediGlam,
  modeCover_marathon_4h: ART.heist3,
};

// Ανεξάρτητη φωτογραφική ταυτότητα για καθένα από τα τέσσερα νέα Modes.
const MODE_MEDIA_DEFAULTS = {
  marathon_4h: {
    hero: ART.heist5,
    gallery: [ART.heist1, ART.heist3, ART.heist5, ART.heist7, ART.heist8, ART.heist10],
  },
};

export const MODE_MEDIA = Object.fromEntries(MEDIA_MODES.map(({ id }) => [id, {
  hero: MODE_MEDIA_DEFAULTS[id]?.hero || '', cover: MODE_COVERS[`modeCover_${id}`] || '', sections: [], gallery: [...(MODE_MEDIA_DEFAULTS[id]?.gallery || [])], cards: [], trailer: '',
}]));

export const PHOTO = {
  siteHero: '',
  siteTrailer: ART.poster,
  tv: '',
  promo: ART.poster,
  invitation: ART.invitation,
  pajama: '',
};

// Τα βίντεο είναι προαιρετικά. Δεν υπάρχει πλέον υποχρεωτικό/προεπιλεγμένο βίντεο.
export const FILM = { agent: '', welcomeVideo: '', countdownVideo: '' };
for (const id of PHOTO_SPOT_IDS) FILM[id] = '';

export const SITE_VIDEOS = []; // επιπλέον βίντεο για το /site (Admin → Φωτογραφίες & Βίντεο)
// Οι προεπιλεγμένες gallery εικόνες είναι ξεχωριστές από τις 12 αριθμημένες εικόνες κάθε gallery.
export const PAJAMA_PHOTOS = [ART.photoSlippers, ART.photoGame];
export const HEIST_PHOTOS = [ART.photoHeistNight];

// Αντίγραφο των αρχικών τιμών (πριν εφαρμοστούν οι αλλαγές από το Admin)
export const DEFAULTS = { ...ART, ...PHOTO, ...FILM, ...MODE_COVERS, heistPhotos: [], pajamaPhotos: [], siteVideos: [] };

// Καλείται μία φορά στην εκκίνηση (src/lib/media.js), ΠΡΙΝ φορτωθεί η εφαρμογή.
// Αλλάζει τα αντικείμενα επιτόπου, ώστε να τα δουν όλα τα components.
export function applyMediaOverrides(o = {}) {
  for (const key of Object.keys(MEDIA_FOCAL_POINTS)) delete MEDIA_FOCAL_POINTS[key];
  Object.assign(MEDIA_FOCAL_POINTS, o.libraryFocalPoints && typeof o.libraryFocalPoints === 'object' ? o.libraryFocalPoints : {});
  const str = (v) => (typeof v === 'string' && v ? v : null);
  const isVideo = (v) => /\.(mp4|webm|mov)(?:[?#]|$)/i.test(v || '');
  const clearPhotos = !!(o.clearAllPhotos || o.clearAllMedia);
  const emptySlots = Array.isArray(o.emptySlots) ? o.emptySlots : [];

  for (const k of Object.keys(ART)) ART[k] = str(o[k]) || (clearPhotos ? '' : DEFAULTS[k]);

  const emptyModeCovers = Array.isArray(o.emptyModeCovers) ? o.emptyModeCovers : [];
  for (const { id } of MODE_COVER_SLOTS) MODE_COVERS[id] = emptyModeCovers.includes(id) ? '' : (str(o[id]) || (clearPhotos ? '' : DEFAULTS[id]));

  const modeMediaOverrides = o.modeMedia && typeof o.modeMedia === 'object' ? o.modeMedia : {};
  for (const { id } of MEDIA_MODES) {
    const saved = modeMediaOverrides[id] && typeof modeMediaOverrides[id] === 'object' ? modeMediaOverrides[id] : {};
    const coverId = `modeCover_${id}`;
    const cover = saved.coverCleared === true ? '' : (str(saved.cover) || str(o[coverId]) || (clearPhotos ? '' : DEFAULTS[coverId]));
    MODE_MEDIA[id] = {
      hero: str(saved.hero) || (clearPhotos ? '' : MODE_MEDIA_DEFAULTS[id]?.hero || ''),
      cover,
      sections: Array.isArray(saved.sections) ? saved.sections : [],
      gallery: Array.isArray(saved.gallery) ? Array.from({ length: 6 }, (_, index) => str(saved.gallery[index]) || '') : Array.from({ length: 6 }, (_, index) => (clearPhotos ? '' : MODE_MEDIA_DEFAULTS[id]?.gallery?.[index] || '')),
      cards: Array.isArray(saved.cards) ? saved.cards : [],
      trailer: str(saved.trailer) || '',
    };
    MODE_COVERS[coverId] = cover;
  }

  // Κάθε ένα από τα έξι σημεία δέχεται είτε φωτογραφία είτε βίντεο, ή παραμένει κενό.
  // Το «διαγραφή όλων των βίντεο» αδειάζει τα σημεία, αλλά ένα βίντεο που ανεβαίνει ΜΕΤΑ τη διαγραφή
  // πρέπει να εμφανίζεται κανονικά (πριν, η σημαία clearAllVideos το απέκρυπτε για πάντα).
  FILM.agent = str(o.agent) || '';
  FILM.welcomeVideo = str(o.welcomeVideo) || '';
  FILM.countdownVideo = str(o.countdownVideo) || '';
  for (const id of PHOTO_SPOT_IDS) {
    const value = str(o[id]);
    if (emptySlots.includes(id)) {
      PHOTO[id] = '';
      FILM[id] = '';
    } else if (value && isVideo(value)) {
      PHOTO[id] = '';
      FILM[id] = value;
    } else if (value) {
      PHOTO[id] = value;
      FILM[id] = '';
    } else {
      PHOTO[id] = clearPhotos ? '' : DEFAULTS[id];
      FILM[id] = '';
    }
  }

  const setList = (arr, v, def) => arr.splice(0, arr.length, ...(Array.isArray(v) ? v.filter(str) : def));
  const heistGallery = Array.isArray(o.heistPhotos) ? o.heistPhotos.filter(str) : [];
  const pajamaGallery = Array.isArray(o.pajamaPhotos) ? o.pajamaPhotos.filter(str) : [];
  HEIST_PHOTOS.splice(0, HEIST_PHOTOS.length, ...[ART.photoHeistNight, ...heistGallery].filter(str));
  PAJAMA_PHOTOS.splice(0, PAJAMA_PHOTOS.length, ...[ART.photoSlippers, ART.photoGame, ...pajamaGallery].filter(str));
  setList(SITE_VIDEOS, o.siteVideos, []);
}
