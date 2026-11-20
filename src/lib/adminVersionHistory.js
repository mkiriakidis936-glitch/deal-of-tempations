import { base44 } from '@/api/base44Client';

export const VERSIONED_SETTINGS = [
  { key: 'admin_global_design', label: 'Σχεδίαση εφαρμογής' },
  { key: 'modes_content', label: 'Περιεχόμενο Modes (κάρτες, ερωτήσεις, αποστολές)' },
  { key: 'admin_form_questions', label: 'Ερωτήσεις φορμών' },
  { key: 'admin_custom_scenarios', label: 'Σενάρια παιχνιδιού' },
  { key: 'achievement_definitions', label: 'Επιτεύγματα' },
];

const LIMIT = 30;
const historyKey = (settingKey) => `admin_setting_versions_${settingKey}`;

async function findSetting(key) {
  const result = await base44.entities.AppSetting.filter({ key }, { limit: 1 });
  return result.items?.[0] || null;
}

export async function saveAdminSettingVersion(settingKey, fallbackValue, note = '') {
  const [record, current, user] = await Promise.all([
    findSetting(historyKey(settingKey)),
    findSetting(settingKey),
    base44.auth.me().catch(() => null),
  ]);
  const currentValue = current?.value ?? fallbackValue;
  if (currentValue === undefined) return;
  const items = record?.value?.items || [];
  const lastNumber = items.reduce((max, item) => Math.max(max, Number(item.number) || 0), items.length);
  const snapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    number: lastNumber + 1,
    createdAt: new Date().toISOString(),
    changedBy: user?.email || user?.user?.email || 'Admin',
    note,
    value: JSON.parse(JSON.stringify(currentValue)),
  };
  const value = { items: [snapshot, ...items].slice(0, LIMIT) };
  if (record?.id) await base44.entities.AppSetting.update(record.id, { value });
  else await base44.entities.AppSetting.create({ key: historyKey(settingKey), value });
}

export async function loadAdminSettingVersions(settingKey) {
  const record = await findSetting(historyKey(settingKey));
  const items = record?.value?.items || [];
  return items.map((item, index) => ({ ...item, number: item.number || items.length - index }));
}

export async function restoreAdminSettingVersion(settingKey, snapshot) {
  const record = await findSetting(settingKey);
  if (record?.id) await base44.entities.AppSetting.update(record.id, { value: snapshot.value });
  else await base44.entities.AppSetting.create({ key: settingKey, value: snapshot.value });
  return snapshot.value;
}
