import { base44 } from '@/api/base44Client';

const KEY = 'active_session';
let activeSessionWriteQueue = Promise.resolve();

export async function getActiveSessionCode() {
  try {
    const { items } = await base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 });
    return items?.[0]?.value || '';
  } catch (e) {
    console.error('active_session read failed', e);
    return '';
  }
}

export async function setActiveSessionCode(code) {
  const nextCode = String(code || '').trim().toUpperCase();
  if (!nextCode) return;
  activeSessionWriteQueue = activeSessionWriteQueue
    .catch(() => {})
    .then(async () => {
      const { items } = await base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 });
      const current = items?.[0] || null;
      if (current?.value === nextCode) return;
      if (current?.id) await base44.entities.AppSetting.update(current.id, { value: nextCode });
      else await base44.entities.AppSetting.create({ key: KEY, value: nextCode });
    })
    .catch((error) => {
      console.error('active_session write failed', error);
    });
  return activeSessionWriteQueue;
}

export function subscribeActiveSession(onCode) {
  return base44.entities.AppSetting.subscribe((event) => {
    if (event?.data?.key !== KEY) return;
    if (event.type === 'delete') { onCode(''); return; }
    if (event?.data?.value) onCode(String(event.data.value).trim().toUpperCase());
  });
}