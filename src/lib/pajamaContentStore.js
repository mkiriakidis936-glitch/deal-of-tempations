import { base44 } from '@/api/base44Client';
import { PAJAMA_CATEGORIES, PAJAMA_SECRETS } from '@/data/pajamaContent';

function defaultRows() {
  const cards = PAJAMA_CATEGORIES.flatMap((cat) =>
    cat.cards.map((c, i) => ({
      kind: 'card',
      categoryId: cat.id,
      itemId: c.id,
      title: c.title || '',
      text: c.text,
      success: c.success || 2,
      fail: c.fail ?? 1,
      timer: c.timer || 0,
      scored: !!c.scored,
      effect: c.effect || '',
      order: i,
    }))
  );
  const secrets = PAJAMA_SECRETS.map((text, i) => ({
    kind: 'secret',
    categoryId: 'secrets',
    itemId: `sec_${i + 1}`,
    text,
    order: i,
  }));
  return [...cards, ...secrets];
}

export function groupContent(rows) {
  const cards = rows.filter((r) => r.kind === 'card');
  const categories = PAJAMA_CATEGORIES.map((cat) => ({
    ...cat,
    cards: cards
      .filter((r) => r.categoryId === cat.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((r) => ({
        id: r.id,
        title: r.title || undefined,
        text: r.text || '',
        scored: r.scored !== false,
        success: r.success || 2,
        fail: r.fail ?? 1,
        timer: r.timer || undefined,
        effect: r.effect || undefined,
      })),
  }));
  const secrets = rows
    .filter((r) => r.kind === 'secret')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((r) => r.text)
    .filter(Boolean);
  return { categories, secrets };
}

export function defaultPajamaContent() {
  return groupContent(defaultRows());
}

export async function listPajamaRows() {
  let { items } = await base44.entities.PajamaContent.filter({}, { sort: 'order', limit: 500 });
  if (!items || items.length === 0) {
    items = await base44.entities.PajamaContent.bulkCreate(defaultRows());
    return items || [];
  }
  const existing = new Set(items.map((i) => i.itemId).filter(Boolean));
  const missing = defaultRows().filter((r) => !existing.has(r.itemId));
  if (missing.length > 0) {
    const created = await base44.entities.PajamaContent.bulkCreate(missing);
    items = [...items, ...(created || [])];
  }
  return items || [];
}

export async function loadPajamaContent() {
  return groupContent(await listPajamaRows());
}

export function createPajamaRow(data) {
  return base44.entities.PajamaContent.create(data);
}

export function updatePajamaRow(id, data) {
  return base44.entities.PajamaContent.update(id, data);
}

export function deletePajamaRow(id) {
  return base44.entities.PajamaContent.delete(id);
}