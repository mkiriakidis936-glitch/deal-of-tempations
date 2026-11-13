import React, { useEffect, useMemo, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import AdminSettingVersionHistory from '@/components/admin/AdminSettingVersionHistory';
import { saveAdminSettingVersion } from '@/lib/adminVersionHistory';
import { NEW_MODES } from '@/data/modes/modeRegistry';
import { COLLECTIONS, defaultsOf, fetchModesRecord, saveModesContent } from '@/lib/modesContentStore';

const inp = 'w-full px-3 py-2 rounded-lg border-2 border-border bg-background text-foreground font-body text-sm';
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const SITE_IDS = { pedi_extended: 'extended', lockdown: 'lockdown', beach_bar: 'beachbar', marathon_4h: 'marathon4h' };

// Admin → 🎮 Νέα Modes: επεξεργασία κάρτων, ερωτήσεων και αποστολών των 4 νέων modes.
export default function AdminModes() {
  const [saved, setSaved] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [sel, setSel] = useState(COLLECTIONS[0].id);
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const col = useMemo(() => COLLECTIONS.find((c) => c.id === sel), [sel]);

  useEffect(() => {
    fetchModesRecord()
      .then((r) => setSaved(r?.value || {}))
      .catch(() => setMsg({ ok: false, text: 'Δεν φορτώθηκε το αποθηκευμένο περιεχόμενο.' }))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setList(saved[sel] ? JSON.parse(JSON.stringify(saved[sel])) : defaultsOf(sel));
    setMsg(null);
  }, [sel, loaded, saved]);

  const groups = useMemo(() => {
    const g = {};
    COLLECTIONS.forEach((c) => { (g[c.group] = g[c.group] || []).push(c); });
    return Object.entries(g);
  }, []);

  const setItem = (i, v) => setList((l) => l.map((x, k) => (k === i ? v : x)));
  const move = (i, d) => setList((l) => { const j = i + d; if (j < 0 || j >= l.length) return l; const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n; });

  async function persist(nextAll, okText) {
    setBusy(true);
    setMsg(null);
    try {
      await saveAdminSettingVersion('modes_content', saved);
      await saveModesContent(nextAll);
      setSaved(nextAll);
      setMsg({ ok: true, text: okText });
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    setBusy(false);
  }
  const save = () => {
    const validation = col?.validate?.(list);
    if (validation) { setMsg({ ok: false, text: validation }); return; }
    persist({ ...saved, [sel]: list }, 'Αποθηκεύτηκε ✓ — ισχύει στο επόμενο φόρτωμα του tablet.');
  };
  const reset = () => {
    if (!window.confirm('Επαναφορά αυτής της λίστας στα αρχικά του PDF;')) return;
    const { [sel]: _drop, ...rest } = saved;
    persist(rest, 'Επαναφέρθηκαν τα αρχικά ✓');
  };

  const renderField = (item, f, onChange) => {
    const v = item[f.key];
    if (f.type === 'check') {
      return (
        <label key={f.key} className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={!!v} onChange={(e) => onChange({ ...item, [f.key]: e.target.checked })} /> {f.label}
        </label>
      );
    }
    return (
      <label key={f.key} className="block space-y-1">
        <span className="text-[11px] font-bold text-primary/90">{f.label}</span>
        {f.type === 'area' && <textarea rows={3} className={inp} value={v ?? ''} onChange={(e) => onChange({ ...item, [f.key]: e.target.value })} />}
        {f.type === 'text' && <input className={inp} value={v ?? ''} onChange={(e) => onChange({ ...item, [f.key]: e.target.value })} />}
        {f.type === 'number' && <input type="number" className={inp} value={v ?? ''} onChange={(e) => onChange({ ...item, [f.key]: e.target.value === '' ? undefined : Number(e.target.value) })} />}
        {f.type === 'select' && (
          <select className={inp} value={v ?? ''} onChange={(e) => onChange({ ...item, [f.key]: e.target.value })}>
            {(typeof f.options === 'function' ? f.options() : f.options).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        )}
      </label>
    );
  };

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-xl text-primary">🎮 ΝΕΑ MODES</div>
        <p className="text-xs text-foreground/70">
          Επεξεργάσου τις κάρτες, τις ερωτήσεις και τις αποστολές των 4 νέων modes. Ό,τι δεν αλλάξεις μένει όπως ήταν στο PDF.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {NEW_MODES.map((m) => (
            <div key={m.id} className="rounded-lg border-2 border-border/40 bg-secondary/40 p-2 text-sm">
              <div className="font-heading">{m.icon} {m.name}</div>
              <div className="text-[11px] opacity-70">Παίκτριες {m.min}-{m.max} · Acts: {m.acts.join(' → ')}</div>
              <div className="text-[11px] mt-1 flex gap-3 flex-wrap">
                <a className="underline" target="_blank" rel="noreferrer" href={`${ORIGIN}/modes-form?mode=${m.id}`}>📝 Φόρμα</a>
                <a className="underline" target="_blank" rel="noreferrer" href={`${ORIGIN}/site?event=${SITE_IDS[m.id]}`}>🌐 Site</a>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-foreground/60">Έναρξη παιχνιδιού: Tablet → Επιλογή Mode. Εγκρίσεις φορμών: Ερωτηματολόγια → Pajama. Κείμενα του site: 🌐 Site & Σενάριο.</p>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">Λίστα προς επεξεργασία</div>
        <select className={inp} value={sel} onChange={(e) => setSel(e.target.value)}>
          {groups.map(([g, cs]) => (
            <optgroup key={g} label={g}>
              {cs.map((c) => <option key={c.id} value={c.id}>{c.label}{saved[c.id] ? ' ✎' : ''}</option>)}
            </optgroup>
          ))}
        </select>
        <div className="text-xs opacity-70">{list.length} στοιχεία {saved[sel] ? '· έχει αλλαγές' : '· αρχικό περιεχόμενο'}</div>
        {msg && <div className={`text-sm font-bold ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</div>}
      </ComicPanel>

      {!loaded && <div className="text-center font-heading comic-pulse">ΦΟΡΤΩΣΗ...</div>}

      {loaded && col && (
        <ComicPanel className="bg-card space-y-3">
          {list.map((item, i) => (
            <div key={i} className="border-2 border-border/40 rounded-lg p-2.5 bg-secondary/40 space-y-2">
              <div className="text-[11px] opacity-60">#{i + 1}</div>
              {col.strings
                ? <textarea rows={3} className={inp} value={item} onChange={(e) => setItem(i, e.target.value)} />
                : col.fields.map((f) => renderField(item, f, (v) => setItem(i, v)))}
              <div className="flex gap-2">
                <ComicButton size="sm" variant="dark" disabled={i === 0} onClick={() => move(i, -1)}>▲</ComicButton>
                <ComicButton size="sm" variant="dark" disabled={i === list.length - 1} onClick={() => move(i, 1)}>▼</ComicButton>
                {!col.fixedItems && <ComicButton size="sm" variant="red" onClick={() => setList((l) => l.filter((_, k) => k !== i))}>🗑 Διαγραφή</ComicButton>}
              </div>
            </div>
          ))}
          {!col.fixedItems && <ComicButton size="sm" onClick={() => setList((l) => [...l, col.strings ? '' : { ...col.blank }])}>➕ Νέο στοιχείο</ComicButton>}
          <div className="flex gap-2 flex-wrap sticky bottom-2">
            <ComicButton variant="green" disabled={busy || list.length === 0} onClick={save}>💾 ΑΠΟΘΗΚΕΥΣΗ</ComicButton>
            <ComicButton variant="dark" disabled={busy} onClick={reset}>↩ Επαναφορά αρχικών</ComicButton>
          </div>
        </ComicPanel>
      )}
      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-sm text-primary">LIVE PREVIEW · GAME CONTENT</div>
        <div className="text-[10px] text-foreground/50">Προεπισκόπηση της λίστας όπως είναι τώρα στον editor — οι αλλαγές εμφανίζονται πριν από την αποθήκευση.</div>
        <div className="text-xs font-bold">{col?.label || 'Περιεχόμενο'} · {list.length} στοιχεία</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {list.map((item, index) => {
            const title = typeof item === 'string' ? item : (item.title || item.name || item.say || item.app || item.label || item.question || ('Στοιχείο ' + (index + 1)));
            const body = typeof item === 'string' ? '' : (item.text || item.desc || item.where || item.hint || item.question || '');
            return <div key={item.id || index} className="rounded-lg border border-primary/30 bg-secondary/40 p-3 space-y-1">
              <div className="text-[10px] text-primary/70">#{index + 1}</div>
              <div className="font-heading">{title}</div>
              {body && <div className="text-xs text-foreground/70 whitespace-pre-wrap">{body}</div>}
            </div>;
          })}
        </div>
      </ComicPanel>
      <AdminSettingVersionHistory settingKey="modes_content" onRestore={(value) => { setSaved(value || {}); setList(value?.[sel] || defaultsOf(sel)); }} />
    </div>
  );
}
