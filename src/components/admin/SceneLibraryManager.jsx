import React, { useState } from 'react';
import { SCENES, SCENE_GROUPS } from '@/data/sceneLibrary';
import { expectedNames, planAutoLinks, applySceneLinks } from '@/lib/autoLink';

// Βιβλιοθήκη σκηνών: οι εικόνες «στιγμών» που δεν είναι cover/hero/ενότητα/gallery. Αποθηκεύονται ως { [sceneId]: url }.
export default function SceneLibraryManager({ value = {}, files = [], onSave, disabled = false }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const images = files.filter((file) => file.kind === 'image' || file.kind === 'graphic');
  const linked = SCENES.filter((s) => value[s.id]).length;

  const save = async (next, message) => {
    setBusy(true); setError(''); setNotice('');
    try { await onSave(next); setNotice(message); } catch (e) { setError(e?.message || 'Δεν αποθηκεύτηκε.'); } finally { setBusy(false); }
  };
  const autoLink = () => {
    const plan = planAutoLinks(files, expectedNames([], {}, [], SCENES));
    if (!plan.links.length) { setError('Δεν βρέθηκε αρχείο στη βιβλιοθήκη με όνομα σκηνής (π.χ. classic_sq_police.jpg).'); setNotice(''); return; }
    const next = applySceneLinks(value, plan.links);
    if (JSON.stringify(next) === JSON.stringify(value)) { setNotice(`Βρέθηκαν ${plan.links.length} αρχεία, αλλά όλες οι σκηνές τους είναι ήδη συνδεδεμένες.`); return; }
    save(next, `Αυτόματη σύνδεση: ${plan.links.length} σκηνές ταίριαξαν (οι ήδη συνδεδεμένες δεν άλλαξαν).`);
  };
  const setScene = (id, url) => { const next = { ...value }; if (url) next[id] = url; else delete next[id]; save(next, 'Η σκηνή αποθηκεύτηκε.'); };

  return (
    <section className="space-y-3 rounded-3xl bg-[#1C1C1E] p-4 text-[#F5F1E8] sm:p-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E8C26B]">Βιβλιοθήκη σκηνών</div>
        <h2 className="mt-1 text-xl font-bold">Σκηνές παιχνιδιού · {linked}/{SCENES.length} συνδεδεμένες</h2>
        <p className="mt-1 text-xs text-white/60">Στιγμές όπως οι ποινές του Arrest &amp; Heist και τα τετράγωνα του Classic. Όπου το παιχνίδι έχει γεγονός (στάδιο ποινής 1–4, αστυνομία, μαύρη αγορά), η σκηνή εμφανίζεται ζωντανά σε TV και κινητά· οι υπόλοιπες μένουν διαθέσιμες στη βιβλιοθήκη.</p>
        <button type="button" disabled={disabled || busy} onClick={autoLink} className="mt-3 h-10 rounded-full bg-[#E8C26B] px-4 text-sm font-bold text-black disabled:opacity-50">🔗 Αυτόματη σύνδεση σκηνών</button>
      </div>
      {Object.entries(SCENE_GROUPS).map(([group, title]) => {
        const items = SCENES.filter((s) => s.group === group);
        if (!items.length) return null;
        return (
          <details key={group} className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer text-sm font-bold">{title} · {items.filter((s) => value[s.id]).length}/{items.length}</summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((scene) => (
                <div key={scene.id} className="space-y-1.5">
                  <div className={`relative overflow-hidden rounded-xl bg-black ${scene.ratio === '4:5' ? 'aspect-[4/5]' : 'aspect-video'}`}>
                    {value[scene.id] ? <img src={value[scene.id]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[11px] text-white/40">Εκκρεμεί αρχείο</div>}
                  </div>
                  <div className="truncate text-[11px] font-semibold" title={scene.filename}>{scene.label}</div>
                  <select aria-label={`${scene.label} — από τη βιβλιοθήκη`} value="" disabled={disabled || busy} onChange={(e) => e.target.value && setScene(scene.id, e.target.value)} className="h-9 w-full rounded-full border border-white/10 bg-[#2C2C2E] px-2 text-xs">
                    <option value="">Από βιβλιοθήκη…</option>
                    {images.map((f) => <option key={f.url} value={f.url}>{f.name}</option>)}
                  </select>
                  {value[scene.id] && <button type="button" disabled={disabled || busy} onClick={() => setScene(scene.id, '')} className="text-[11px] text-white/55 underline">Αφαίρεση</button>}
                </div>
              ))}
            </div>
          </details>
        );
      })}
      {(error || notice) && <div className="rounded-2xl bg-black/30 px-4 py-3 text-sm" role="status">{error ? <span className="text-[#FF8A80]">{error}</span> : notice}</div>}
    </section>
  );
}
