// Αυτόματη σύνδεση αρχείων βιβλιοθήκης → θέσεις του Admin, με βάση το όνομα αρχείου.
// Ο server ονομάζει κάθε upload  <ts36>-<6hex>-<slug>.<ext>  (slug: μικρά a-z0-9 με παύλες),
// άρα το «classic_setup.jpg» γίνεται «mf3k2a-1b2c3d-classic-setup.jpg».
// Ίδιο με το slugOf του server/media.js: μικρά a-z0-9, παύλες, ΚΟΒΕΤΑΙ στους 40 χαρακτήρες.
export const slug = (s) => (String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file');
const noExt = (s) => String(s).replace(/\.[a-z0-9]+$/i, '');
export const stripPrefix = (name) => noExt(name).replace(/^[a-z0-9]+-[a-f0-9]{6}-/, '');
const key = (filename) => slug(noExt(filename));

// Όλες οι θέσεις ενός mode που μπορούν να γεμίσουν από όνομα αρχείου.
export function expectedNames(modes, sectionsByMode, coverSlots = [], scenes = []) {
  const out = [];
  for (const m of modes) {
    const id = m.id;
    const cover = coverSlots.find((c) => c.modeId === id)?.filename;
    out.push({ modeId: id, field: 'cover', key: key(!cover || cover === 'cover.jpg' ? `${id}_cover` : cover) });
    out.push({ modeId: id, field: 'hero', key: key(`${id}_hero`) });
    for (const s of sectionsByMode[id] || []) out.push({ modeId: id, field: `section:${s.id}`, key: key(s.filename) });
    const gp = id === 'lockdown' ? 'lockdown' : id === 'beach_bar' ? 'beach' : id;
    for (let i = 0; i < 6; i += 1) out.push({ modeId: id, field: `gallery:${i}`, key: key(`${gp}_gallery_${String(i + 1).padStart(2, '0')}`) });
  }
  for (const sc of scenes) out.push({ modeId: '', field: `scene:${sc.id}`, key: key(sc.filename) });
  return out;
}

// library: [{name,url,kind,modified}] από listMedia().
export function planAutoLinks(library, expected) {
  const byKey = new Map();
  for (const f of library.filter((x) => x.kind === 'image' || x.kind === 'graphic')) {
    const k = stripPrefix(f.name);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(f);
  }
  const links = []; const ambiguous = []; const used = new Set();
  for (const e of expected) {
    const hits = byKey.get(e.key);
    if (!hits) continue;
    const newest = [...hits].sort((a, b) => (b.modified || 0) - (a.modified || 0))[0];
    if (hits.length > 1) ambiguous.push({ ...e, count: hits.length });
    links.push({ modeId: e.modeId, field: e.field, url: newest.url, name: newest.name });
    used.add(e.key);
  }
  const unmatched = [...byKey.keys()].filter((k) => !used.has(k));
  return { links, ambiguous, unmatched };
}

// Εφαρμόζει links στο saved ενός mode. Δεν πατά ήδη συνδεδεμένη θέση εκτός αν overwrite=true.
export function applyLinks(saved = {}, links, { overwrite = false } = {}) {
  const next = { ...saved, sections: [...(saved.sections || [])], gallery: Array.from({ length: 6 }, (_, i) => saved.gallery?.[i] || '') };
  for (const l of links) {
    if (l.field === 'hero' || l.field === 'cover') {
      if (overwrite || !next[l.field]) next[l.field] = l.url;
      if (l.field === 'cover' && next.cover === l.url) next.coverCleared = false;
    } else if (l.field.startsWith('gallery:')) {
      const i = Number(l.field.slice(8));
      if (overwrite || !next.gallery[i]) next.gallery[i] = l.url;
    } else if (l.field.startsWith('section:')) {
      const id = l.field.slice(8); const at = next.sections.findIndex((s) => s.id === id);
      if (at === -1) next.sections.push({ id, image: l.url });
      else if (overwrite || !next.sections[at].image) next.sections[at] = { ...next.sections[at], image: l.url };
    }
  }
  return next;
}

// Σκηνές: { [sceneId]: url } — ξεχωριστό από τα modes.
export function applySceneLinks(saved = {}, links, { overwrite = false } = {}) {
  const next = { ...saved };
  for (const l of links) {
    if (!l.field.startsWith('scene:')) continue;
    const id = l.field.slice(6);
    if (overwrite || !next[id]) next[id] = l.url;
  }
  return next;
}
