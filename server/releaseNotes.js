// Οι σημειώσεις μιας έκδοσης από το CHANGELOG.md (ενότητα «## X.Y.Z»), για την οθόνη «Ενημέρωση λογισμικού».
export function releaseNotesFor(changelog, version) {
  if (!changelog || !version) return '';
  const lines = String(changelog).split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${version.replace(/\./g, '\\.')}(\\s|$)`).test(line));
  if (start < 0) return '';
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s+/.test(line));
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
}
