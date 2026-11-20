import { base44 } from '@/api/base44Client';

const KEY = 'active_session';

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
  if (!code) return;
  try {
    const { items } = await base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 });
    if (items?.length) await base44.entities.AppSetting.update(items[0].id, { value: code });
    else await base44.entities.AppSetting.create({ key: KEY, value: code });
  } catch (e) {
    console.error('active_session write failed', e);
  }
}

export function subscribeActiveSession(onCode) {
  return base44.entities.AppSetting.subscribe((event) => {
    if (event?.type === 'delete') return;
    if (event?.data?.key !== KEY || !event?.data?.value) return;
    onCode(event.data.value);
  });
}