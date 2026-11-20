import { base44 } from '@/api/base44Client';

const KEY = 'intake_form_enabled';

export async function isIntakeEnabled() {
  try {
    const { items } = await base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 });
    return items && items.length > 0 ? items[0].value === 'true' : false;
  } catch (e) {
    console.error('Flag read error', e);
    return false;
  }
}

export async function setIntakeEnabled(enabled) {
  try {
    const { items } = await base44.entities.AppSetting.filter({ key: KEY }, { limit: 1 });
    if (items && items.length > 0) {
      await base44.entities.AppSetting.update(items[0].id, { value: String(enabled) });
    } else {
      await base44.entities.AppSetting.create({ key: KEY, value: String(enabled) });
    }
    return enabled;
  } catch (e) {
    console.error('Flag write error', e);
    return enabled;
  }
}