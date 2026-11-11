import React, { useState } from 'react';
import ComicButton from '@/components/comic/ComicButton';

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
        <div className="text-[10px] uppercase tracking-widest text-pink-300/70 mb-1">Προεπισκόπηση TV</div>
        <div className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/80 p-3">
          <div className="text-[10px] uppercase text-pink-300">{row.categoryId?.replace('_', ' ')}</div>
          {draft.title && <div className="font-heading text-lg text-pink-100">{draft.title}</div>}
          <p className="text-sm text-pink-50 font-body leading-snug">{draft.text || 'Κείμενο κάρτας...'}</p>
          <div className="text-[10px] text-pink-300/80 mt-1">
            {draft.scored ? `+${draft.success} / −${draft.fail}` : 'χωρίς σκορ'}{draft.timer ? ` · ${draft.timer}″` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}