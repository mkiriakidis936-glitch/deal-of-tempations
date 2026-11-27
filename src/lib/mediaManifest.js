// ΕΝΑΣ κατάλογος για ΟΛΑ τα media της εφαρμογής (φωτογραφίες, βίντεο, ήχοι).
// Από εδώ βγαίνουν: ο «Χάρτης media» του Admin, ο έλεγχος ελλείψεων, το αρχείο TXT με τα ονόματα,
// το νούμερο «Ελλείψεις media» στην Επισκόπηση και τα ονόματα της Αυτόματης σύνδεσης.
// Κάθε «surfaces» έχει ελεγχθεί στον κώδικα: δείχνει πού εμφανίζεται ΠΡΑΓΜΑΤΙΚΑ το αρχείο.
import { IMAGE_SLOTS, PHOTO_SPOTS, VIDEO_SLOTS, VIDEO_ALIASES, MODE_COVER_SLOTS } from '@/data/mediaSlots';
import { MEDIA_MODES, MODE_MEDIA_SECTIONS } from '@/data/modes/modeRegistry';
import { SCENES, SCENE_GROUPS, SCENE_BY_PENALTY_STEP, SCENE_BY_SQUARE } from '@/data/sceneLibrary';
import { GAME_SOUND_SLOTS } from '@/lib/gameSounds';
import { DEFAULTS } from '@/data/brandArt';

export const SURFACE_LABELS = {
  site: '🌐 Site',
  promo: '📣 Promo',
  forms: '📝 Φόρμες',
  tablet: '📟 Tablet',
  tv: '📺 TV',
  mobile: '📱 Κινητό',
  memories: '💌 Αναμνήσεις',
  admin: '🔧 Admin',
};
export const SURFACE_ORDER = Object.keys(SURFACE_LABELS);

export const NEED_LABELS = {
  required: 'Υποχρεωτικό',
  recommended: 'Προτείνεται',
  optional: 'Προαιρετικό',
  inactive: 'Δεν εμφανίζεται πουθενά',
};

export const STATUS_LABELS = {
  ok: '✓ Ανέβηκε',
  default: '◐ Ενσωματωμένη εικόνα',
  missing: '✕ Λείπει',
  broken: '⚠ Σβήστηκε από τον server',
  inactive: '— Δεν χρειάζεται',
};

// Ακριβή σημεία εμφάνισης των σταθερών θέσεων (ελεγμένα στον κώδικα).
const FIXED = {
  emblem: { file: 'brand_emblem.png', need: 'required', surfaces: ['site', 'forms', 'memories'], where: 'Λογότυπο: πάνω μπάρα του Site, κεφαλίδα κάθε φόρμας, σελίδα αναμνήσεων.' },
  poster: { file: 'brand_poster.jpg', need: 'recommended', surfaces: ['site', 'forms', 'promo'], where: 'Εφεδρική εικόνα: όταν ένα mode δεν έχει δική του εικόνα (Site, φόρμες, Promo).' },
  group: { file: 'brand_group.jpg', need: 'recommended', surfaces: ['site'], where: 'Φόντο της τελευταίας ενότητας του Site («Η επόμενη βραδιά σε περιμένει»).' },
  heistNight: { file: 'brand_heist_night.jpg', need: 'optional', surfaces: ['site'], where: 'Εφεδρική εικόνα του Heist Night στο Site, όταν το Arrest & Heist δεν έχει δική του.' },
  invitationBg: { file: 'forms_background.jpg', need: 'recommended', surfaces: ['forms'], where: 'Διακριτικό φόντο πίσω από όλες τις φόρμες.' },
  extraHeistRoom: { file: 'forms_header_arrest_heist.jpg', need: 'optional', surfaces: ['forms'], where: 'Κεφαλίδα της φόρμας Arrest & Heist (αλλιώς η κεντρική εικόνα του mode).' },
  photoHeistNight: { file: 'site_gallery_heist_default.jpg', need: 'optional', surfaces: ['site'], where: 'Πρώτη εικόνα της γκαλερί Heist στο Site.' },
  photoGame: { file: 'site_gallery_pajama_default_1.jpg', need: 'optional', surfaces: ['site'], where: 'Εικόνα της γκαλερί Pajama στο Site.' },
  photoSlippers: { file: 'site_gallery_pajama_default_2.jpg', need: 'optional', surfaces: ['site'], where: 'Εικόνα της γκαλερί Pajama στο Site.' },
  wallpaperPhone: { file: 'wallpaper_phone_9x16.jpg', need: 'optional', surfaces: ['mobile'], where: 'Φόντο της οθόνης του κινητού (/play).' },
  wallpaperTablet: { file: 'wallpaper_tablet_4x3.jpg', need: 'optional', surfaces: ['tablet'], where: 'Φόντο της οθόνης του Tablet.' },
  wallpaperTv: { file: 'wallpaper_tv_16x9.jpg', need: 'optional', surfaces: ['tv'], where: 'Φόντο της TV.' },
  banner: { file: 'admin_banner.jpg', need: 'optional', surfaces: ['admin'], where: 'Banner στο Admin → Στατιστικά.' },
  siteHero: { file: 'site_hero.jpg', need: 'required', surfaces: ['site'], where: 'Μεγάλη εικόνα (ή βίντεο) στην κορυφή της αρχικής του Site.', video: true },
  siteTrailer: { file: 'site_trailer.mp4', need: 'recommended', surfaces: ['site'], where: 'Τρέιλερ στην αρχική του Site (βίντεο ή εικόνα).', video: true },
  tv: { file: 'tv_waiting.jpg', need: 'recommended', surfaces: ['tv'], where: 'Οθόνη αναμονής της TV (πριν ξεκινήσει παρτίδα). Εικόνα ή βίντεο.', video: true },
  promo: { file: 'promo_hero.jpg', need: 'required', surfaces: ['promo'], where: 'Μεγάλη εικόνα (ή βίντεο) στην κορυφή του /promo.', video: true },
  invitation: { file: 'vip_invitation.jpg', need: 'recommended', surfaces: ['forms'], where: 'Κεφαλίδα της προσωπικής VIP πρόσκλησης (/vip/…). Εικόνα ή βίντεο.', video: true },
  gameIntroVideo: { file: 'tv_game_intro.mp4', need: 'optional', surfaces: ['tv'], where: 'TV: παίζει στην αρχή κάθε νέας παρτίδας, όταν το mode δεν έχει δικό του intro.' },
  welcomeVideo: { file: 'tv_welcome.mp4', need: 'optional', surfaces: ['tv'], where: 'TV: όταν συνδέεται σε ενεργή συνεδρία.' },
  countdownVideo: { file: 'tv_countdown.mp4', need: 'optional', surfaces: ['tv'], where: 'TV: αμέσως μετά την «Έναρξη παιχνιδιού».' },
};

// Εναλλακτικά ονόματα αρχείων (όπως βγήκαν από το MEGA prompt) που δέχεται επίσης η «Αυτόματη σύνδεση».
const FILE_ALIASES = {
  villa_takeover_trailer: ['villa_trailer.mp4'], villa_takeover_intro: ['mode_intro_villa.mp4'], villa_takeover_hero: ['villa_hero.jpg'], villa_takeover_cover: ['villa_cover.jpg'],
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`villa_takeover_gallery_0${n}`, [`villa_gallery_0${n}.jpg`]])),
};

// Τα κανονικά ονόματα αρχείων ανά mode — ίδια με αυτά που ψάχνει η «Αυτόματη σύνδεση».
export const modeFileName = (modeId, field, sectionFilename = '') => {
  if (field === 'hero') return `${modeId}_hero.jpg`;
  if (field === 'cover') return `${modeId}_cover.jpg`;
  if (field === 'trailer') return `${modeId}_trailer.mp4`;
  if (field === 'intro') return `${modeId}_intro.mp4`;
  if (field.startsWith('gallery:')) return `${modeId}_gallery_${String(Number(field.slice(8)) + 1).padStart(2, '0')}.jpg`;
  if (field.startsWith('section:')) return sectionFilename || `${modeId}_${field.slice(8)}.jpg`;
  return '';
};

// Σκηνές που εμφανίζονται πραγματικά στο παιχνίδι (βλ. components/modes/ModeArt.jsx → artSceneFor).
const LIVE_SCENE_PREFIXES = [...Object.values(SCENE_BY_PENALTY_STEP), ...Object.values(SCENE_BY_SQUARE)];
export const isLiveScene = (scene) => LIVE_SCENE_PREFIXES.some((prefix) => scene.id === prefix || scene.id.startsWith(prefix));

const isBuiltIn = (url) => typeof url === 'string' && (url.startsWith('/assets/') || url.startsWith('/icons/') || url.startsWith('/brand/'));

// ov: οι ρυθμίσεις media (AppSetting media_overrides), library: [{name,url,kind}] από listMedia().
export function buildMediaManifest(ov = {}, library = null) {
  const known = library ? new Set(library.map((file) => file.url)) : null;
  const clearedImages = !!(ov.clearAllPhotos || ov.clearAllMedia);
  const statusOf = (url, { hasDefault = false, need = 'required' } = {}) => {
    if (need === 'inactive') return url ? 'ok' : 'inactive';
    if (!url) return 'missing';
    if (isBuiltIn(url)) return hasDefault ? 'default' : 'ok';
    if (known && url.startsWith('/media/') && !known.has(url)) return 'broken';
    return 'ok';
  };
  const out = [];
  const push = (entry) => out.push({ kind: 'image', ...entry, status: statusOf(entry.url, entry) });

  // 1 · Ταυτότητα, Site, Promo, φόρμες, wallpapers
  for (const slot of IMAGE_SLOTS.filter((item) => !item.retired)) {
    const fixed = FIXED[slot.id];
    if (!fixed) continue;
    const url = ov[slot.id] || (clearedImages ? '' : DEFAULTS[slot.id] || '');
    push({ id: slot.id, group: 'brand', groupLabel: 'Ταυτότητα, Site & φόρμες', label: slot.label, filename: fixed.file, need: fixed.need, surfaces: fixed.surfaces, where: fixed.where, url, hasDefault: !!DEFAULTS[slot.id] && !ov[slot.id], fix: 'site' });
  }
  for (const slot of PHOTO_SPOTS.filter((item) => !item.retired)) {
    const fixed = FIXED[slot.id];
    if (!fixed) continue;
    const empty = (ov.emptySlots || []).includes(slot.id);
    const url = empty ? '' : (ov[slot.id] || (clearedImages ? '' : DEFAULTS[slot.id] || ''));
    push({ id: slot.id, group: 'brand', groupLabel: 'Ταυτότητα, Site & φόρμες', label: slot.label, filename: fixed.file, need: fixed.need, surfaces: fixed.surfaces, where: fixed.where, url, kind: fixed.video ? 'image/video' : 'image', hasDefault: !!DEFAULTS[slot.id] && !ov[slot.id], fix: 'site' });
  }

  // 2 · Βίντεο TV
  for (const slot of VIDEO_SLOTS) {
    const fixed = FIXED[slot.id];
    push({ id: slot.id, group: slot.group ? `tv_${slot.group}` : 'tv', groupLabel: slot.group === 'stinger' ? 'Βίντεο TV · Stingers' : slot.group === 'show' ? 'Βίντεο TV · Εκπομπή' : 'Βίντεο TV', label: slot.label, filename: fixed?.file || slot.file || `${slot.id}.mp4`, need: fixed?.need || 'optional', surfaces: ['tv'], where: fixed?.where || slot.where, url: ov[slot.id] || '', kind: 'video', fix: 'site', aliases: VIDEO_ALIASES[slot.id] || [] });
  }

  // 3 · Ανά mode
  for (const mode of MEDIA_MODES) {
    const saved = ov.modeMedia?.[mode.id] || {};
    const group = `mode:${mode.id}`;
    const groupLabel = `${mode.icon || '🎮'} ${mode.name}`;
    const coverSlot = MODE_COVER_SLOTS.find((slot) => slot.modeId === mode.id);
    const defaultCover = DEFAULTS[`modeCover_${mode.id}`] || '';
    const cover = saved.coverCleared ? '' : (saved.cover || ov[`modeCover_${mode.id}`] || (clearedImages ? '' : defaultCover));
    push({ id: `${mode.id}:cover`, group, groupLabel, modeId: mode.id, field: 'cover', label: 'Εξώφυλλο', filename: modeFileName(mode.id, 'cover'), need: 'required', surfaces: ['tablet', 'site', 'forms', 'promo'], where: 'Κάρτα επιλογής mode στο Tablet· εφεδρική εικόνα σε Site, φόρμα και Promo.', url: cover, hasDefault: !!coverSlot && !saved.cover && !ov[`modeCover_${mode.id}`], fix: 'modes', aliases: FILE_ALIASES[`${mode.id}_cover`] || [] });
    push({ id: `${mode.id}:hero`, group, groupLabel, modeId: mode.id, field: 'hero', label: 'Κεντρική εικόνα', filename: modeFileName(mode.id, 'hero'), need: 'required', surfaces: ['site', 'promo', 'forms', 'tablet', 'tv', 'mobile'], where: 'Κορυφή της σελίδας του mode στο Site, κάρτα στο Promo, κεφαλίδα φόρμας, Tablet (Νέα βραδιά) και φόντο TV/κινητού όταν η φάση δεν έχει δική της εικόνα.', url: saved.hero || '', fix: 'modes', aliases: FILE_ALIASES[`${mode.id}_hero`] || [] });
    for (const section of MODE_MEDIA_SECTIONS[mode.id] || []) {
      const url = (Array.isArray(saved.sections) ? saved.sections : []).find((item) => item?.id === section.id)?.image || '';
      push({ id: `${mode.id}:section:${section.id}`, group, groupLabel, modeId: mode.id, field: `section:${section.id}`, label: section.group ? section.label : `Φάση · ${section.label}`, filename: modeFileName(mode.id, `section:${section.id}`, section.filename), need: section.need || (section.alt ? 'optional' : 'recommended'), surfaces: section.surfaces || ['tv', 'mobile', 'tablet'], ...(section.kind ? { kind: section.kind } : {}), where: section.where ? section.where : section.alt ? `Εναλλάσσεται ζωντανά με την εικόνα της φάσης «${(MODE_MEDIA_SECTIONS[mode.id] || []).find((s) => s.id === section.alt)?.label || section.alt}» (TV, κινητό).` : 'Εμφανίζεται σε TV και κινητά όταν το παιχνίδι φτάνει σε αυτή τη φάση· και στο Tablet (Νέα βραδιά).', url, fix: 'modes' });
    }
    for (let i = 0; i < 6; i += 1) {
      push({ id: `${mode.id}:gallery:${i}`, group, groupLabel, modeId: mode.id, field: `gallery:${i}`, label: `Gallery ${i + 1}/6`, filename: modeFileName(mode.id, `gallery:${i}`), need: 'recommended', surfaces: ['site'], where: 'Γκαλερί στη σελίδα του mode στο Site.', url: saved.gallery?.[i] || '', fix: 'modes', aliases: FILE_ALIASES[`${mode.id}_gallery_${String(i + 1).padStart(2, '0')}`] || [] });
    }
    push({ id: `${mode.id}:trailer`, group, groupLabel, modeId: mode.id, field: 'trailer', label: 'Βίντεο trailer', filename: modeFileName(mode.id, 'trailer'), need: 'optional', surfaces: ['site', 'tablet'], where: 'Σελίδα του mode στο Site και Tablet (Νέα βραδιά).', url: saved.trailer || '', kind: 'video', fix: 'modes', aliases: FILE_ALIASES[`${mode.id}_trailer`] || [] });
    push({ id: `${mode.id}:intro`, group, groupLabel, modeId: mode.id, field: 'intro', label: 'Intro βίντεο TV', filename: modeFileName(mode.id, 'intro'), need: 'optional', surfaces: ['tv'], where: 'Παίζει στην TV στην αρχή κάθε παρτίδας αυτού του mode (αλλιώς το γενικό intro).', url: saved.intro || '', kind: 'video', fix: 'modes', aliases: FILE_ALIASES[`${mode.id}_intro`] || [] });
  }

  // 4 · Βιβλιοθήκη σκηνών
  for (const scene of SCENES) {
    const live = isLiveScene(scene);
    push({ id: `scene:${scene.id}`, group: 'scenes', groupLabel: 'Βιβλιοθήκη σκηνών', sceneGroup: SCENE_GROUPS[scene.group] || scene.group, label: scene.label, filename: scene.filename, need: live ? 'optional' : 'inactive', surfaces: live ? ['tv', 'mobile'] : [], where: live ? (scene.id.startsWith('ah_') ? 'Arrest & Heist: TV και κινητά τη στιγμή της ποινής αυτού του σταδίου.' : 'Classic: TV και κινητά όταν η παίκτρια πέφτει σε αυτό το τετράγωνο.') : 'Δεν εμφανίζεται ακόμα πουθενά στο παιχνίδι — δεν χρειάζεται να ανέβει.', url: ov.sceneLibrary?.[scene.id] || '', fix: 'scenes' });
  }

  // 5 · Ήχοι
  for (const slot of GAME_SOUND_SLOTS) {
    push({ id: `sound:${slot.id}`, group: 'sounds', groupLabel: 'Ήχοι παιχνιδιού', label: slot.label, filename: `sound_${slot.id.replace('.', '_')}.mp3`, need: 'optional', surfaces: slot.id.startsWith('tv.') ? ['tv'] : ['tablet', 'mobile'], where: `${slot.where}. Χωρίς αρχείο παίζει ο ενσωματωμένος ήχος.`, url: ov.gameSounds?.[slot.id] || '', kind: 'audio', fix: 'site' });
  }
  return out;
}

// Ό,τι λείπει και ΧΡΕΙΑΖΕΤΑΙ (υποχρεωτικό ή προτεινόμενο), ή αρχείο που σβήστηκε.
export const needsAttention = (entry) => entry.status === 'broken' || (entry.status === 'missing' && (entry.need === 'required' || entry.need === 'recommended'));

export function manifestSummary(entries) {
  const live = entries.filter((e) => e.need !== 'inactive');
  return {
    total: live.length,
    ok: live.filter((e) => e.status === 'ok').length,
    defaults: live.filter((e) => e.status === 'default').length,
    missingRequired: live.filter((e) => e.status === 'missing' && e.need === 'required').length,
    missingRecommended: live.filter((e) => e.status === 'missing' && e.need === 'recommended').length,
    missingOptional: live.filter((e) => e.status === 'missing' && e.need === 'optional').length,
    broken: live.filter((e) => e.status === 'broken').length,
    attention: live.filter(needsAttention).length,
  };
}

// Το αρχείο TXT: όλα τα ονόματα αρχείων, ομαδοποιημένα, με το πού εμφανίζεται και την κατάσταση.
export function manifestText(entries, { cardStats = [], date = new Date() } = {}) {
  const sum = manifestSummary(entries);
  const lines = [];
  const rule = '='.repeat(72);
  lines.push('DEAL OF TEMPTATION — ΟΛΑ ΤΑ ΑΡΧΕΙΑ MEDIA (ΦΩΤΟΓΡΑΦΙΕΣ, ΒΙΝΤΕΟ, ΗΧΟΙ)');
  lines.push(`Ημερομηνία: ${date.toLocaleString('el-GR')}`);
  lines.push(rule);
  lines.push('ΠΩΣ ΤΟ ΧΡΗΣΙΜΟΠΟΙΕΙΣ');
  lines.push('1. Δώσε σε κάθε αρχείο ΑΚΡΙΒΩΣ το όνομα της λίστας (μικρά/κεφαλαία δεν πειράζουν).');
  lines.push('   Εικόνες: .jpg / .png / .webp — Βίντεο: .mp4 (ή .mov / .webm) — Ήχοι: .mp3.');
  lines.push('   Η κατάληξη μπορεί να διαφέρει (π.χ. classic_hero.png αντί για .jpg).');
  lines.push('2. Admin → Φωτογραφίες & βίντεο → Βιβλιοθήκη → ανέβασε όλα τα αρχεία μαζί.');
  lines.push('3. Admin → Φωτογραφίες & βίντεο → Χάρτης → «Αυτόματη σύνδεση»: όλα μπαίνουν μόνα τους στη θέση τους.');
  lines.push('   Ή: στον Χάρτη πάτα «Ανέβασμα» δίπλα σε μια θέση για να μπει ένα αρχείο κατευθείαν εκεί.');
  lines.push('');
  lines.push(`ΣΥΝΟΛΟ: ${sum.total} θέσεις · ✓ ${sum.ok} ανεβασμένες · ◐ ${sum.defaults} με ενσωματωμένη εικόνα`);
  lines.push(`ΛΕΙΠΟΥΝ: ${sum.missingRequired} υποχρεωτικές · ${sum.missingRecommended} προτεινόμενες · ${sum.missingOptional} προαιρετικές · ⚠ ${sum.broken} σβησμένες`);
  lines.push(rule);
  const groups = [];
  for (const e of entries) if (!groups.some((g) => g.id === e.group)) groups.push({ id: e.group, label: e.groupLabel });
  for (const g of groups) {
    const items = entries.filter((e) => e.group === g.id);
    lines.push('');
    lines.push(`■ ${g.label.toUpperCase()}`);
    lines.push('-'.repeat(72));
    if (g.id === 'scenes') {
      const live = items.filter((e) => e.need !== 'inactive');
      const inactive = items.filter((e) => e.need === 'inactive');
      lines.push(`  Εμφανίζονται στο παιχνίδι (${live.length}):`);
      for (const e of live) lines.push(`  [${e.status === 'ok' ? 'x' : ' '}] ${e.filename.padEnd(44)} ${e.where}`);
      lines.push('');
      lines.push(`  ΔΕΝ εμφανίζονται ακόμα πουθενά — ΔΕΝ χρειάζεται να ανέβουν (${inactive.length}):`);
      for (const e of inactive) lines.push(`      ${e.filename}`);
      continue;
    }
    for (const e of items) {
      const mark = e.status === 'ok' ? 'x' : e.status === 'default' ? '~' : e.status === 'broken' ? '!' : ' ';
      lines.push(`  [${mark}] ${e.filename.padEnd(44)} ${NEED_LABELS[e.need]}`);
      lines.push(`      ${e.label} → ${e.surfaces.map((s) => SURFACE_LABELS[s].replace(/^\S+\s/, '')).join(', ')}`);
      lines.push(`      ${e.where}`);
    }
  }
  if (cardStats.length) {
    lines.push('');
    lines.push('■ ΕΙΚΟΝΕΣ ΚΑΡΤΩΝ (ΠΡΟΑΙΡΕΤΙΚΕΣ)');
    lines.push('-'.repeat(72));
    lines.push('  Ανεβαίνουν ΑΠΕΥΘΕΙΑΣ σε κάθε κάρτα: Admin → Κάρτες & περιεχόμενο. Δεν χρειάζονται συγκεκριμένο όνομα.');
    lines.push('  Χωρίς εικόνα, η κάρτα δείχνει το εικονίδιό της.');
    for (const c of cardStats) lines.push(`  ${`${c.withImage}/${c.total}`.padStart(7)}  ${c.label}  → ${c.surfaces}`);
  }
  lines.push('');
  lines.push(rule);
  lines.push('[x] ανέβηκε   [~] δείχνει ενσωματωμένη εικόνα (λειτουργεί, μπορείς να την αλλάξεις)   [!] το αρχείο σβήστηκε   [ ] λείπει');
  return lines.join('\n');
}
