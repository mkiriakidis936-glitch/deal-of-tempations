import React, { useEffect, useRef, useState } from 'react';
import { getToken } from '@/api/apiClient';
import { fetchOverrides, patchOverrides } from '@/lib/media';
import { BRANDING_FIELD, BRANDING_GROUPS, brandingMap, groupState } from '@/lib/appBranding';

// Admin → Ρυθμίσεις: εικονίδιο εφαρμογής, εικόνα εκκίνησης iPhone, εικόνα κοινοποίησης.
// Ανεβάζεις ΜΙΑ εικόνα· φτιάχνονται εδώ όλα τα μεγέθη που ζητά κάθε συσκευή και ανεβαίνουν στη Βιβλιοθήκη.

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, done: () => URL.revokeObjectURL(url) });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Δεν διαβάστηκε η εικόνα. Δοκίμασε JPG ή PNG.')); };
    img.src = url;
  });
}

// «Γέμισμα» (cover) στο ακριβές μέγεθος· με pad η εικόνα χωράει ολόκληρη μέσα σε περιθώριο.
function renderSize(img, spec) {
  const canvas = document.createElement('canvas');
  canvas.width = spec.w;
  canvas.height = spec.h;
  const ctx = canvas.getContext('2d');
  if (spec.fill || spec.type === 'image/jpeg') { ctx.fillStyle = spec.fill || '#000000'; ctx.fillRect(0, 0, spec.w, spec.h); }
  ctx.imageSmoothingQuality = 'high';
  const pad = spec.pad || 0;
  const boxW = spec.w * (1 - pad * 2);
  const boxH = spec.h * (1 - pad * 2);
  const scale = pad ? Math.min(boxW / img.width, boxH / img.height) : Math.max(spec.w / img.width, spec.h / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (spec.w - w) / 2, (spec.h - h) / 2, w, h);
  return new Promise((resolve) => canvas.toBlob(resolve, spec.type, 0.9));
}

function uploadBlob(blob, name) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/media/upload?name=${encodeURIComponent(name)}`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* κενή απάντηση */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
      else reject(new Error(data.error || `Σφάλμα ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Πρόβλημα σύνδεσης κατά το ανέβασμα.'));
    xhr.send(blob);
  });
}

const fileName = (path) => `app-${path.split('/').pop().replace(/[^a-z0-9.-]/gi, '-')}`;

function Row({ group, map, version, busy, onPick, onReset }) {
  const input = useRef(null);
  const changed = groupState(map, group);
  const preview = group.files[group.id === 'icon' ? 4 : 0].path;
  const shape = group.id === 'icon' ? 'h-16 w-16 rounded-[18px]' : group.id === 'splash' ? 'h-24 w-11 rounded-xl' : 'h-14 w-[107px] rounded-xl';
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-white/10 p-5 first:border-t-0">
      <img src={`${preview}?v=${version}`} alt="" className={`${shape} shrink-0 bg-black object-cover ring-1 ring-white/10`} />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold">{group.label}</div>
        <div className="text-xs text-white/55">{group.hint}</div>
        <div className="mt-1 text-[11px] font-semibold text-[#E8C26B]">{changed ? `✓ Δική σου εικόνα (${group.files.length} μεγέθη)` : 'Ενσωματωμένη εικόνα DT'}</div>
      </div>
      <div className="flex shrink-0 gap-2">
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPick(group, f); }} />
        <button type="button" disabled={!!busy} onClick={() => input.current?.click()} className="h-10 rounded-full bg-[#E8C26B] px-4 text-sm font-bold text-black disabled:opacity-40">{busy === group.id ? 'Ανέβασμα…' : 'Αλλαγή'}</button>
        {changed > 0 && <button type="button" disabled={!!busy} onClick={() => onReset(group)} className="h-10 rounded-full bg-white/10 px-4 text-sm font-semibold disabled:opacity-40">Επαναφορά</button>}
      </div>
    </div>
  );
}

export default function AdminAppBranding() {
  const [map, setMap] = useState({});
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [version, setVersion] = useState(() => Date.now());

  useEffect(() => {
    fetchOverrides().then((rec) => setMap(brandingMap(rec?.value?.[BRANDING_FIELD]))).catch(() => {});
  }, []);

  const save = async (mutate) => {
    const next = await patchOverrides((value) => ({ ...value, [BRANDING_FIELD]: mutate({ ...(value[BRANDING_FIELD] || {}) }) }));
    setMap(brandingMap(next[BRANDING_FIELD]));
  };

  const pick = async (group, file) => {
    setBusy(group.id); setMessage('');
    let loaded;
    try {
      loaded = await loadImage(file);
      const uploaded = {};
      for (const spec of group.files) {
        const blob = await renderSize(loaded.img, spec);
        if (!blob) throw new Error('Ο browser δεν μπόρεσε να φτιάξει την εικόνα.');
        uploaded[spec.path] = await uploadBlob(blob, fileName(spec.path));
      }
      await save((current) => ({ ...current, ...uploaded }));
      setVersion(Date.now());
      setMessage(`✓ ${group.label}: αποθηκεύτηκε. Φαίνεται σε λίγα δευτερόλεπτα${group.id === 'icon' ? '. Στην αρχική οθόνη του κινητού αλλάζει όταν ξαναπροστεθεί η εφαρμογή.' : '.'}`);
    } catch (error) {
      setMessage(error.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      loaded?.done();
      setBusy('');
    }
  };

  const reset = async (group) => {
    setBusy(group.id); setMessage('');
    try {
      await save((current) => { const next = { ...current }; for (const spec of group.files) delete next[spec.path]; return next; });
      setVersion(Date.now());
      setMessage(`✓ ${group.label}: επέστρεψε η ενσωματωμένη εικόνα.`);
    } catch (error) {
      setMessage(error.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally { setBusy(''); }
  };

  return (
    <section className="overflow-hidden rounded-3xl bg-[#1C1C1E] text-[#F5F1E8]">
      <div className="px-5 pt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">Εφαρμογή</div>
        <div className="text-lg font-bold">Εικονίδιο, εκκίνηση & κοινοποίηση</div>
        <p className="mt-1 text-xs text-white/55">Ανεβάζεις μία εικόνα και φτιάχνονται μόνα τους όλα τα μεγέθη για κάθε συσκευή.</p>
      </div>
      <div className="mt-2">
        {BRANDING_GROUPS.map((group) => <Row key={group.id} group={group} map={map} version={version} busy={busy} onPick={pick} onReset={reset} />)}
      </div>
      {message && <div role="status" className="border-t border-white/10 px-5 py-3 text-sm text-white/80">{message}</div>}
    </section>
  );
}
