import { appApi } from '@/api/apiClient';

const KEY = 'active_session';
let activeSessionWriteQueue = Promise.resolve();

export async function getActiveSessionCode() {
  try {
    const { items } = await appApi.entities.AppSetting.filter({ key: KEY }, { limit: 1 });
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
      // Έως 3 προσπάθειες: αν αποτύχει η εγγραφή, τα κινητά χωρίς κωδικό θα πήγαιναν σε λάθος βραδιά.
      for (let attempt = 0; ; attempt += 1) {
        try {
          const { items } = await appApi.entities.AppSetting.filter({ key: KEY }, { limit: 1 });
          const current = items?.[0] || null;
          if (current?.value === nextCode) return;
          if (current?.id) await appApi.entities.AppSetting.update(current.id, { value: nextCode });
          else await appApi.entities.AppSetting.create({ key: KEY, value: nextCode });
          return;
        } catch (error) {
          if (attempt >= 2 || error?.status === 401 || error?.status === 403) throw error;
          await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        }
      }
    })
    .catch((error) => {
      console.error('active_session write failed', error);
    });
  return activeSessionWriteQueue;
}

export function subscribeActiveSession(onCode) {
  return appApi.entities.AppSetting.subscribe((event) => {
    if (event?.data?.key !== KEY) return;
    if (event.type === 'delete') { onCode(''); return; }
    if (event?.data?.value) onCode(String(event.data.value).trim().toUpperCase());
  });
}