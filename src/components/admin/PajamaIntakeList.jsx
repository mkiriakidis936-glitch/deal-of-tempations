import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { NEW_MODES } from '@/data/modes/modeRegistry';

export default function PajamaIntakeList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const { items: res } = await base44.entities.PajamaIntake.filter({}, { sort: '-created_date', limit: 100 });
      setItems(res || []);
    } catch (e) {
      console.error('Pajama intake load error', e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleApprove(item) {
    const next = !item.approved;
    try {
      await base44.entities.PajamaIntake.update(item.id, {
        approved: next,
        approvedDate: next ? new Date().toISOString() : null,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, approved: next } : i)));
      if (next) {
        const names = items
          .map((i) => (i.id === item.id ? { ...i, approved: true } : i))
          .filter((i) => i.approved && i.name)
          .map((i) => i.name);
        await broadcastReveal(names);
      }
    } catch (e) { console.error('Approve error', e); }
  }

  async function broadcastReveal(names) {
    try {
      const value = JSON.stringify({ id: Date.now(), startedAt: Date.now(), names });
      const { items: rows } = await base44.entities.AppSetting.filter({ key: 'pajama_reveal' }, { limit: 1 });
      if (rows?.[0]) await base44.entities.AppSetting.update(rows[0].id, { value });
      else await base44.entities.AppSetting.create({ key: 'pajama_reveal', value });
    } catch (e) { console.error('Reveal error', e); }
  }

  async function remove(id) {
    try {
      await base44.entities.PajamaIntake.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) { console.error('Delete error', e); }
  }

  const shown = modeFilter === 'all' ? items : items.filter((i) => (i.preferredModes || []).includes(modeFilter));
  const modeName = (id) => NEW_MODES.find((m) => m.id === id);
  const LEVEL = { none: 'χωρίς δεσίματα', light: 'ελαφριά δεσίματα', full: 'και hogtie' };

  if (loading) return <div className="text-center font-heading text-xl comic-pulse">ΦΟΡΤΩΣΗ...</div>;

  if (items.length === 0) {
    return (
      <ComicPanel className="bg-card text-center py-8">
        <div className="text-4xl mb-2">🩴</div>
        <div className="font-heading text-lg">Δεν υπάρχουν φόρμες Pajama Party ακόμα</div>
        <div className="text-xs mt-2 text-foreground/60">Στείλε το link: {window.location.origin}/pajama-invite</div>
      </ComicPanel>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-heading text-lg">
          🩴 {items.length} φόρμες · <span className="text-tarot-forest">{items.filter((i) => i.approved).length} εγκεκριμένες</span>
          {' · '}
          <span className="text-tarot-sienna">{items.filter((i) => i.bringsOwnSlippers === false).length} θέλουν παντόφλες</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="px-2 py-1.5 rounded border-2 border-border bg-background text-sm">
            <option value="all">Όλα τα modes</option>
            {NEW_MODES.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </select>
          <ComicButton variant="dark" size="sm" onClick={load}>🔄 ΑΝΑΝΕΩΣΗ</ComicButton>
        </div>
      </div>
      {shown.map((i) => (
        <ComicPanel key={i.id} className="bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-lg">{i.name}</span>
                {i.nailColor && <span className="text-xs bg-tarot-wine/40 px-2 py-0.5 rounded font-bold">💅 {i.nailColor}</span>}
                {i.slipperType && <span className="text-xs bg-tarot-teal/30 px-2 py-0.5 rounded font-bold">🩴 {i.slipperType}</span>}
                {i.bringsOwnSlippers === false && <span className="text-xs bg-tarot-sienna/60 px-2 py-0.5 rounded font-bold">🩴 ΘΕΛΕΙ ΔΙΚΕΣ ΜΑΣ</span>}
                {i.safeWordConfirmed && <span className="text-xs bg-tarot-forest px-2 py-0.5 rounded font-bold">✓ Safe Word</span>}
                {i.approved
                  ? <span className="text-xs bg-tarot-gold text-tarot-dark px-2 py-0.5 rounded font-bold">✅ ΕΓΚΕΚΡΙΜΕΝΗ</span>
                  : <span className="text-xs bg-tarot-wine/60 px-2 py-0.5 rounded font-bold">⏳ ΣΕ ΑΝΑΜΟΝΗ</span>}
              </div>
              <div className="flex gap-3 flex-wrap text-xs font-bold">
                <span>🦶 Ευαισθησία: {'●'.repeat(i.footSensitivity || 0)}{'○'.repeat(5 - (i.footSensitivity || 0))}</span>
                <span>🍃 Γαργαλητό: {'●'.repeat(i.ticklish || 0)}{'○'.repeat(5 - (i.ticklish || 0))}</span>
              </div>
              {(i.preferredModes || []).length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {i.preferredModes.map((id) => <span key={id} className="text-xs bg-primary/20 border border-primary/40 px-2 py-0.5 rounded font-bold">{modeName(id)?.icon} {modeName(id)?.name || id}</span>)}
                </div>
              )}
              {i.formType === 'modes' && (
                <div className="flex gap-2 flex-wrap text-xs font-bold">
                  {i.restraintLevel && <span>🎀 {LEVEL[i.restraintLevel] || i.restraintLevel}</span>}
                  {i.blindfoldOk === false && <span>🙈 ΧΩΡΙΣ μάσκα</span>}
                  {i.alcohol === 'free' && <span>🧃 χωρίς αλκοόλ</span>}
                  {i.hasFlipFlops === false && <span>🩴 χρειάζεται σαγιονάρες</span>}
                </div>
              )}
              {i.pajamaStyle && <div className="text-xs">🛏️ {i.pajamaStyle}</div>}
              {i.boundaries && <div className="text-xs bg-secondary p-1.5 rounded border border-border/20">🚧 {i.boundaries}</div>}
            </div>
            <div className="flex flex-col gap-1 items-stretch">
              <ComicButton variant={i.approved ? 'dark' : 'green'} size="sm" onClick={() => toggleApprove(i)}>
                {i.approved ? '↩ ΑΝΑΚΛΗΣΗ' : '✅ ΕΓΚΡΙΣΗ'}
              </ComicButton>
              <ComicButton variant="red" size="sm" onClick={() => remove(i.id)}>🗑️</ComicButton>
            </div>
          </div>
        </ComicPanel>
      ))}
    </div>
  );
}