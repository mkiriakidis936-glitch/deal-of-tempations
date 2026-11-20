import { base44 } from '@/api/base44Client';
import { staticGameContentRecords } from '@/lib/gameContentStore';
import { defaultRows as pajamaDefaultRows } from '@/lib/pajamaContentStore';
import { COLLECTIONS, MODES_KEY, defaultsOf, fetchModesRecord, saveModesContent } from '@/lib/modesContentStore';

const PLACEHOLDER = /Safe Digital Challenge|SAFE DIGITAL CHALLENGE|Προαιρετικ[όή] ψηφιακ[όή] (challenge|δοκιμασία)/;
const hasPlaceholder = (value) => PLACEHOLDER.test(JSON.stringify(value ?? ''));

async function repairGameContent() {
  const { items = [] } = await base44.entities.GameContent.filter({}, { limit: 1000 });
  const defaults = new Map(staticGameContentRecords().map((record) => [`${record.category}|${record.itemId}`, record.data]));
  let fixed = 0;
  for (const row of items) {
    const original = defaults.get(`${row.category}|${row.itemId}`);
    if (!original || !hasPlaceholder(row.data) || hasPlaceholder(original)) continue;
    await base44.entities.GameContent.update(row.id, { data: original });
    fixed += 1;
  }
  return fixed;
}

async function repairPajamaContent() {
  const { items = [] } = await base44.entities.PajamaContent.filter({}, { limit: 500 });
  const defaults = new Map(pajamaDefaultRows().map((row) => [row.itemId, row]));
  let fixed = 0;
  for (const row of items) {
    const original = defaults.get(row.itemId);
    if (!original || !(hasPlaceholder(row.title) || hasPlaceholder(row.text))) continue;
    await base44.entities.PajamaContent.update(row.id, { title: original.title || '', text: original.text || '' });
    fixed += 1;
  }
  return fixed;
}

async function repairModesContent() {
  const record = await fetchModesRecord();
  const saved = record?.value;
  if (!saved || typeof saved !== 'object') return 0;
  let fixed = 0;
  const next = { ...saved };
  for (const collection of COLLECTIONS) {
    const list = saved[collection.id];
    if (!Array.isArray(list)) continue;
    const defaults = defaultsOf(collection.id);
    next[collection.id] = list.map((item, index) => {
      if (!hasPlaceholder(item)) return item;
      const original = collection.strings
        ? defaults[index]
        : defaults.find((entry) => entry.id && entry.id === item?.id) || null;
      if (original === undefined || original === null) return item;
      fixed += 1;
      return collection.strings ? original : { ...original, ...(item?.image ? { image: item.image } : {}) };
    });
  }
  if (fixed) await saveModesContent(next);
  return fixed;
}

export async function repairSanitizedContent() {
  const [classic, pajama, modes] = await Promise.all([repairGameContent(), repairPajamaContent(), repairModesContent()]);
  return { classic, pajama, modes, total: classic + pajama + modes, key: MODES_KEY };
}
