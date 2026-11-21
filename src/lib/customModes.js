import { base44 } from '@/api/base44Client';
import { NEW_MODES, MODE_THEMES } from '@/data/modes/modeRegistry';
import { GAME_MODES } from '@/data/gameConfig';
import { saveAdminSettingVersion } from '@/lib/adminVersionHistory';

// Modes που φτιάχνει η διοργανώτρια από το Admin → Κατασκευαστής modes.
// Αποθηκεύονται στο AppSetting «custom_board_modes» και τρέχουν στην κοινή παιχνιδομηχανή.
export const CUSTOM_MODES_KEY = 'custom_board_modes';
export { CUSTOM_PREFIX, SQUARE_IDS, isCustomMode, newCustomMode, normalizeCustomMode, customMinutes, rulesFromCustom } from '@/lib/customModeRules';
import { isCustomMode, normalizeCustomMode, customMinutes } from '@/lib/customModeRules';

let registry = [];
export const customModes = () => registry;
export const customModeById = (id) => registry.find((mode) => mode.id === id) || null;

export function registerCustomModes(list = []) {
  const clean = list.map(normalizeCustomMode).filter((mode) => mode.active);
  registry = clean;
  for (let i = NEW_MODES.length - 1; i >= 0; i -= 1) if (isCustomMode(NEW_MODES[i].id)) NEW_MODES.splice(i, 1);
  for (let i = GAME_MODES.length - 1; i >= 0; i -= 1) if (isCustomMode(GAME_MODES[i].id)) GAME_MODES.splice(i, 1);
  for (const mode of clean) {
    const minutes = customMinutes(mode);
    NEW_MODES.push({ id: mode.id, name: mode.name, icon: mode.icon, desc: mode.desc || 'Παιχνίδι από τον κατασκευαστή modes.', min: mode.min, max: mode.max, acts: ['lounge'], actDurations: { lounge: minutes }, minutes, custom: true });
    GAME_MODES.push({ id: mode.id, name: mode.name, icon: mode.icon, desc: mode.desc });
    MODE_THEMES[mode.id] = MODE_THEMES.marathon_4h;
  }
  return clean;
}

export async function fetchCustomModesRecord() {
  const { items } = await base44.entities.AppSetting.filter({ key: CUSTOM_MODES_KEY }, { limit: 1 });
  return items?.[0] || null;
}

let loading = null;
export function loadCustomModes(force = false) {
  if (!loading || force) {
    loading = fetchCustomModesRecord()
      .then((record) => registerCustomModes(record?.value?.items || []))
      .catch(() => registerCustomModes([]));
  }
  return loading;
}

export async function saveCustomModes(items) {
  const clean = items.map(normalizeCustomMode);
  const record = await fetchCustomModesRecord();
  if (record?.id) {
    await saveAdminSettingVersion(CUSTOM_MODES_KEY, record.value);
    await base44.entities.AppSetting.update(record.id, { value: { items: clean } });
  } else {
    await base44.entities.AppSetting.create({ key: CUSTOM_MODES_KEY, value: { items: clean } });
  }
  registerCustomModes(clean);
  loading = Promise.resolve(clean);
  return clean;
}

export function subscribeCustomModes(onChange) {
  return base44.entities.AppSetting.subscribe((event) => {
    if (event?.type === 'resync') { loadCustomModes(true).then(onChange); return; }
    if (event?.data?.key !== CUSTOM_MODES_KEY) return;
    registerCustomModes(event.data.value?.items || []);
    onChange();
  });
}
