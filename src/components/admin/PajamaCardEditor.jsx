import React, { useState } from 'react';
import ComicButton from '@/components/comic/ComicButton';
import CardPreviewPair from '@/components/admin/CardPreviewPair';

const inputCls = 'w-full px-2 py-1.5 rounded bg-slate-950/60 border border-pink-500/30 text-pink-50 text-sm focus:outline-none';

export default function PajamaCardEditor({ row, onSave, onDelete }) {
  const [draft, setDraft] = useState({
    title: row.title || '',
    text: row.text || '',
    success: row.success ?? 2,
    fail: row.fail ?? 1,
    timer: row.timer || 0,
    scored: row.scored !== false,
  });
  const [saved, setSaved] = useState(false);

  function set(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    await onSave(row.id, draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="rounded-lg border border-pink-500/30 bg-pink-950/40 p-2 space-y-1.5">
      <input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Τίτλος (προαιρετικός)" className={inputCls} />
      <textarea value={draft.text} onChange={(e) => set('text', e.target.value)} rows={2} placeholder="Κείμενο κάρτας" className={inputCls} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1">
          +
          <input type="number" value={draft.success} onChange={(e) => set('success', Number(e.target.value))} className="w-14 px-1 py-1 rounded bg-slate-950/60 border border-pink-500/30" />
        </label>
        <label className="flex items-center gap-1">
          −
          <input type="number" value={draft.fail} onChange={(e) => set('fail', Number(e.target.value))} className="w-14 px-1 py-1 rounded bg-slate-950/60 border border-pink-500/30" />
        </label>
        <label className="flex items-center gap-1">
          ⏱
          <input type="number" value={draft.timer} onChange={(e) => set('timer', Number(e.target.value))} className="w-16 px-1 py-1 rounded bg-slate-950/60 border border-pink-500/30" />″
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={draft.scored} onChange={(e) => set('scored', e.target.checked)} />
          Βαθμολογείται
        </label>
        <div className="ml-auto flex gap-1">
          <ComicButton variant={saved ? 'green' : 'cyan'} size="sm" onClick={save}>{saved ? '✓' : '💾'}</ComicButton>
          <ComicButton variant="red" size="sm" onClick={() => onDelete(row.id)}>🗑️</ComicButton>
        </div>
      </div>

      <div className="pt-1">
        <CardPreviewPair card={{ title: draft.title, text: draft.text || 'Κείμενο κάρτας...', kicker: row.categoryId?.replace('_', ' ') || 'Pajama', icon: '🩴', secs: draft.timer || undefined, reward: draft.scored ? `${draft.success} / −${draft.fail}` : null }} />
      </div>
    </div>
  );
}