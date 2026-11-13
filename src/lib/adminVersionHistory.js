import { base44 } from '@/api/base44Client';

export async function saveAdminSettingVersion(settingKey, fallbackValue) {
  const key = `admin_setting_versions_${settingKey}`;
  const result = await base44.entities.AppSetting.filter({ key }, { limit: 1 });
  const record = result.items?.[0] || null;
  const snapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    value: JSON.parse(JSON.stringify(currentValue)),
  };
  const items = [snapshot, ...(record?.value?.items || [])].slice(0, 20);
  const value = { items };
  if (record?.id) await base44.entities.AppSetting.update(record.id, { value });
  else await base44.entities.AppSetting.create({ key, value });
}

export async function loadAdminSettingVersions(settingKey) {
  const key = `admin_setting_versions_${settingKey}`;
  const result = await base44.entities.AppSetting.filter({ key }, { limit: 1 });
  return result.items?.[0]?.value?.items || [];
}

export async function restoreAdminSettingVersion(settingKey, snapshot) {
  const result = await base44.entities.AppSetting.filter({ key: settingKey }, { limit: 1 });
  const record = result.items?.[0] || null;
  if (record?.id) await base44.entities.AppSetting.update(record.id, { value: snapshot.value });
  else await base44.entities.AppSetting.create({ key: settingKey, value: snapshot.value });
  return snapshot.value;
}
