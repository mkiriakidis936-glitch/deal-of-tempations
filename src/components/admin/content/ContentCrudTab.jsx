import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import CardPreview from '@/components/admin/content/CardPreview';

function blankItem(fields) {
  const obj = {};
  fields.forEach((f) => {
    if (f.dataKey) {
      // nested ultra.duration / ultra.desc
      const [parent, child] = f.dataKey.split('.');
      obj[parent] = obj[parent] || {};
      obj[parent][child] = f.type === 'number' ? '' : '';
    } else {
      obj[f.key] = f.type === 'number' ? '' : '';
    }
  });
  return obj;
}

function getFieldVal(item, f) {
  if (f.dataKey) {
    const [parent, child] = f.dataKey.split('.');
    return item?.[parent]?.[child] ?? '';
  }
  return item?.[f.key] ?? '';
}

function setFieldVal(item, f, val) {
  const next = { ...item };
  if (f.dataKey) {
    const [parent, child] = f.dataKey.split('.');
    next[parent] = { ...(next[parent] || {}), [child]: val };
  } else {
    next[f.key] = val;
  }
  return next;
}

function coerceVal(f, raw) {
  if (f.type === 'number') {
    const n = Number(raw);
    return raw === '' || Number.isNaN(n) ? '' : n;
  }
  return raw;
}

function summary(item, fields) {
  const titleKey = fields.find((f) => ['name', 'label', 'role', 'text'].includes(f.key) && !f.dataKey);
  if (titleKey) {
    const v = getFieldVal(item, titleKey);
    if (v) return String(v).slice(0, 60);
  }
  return JSON.stringify(item).slice(0, 60);
}

export default function ContentCrudTab({ category }) {
  const { id, label, shape, fields } = category;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // { id?, data }
  const [error, setError] = useState('');
  const [versions, setVersions] = useState([]);
  const [versionRecord, setVersionRecord] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { items } = await base44.entities.GameContent.filter(
        { category: id },
        { sort: 'order', limit: 500 }
      );
      setRecords(items || []);
    } catch (e) {
      setError('Φόρτωση: ' + (e.message || 'σφάλμα'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const versionKey = `admin_content_versions_${id}`;
  const loadVersions = useCallback(async () => {
    try {
      const result = await base44.entities.AppSetting.filter({ key: versionKey }, { limit: 1 });
      const found = result.items?.[0] || null;
      setVersionRecord(found);
      setVersions(found?.value?.items || []);
    } catch (e) {
      setError('Ιστορικό εκδόσεων: ' + (e.message || 'σφάλμα'));
    }
  }, [versionKey]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  async function saveVersion(rec) {
    if (!rec?.data) return;
    const snapshot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      itemId: rec.itemId,
      recordId: rec.id,
      createdAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(rec.data)),
    };
    const next = [snapshot, ...versions].slice(0, 30);
    const value = { items: next };
    if (versionRecord?.id) await base44.entities.AppSetting.update(versionRecord.id, { value });
    else setVersionRecord(await base44.entities.AppSetting.create({ key: versionKey, value }));
    setVersions(next);
  }

  async function restoreVersion(version) {
    if (!window.confirm(`Επαναφορά της προηγούμενης έκδοσης «${version.itemId}»;`)) return;
    setSaving(true);
    setError('');
    try {
      const current = records.find((item) => item.id === version.recordId)
        || records.find((item) => item.itemId === version.itemId);
      if (current) {
        await saveVersion(current);
        await base44.entities.GameContent.update(current.id, { data: version.data });
      } else {
        await base44.entities.GameContent.create({
          category: id, itemId: String(version.itemId || `restored-${Date.now()}`),
          data: version.data, order: records.length,
        });
      }
      await load();
      setError('Η προηγούμενη έκδοση επανήλθε.');
    } catch (e) {
      setError('Επαναφορά: ' + (e.message || 'σφάλμα'));
    } finally { setSaving(false); }
  }

  function startAdd() {
    if (shape === 'json') {
      setEditing({ id: null, data: { json: '{}' } });
    } else if (shape === 'single') {
      const existing = records[0];
      setEditing({ id: existing?.id || null, data: existing?.data || { text: '' } });
    } else {
      setEditing({ id: null, data: blankItem(fields) });
    }
  }

  function startEdit(rec) {
    setEditing({ id: rec.id, data: { ...rec.data } });
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      let payload = { ...editing.data };
      // for json shape, validate parse
      if (shape === 'json') {
        try { JSON.parse(payload.json || '{}'); } catch (e) {
          setError('Μη έγκυρο JSON: ' + e.message);
          setSaving(false);
          return;
        }
      }
      if (editing.id) {
        const previous = records.find((rec) => rec.id === editing.id);
        if (previous) await saveVersion(previous);
        await base44.entities.GameContent.update(editing.id, { data: payload });
      } else {
        const order = shape === 'list' || shape === 'stringList' ? records.length : 0;
        const itemId = shape === 'list'
          ? (payload.id || payload.name || `item-${Date.now()}`)
          : shape === 'stringList'
            ? `s${order}`
            : 'main';
        await base44.entities.GameContent.create({ category: id, itemId: String(itemId), data: payload, order });
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError('Αποθήκευση: ' + (e.message || 'σφάλμα'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(rec) {
    if (!confirm('Διαγραφή;')) return;
    try {
      await saveVersion(rec);
      await base44.entities.GameContent.delete(rec.id);
      await load();
    } catch (e) {
      setError('Διαγραφή: ' + (e.message || 'σφάλμα'));
    }
  }

  const isSingle = shape === 'single' || shape === 'json';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-heading text-xl">{label}</div>
        <div className="flex gap-2 items-center">
          <ComicButton variant="white" size="sm" onClick={load} disabled={loading}>🔄</ComicButton>
          {(!isSingle || records.length === 0) && (
            <ComicButton variant="green" size="sm" onClick={startAdd}>+ Νέο</ComicButton>
          )}
        </div>
      </div>

      {error && <div className="text-xs text-destructive font-bold">{error}</div>}
      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-base">🕘 ΙΣΤΟΡΙΚΟ ΕΚΔΟΣΕΩΝ — {label}</div>
        <p className="text-xs text-foreground/60">Αποθηκεύονται έως 30 προηγούμενες εκδόσεις στοιχείων αυτής της κατηγορίας.</p>
        {versions.length === 0 ? <div className="text-xs text-foreground/50">Δεν υπάρχουν προηγούμενες εκδόσεις.</div> : versions.map((version) => (
          <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/40 p-2">
            <div className="text-xs">{new Date(version.createdAt).toLocaleString('el-GR')} · {version.itemId}</div>
            <ComicButton size="sm" variant="dark" disabled={saving} onClick={() => restoreVersion(version)}>Επαναφορά</ComicButton>
          </div>
        ))}
      </ComicPanel>


      {loading ? (
        <div className="text-sm">Φόρτωση…</div>
      ) : editing ? (
        <ComicPanel className="bg-secondary space-y-2">
          <div className="font-heading text-lg">{editing.id ? 'Επεξεργασία' : 'Νέο στοιχείο'}</div>
          <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
          {fields.map((f) => {
            const val = getFieldVal(editing.data, f);
            return (
              <div key={f.key + (f.dataKey || '')}>
                <label className="text-xs font-bold block mb-0.5">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={val}
                    onChange={(e) => setEditing((s) => ({ ...s, data: setFieldVal(s.data, f, e.target.value) }))}
                    className="w-full border-2 border-border rounded px-2 py-1 text-sm bg-card"
                    rows={f.type === 'textarea' && f.key === 'json' ? 12 : 3}
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={val}
                    onChange={(e) => setEditing((s) => ({ ...s, data: setFieldVal(s.data, f, e.target.value) }))}
                    className="w-full border-2 border-border rounded px-2 py-1 text-sm bg-card"
                  >
                    <option value="">—</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={val}
                    onChange={(e) => setEditing((s) => ({ ...s, data: setFieldVal(s.data, f, coerceVal(f, e.target.value)) }))}
                    className="w-full border-2 border-border rounded px-2 py-1 text-sm bg-card"
                  />
                )}
              </div>
            );
            })}
            </div>
            {(shape === 'list' || shape === 'stringList') && (
              <div>
                <div className="text-xs font-bold mb-1">👁️ Προεπισκόπηση</div>
                <CardPreview category={category} data={editing.data} />
              </div>
            )}
            </div>
            <div className="flex gap-2">
            <ComicButton variant="green" size="sm" onClick={save} disabled={saving}>{saving ? '…' : '✓ Αποθήκευση'}</ComicButton>
            <ComicButton variant="white" size="sm" onClick={() => setEditing(null)}>Ακύρωση</ComicButton>
          </div>
        </ComicPanel>
      ) : records.length === 0 ? (
        <div className="text-sm text-foreground/50 italic">Καθόλου στοιχεία. Πάτα «+ Νέο».</div>
      ) : isSingle ? (
        <ComicPanel className="bg-card text-sm whitespace-pre-wrap">
          {shape === 'json'
            ? <pre className="text-[11px] overflow-auto">{JSON.stringify(records[0].data, null, 2)}</pre>
            : records[0].data?.text || records[0].data?.json || '(κενό)'}
          <div className="mt-2"><ComicButton variant="white" size="sm" onClick={() => startEdit(records[0])}>Επεξεργασία</ComicButton></div>
        </ComicPanel>
      ) : (
        <div className="space-y-1">
          {records.map((rec, idx) => (
            <div key={rec.id} className="comic-panel-sm p-2 bg-card flex items-start justify-between gap-2">
              <div className="text-sm flex-1 min-w-0">
                <span className="text-xs text-foreground/40 mr-1">{idx + 1}.</span>
                {shape === 'stringList'
                  ? <span>{rec.data?.text}</span>
                  : <span className="font-bold">{summary(rec.data, fields)}</span>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(rec)} className="text-xs px-2 py-1 border-2 border-border rounded bg-primary/20 font-bold">✏️</button>
                <button onClick={() => remove(rec)} className="text-xs px-2 py-1 border-2 border-border rounded bg-destructive/40 font-bold">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}