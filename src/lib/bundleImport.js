import { Unzip, UnzipInflate, UnzipPassThrough } from 'fflate';

// Εισαγωγή «πακέτου» media (ZIP ή φάκελος) στο Admin → Χάρτης media.
// Κρατά ΜΟΝΟ τα αρχεία που ταιριάζουν σε θέση (wanted), ώστε να μη φορτώνεται άσκοπα όλο το ZIP στη μνήμη.

export const baseName = (path) => String(path).split('/').pop() || '';
// Φάκελοι που δεν ανεβαίνουν: εναλλακτικές (98), αρχείο/έξτρα (99), αναφορές για Gemini, σκουπίδια macOS.
export const skipPath = (path) => /(^|\/)(98_|99_|00_REF|__MACOSX)/i.test(path) || /(^|\/)\./.test(path);

export async function filesFromZip(zipFile, wanted = () => true) {
  const out = [];
  const pending = [];
  const uz = new Unzip();
  uz.register(UnzipInflate);
  uz.register(UnzipPassThrough);
  uz.onfile = (entry) => {
    const name = entry.name;
    if (name.endsWith('/') || skipPath(name) || !wanted(name)) return;
    const chunks = [];
    pending.push(new Promise((resolve, reject) => {
      entry.ondata = (err, data, final) => {
        if (err) { reject(err); return; }
        chunks.push(data);
        if (final) { out.push(new File(chunks, baseName(name))); resolve(); }
      };
    }));
    entry.start();
  };
  const reader = zipFile.stream().getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) { uz.push(new Uint8Array(0), true); break; }
    uz.push(value);
  }
  await Promise.all(pending);
  return out;
}
