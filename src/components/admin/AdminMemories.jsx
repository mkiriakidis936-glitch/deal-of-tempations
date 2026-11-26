import React, { useEffect, useState } from 'react';
import { appApi } from '@/api/apiClient';
import { modeDisplayName } from '@/data/gameConfig';
import { uploadMedia, deleteMedia } from '@/lib/media';

// Admin: σελίδα αναμνήσεων για κάθε αρχειοθετημένη βραδιά (link, μήνυμα, φωτογραφίες με συγκατάθεση όλων).
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

export default function AdminMemories() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => appApi.entities.SessionArchive.filter({}, { sort: '-created_date', limit: 100 }).then((r) => setItems(r.items || [])).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);

  async function save(item, patch) {
    const updated = await appApi.entities.SessionArchive.update(item.id, patch);
    setItems((list) => list.map((x) => (x.id === item.id ? updated : x)));
  }
  const linkOf = (item) => `${window.location.origin}/memories/${item.shareToken}`;
  async function copy(item) {
    const target = item.shareToken ? item : await appApi.entities.SessionArchive.update(item.id, { shareToken: newToken() });
    if (!item.shareToken) setItems((list) => list.map((x) => (x.id === item.id ? target : x)));
    try { await navigator.clipboard.writeText(linkOf(target)); setMsg('Το link αντιγράφηκε ✓'); } catch { setMsg(linkOf(target)); }
  }
  async function addPhotos(item, files) {
    setMsg('Ανέβασμα…');
    const urls = [];
    for (const file of files) { try { const up = await uploadMedia(file); if (up?.url) urls.push(up.url); } catch (e) { setMsg(e.message); } }
    await save(item, { memoryPhotos: [...(item.memoryPhotos || []), ...urls].slice(0, 30) });
    setMsg(`Προστέθηκαν ${urls.length} φωτογραφίες.`);
  }

  const hasPage = (item) => !!(item.shareToken || item.memoryMessage || (item.memoryPhotos || []).length);

  // Σβήνει ΤΗ ΣΕΛΙΔΑ (link, μήνυμα, φωτογραφίες). Η βραδιά μένει στα στατιστικά και στο ιστορικό.
  async function clearPage(item, others = items) {
    const stillUsed = new Set(others.filter((x) => x.id !== item.id).flatMap((x) => x.memoryPhotos || []));
    for (const src of item.memoryPhotos || []) {
      const name = String(src).split('/media/')[1];
      if (name && !stillUsed.has(src)) { try { await deleteMedia(decodeURIComponent(name)); } catch { /* ήδη διαγραμμένο */ } }
    }
    const updated = await appApi.entities.SessionArchive.update(item.id, { shareToken: '', memoryMessage: '', memoryPhotos: [], photosConsent: false });
    setItems((list) => list.map((x) => (x.id === item.id ? updated : x)));
  }
  async function removeOne(item) {
    if (!window.confirm(`Διαγραφή της σελίδας αναμνήσεων «${item.sessionCode}»;\n\nΟ σύνδεσμος σταματά να ανοίγει, σβήνονται το μήνυμα και ${(item.memoryPhotos || []).length} φωτογραφίες. Η βραδιά μένει στα στατιστικά. Δεν αναιρείται.`)) return;
    try { await clearPage(item); setMsg('Η σελίδα διαγράφηκε ✓'); setOpen(''); } catch (e) { setMsg(e.message || 'Η διαγραφή απέτυχε.'); }
  }
  async function removeAll() {
    const pages = items.filter(hasPage);
    if (!pages.length) return;
    if (!window.confirm(`Διαγραφή ΟΛΩΝ των σελίδων αναμνήσεων (${pages.length});\n\nΟι σύνδεσμοι σταματούν να ανοίγουν και σβήνονται μηνύματα και φωτογραφίες. Οι βραδιές μένουν στα στατιστικά. Δεν αναιρείται.`)) return;
    setMsg('Διαγραφή…');
    try { for (const item of pages) await clearPage(item, items); setMsg(`Διαγράφηκαν ${pages.length} σελίδες ✓`); setOpen(''); }
    catch (e) { setMsg(`Η διαγραφή σταμάτησε: ${e.message || 'σφάλμα'}`); }
  }

  if (!items) return <div className="text-white/60">Φόρτωση…</div>;
  return (
    <div className="space-y-3 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[17px] font-semibold">💌 Σελίδες αναμνήσεων</div>
        {items.some(hasPage) && <button type="button" onClick={removeAll} className="h-9 rounded-full bg-[#FF453A]/15 px-4 text-sm font-semibold text-[#FF8A80]">🗑 Διαγραφή όλων των σελίδων</button>}
      </div>
      <p className="text-sm text-white/60">Μετά από κάθε βραδιά: στείλε στις παίκτριες το ιδιωτικό link με νικήτρια, παίκτριες και στιγμές. Οι φωτογραφίες εμφανίζονται μόνο αν τσεκάρεις ότι συμφώνησαν όλες.</p>
      {msg && <div className="rounded-xl bg-[#2C2C2E] px-3 py-2 text-sm">{msg}</div>}
      <div className="overflow-hidden rounded-2xl bg-[#1C1C1E]">
        {items.length === 0 && <div className="p-4 text-white/55">Δεν υπάρχουν αρχειοθετημένες βραδιές ακόμα.</div>}
        {items.map((item) => (
          <div key={item.id} className="border-b border-white/10 last:border-0">
            <button type="button" onClick={() => setOpen(open === item.id ? '' : item.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
              <span><span className="block font-semibold">{modeDisplayName(item.mode)} · {item.sessionCode}</span><span className="text-[13px] text-white/55">{item.eventDate || ''}{item.winner ? ` · 👑 ${item.winner}` : ''} · {(item.playerNames || []).length} παίκτριες</span></span>
              <span className="text-white/40">{open === item.id ? '−' : '›'}</span>
            </button>
            {open === item.id && (
              <div className="space-y-3 px-4 pb-4">
                <textarea rows={3} defaultValue={item.memoryMessage || ''} onBlur={(e) => save(item, { memoryMessage: e.target.value.slice(0, 600) })} placeholder="Μήνυμα για τις παίκτριες (προαιρετικό)…" className="w-full rounded-xl bg-[#2C2C2E] px-3 py-2.5 text-[15px]" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.photosConsent === true} onChange={(e) => save(item, { photosConsent: e.target.checked })} /> Όλες συμφώνησαν να εμφανιστούν οι φωτογραφίες</label>
                <div className="flex flex-wrap gap-2">
                  {(item.memoryPhotos || []).map((src) => (
                    <div key={src} className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#2C2C2E]">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button type="button" aria-label="Αφαίρεση" onClick={() => save(item, { memoryPhotos: (item.memoryPhotos || []).filter((u) => u !== src) })} className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs">✕</button>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl bg-[#2C2C2E] text-2xl text-white/60">＋<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(item, [...e.target.files])} /></label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => copy(item)} className="h-11 rounded-full bg-[#E8C26B] px-5 font-bold text-black">🔗 Αντιγραφή link</button>
                  {item.shareToken && <a href={linkOf(item)} target="_blank" rel="noreferrer" className="flex h-11 items-center rounded-full bg-[#2C2C2E] px-5 font-semibold text-[#0A84FF]">Προβολή</a>}
                  {hasPage(item) && <button type="button" onClick={() => removeOne(item)} className="h-11 rounded-full bg-[#FF453A]/15 px-5 font-semibold text-[#FF8A80]">🗑 Διαγραφή σελίδας</button>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
