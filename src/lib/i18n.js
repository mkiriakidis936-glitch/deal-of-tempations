export const LANGUAGES = [
  { id: 'el', label: 'Ελληνικά' },
  { id: 'en', label: 'English' },
  { id: 'bg', label: 'Български' },
  { id: 'tr', label: 'Türkçe' },
];

export function applyTranslationKeys(source, namespace, dictionary, language) {
  const result = structuredClone(source || {});
  Object.entries(dictionary || {}).forEach(([key, values]) => {
    const prefix = `${namespace}.`;
    if (!key.startsWith(prefix) || typeof values?.[language] !== 'string') return;
    const path = key.slice(prefix.length).split('.');
    let target = result;
    for (const part of path.slice(0, -1)) {
      const index = /^\\d+$/.test(part) ? Number(part) : part;
      if (target == null || target[index] == null) return;
      target = target[index];
    }
    const last = path[path.length - 1];
    const finalKey = /^\\d+$/.test(last) ? Number(last) : last;
    if (target != null && Object.prototype.hasOwnProperty.call(target, finalKey)) {
      target[finalKey] = values[language];
    }
  });
  return result;
}

export function translateAdminLabel(dictionary, key, fallback, language) {
  const value = dictionary?.[`admin.${key}`]?.[language];
  return typeof value === 'string' && value ? value : fallback;
}
