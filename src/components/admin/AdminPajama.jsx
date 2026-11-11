import React, { useEffect, useState } from 'react';
import { PAJAMA_CATEGORIES } from '@/data/pajamaContent';
import { listPajamaRows, createPajamaRow, updatePajamaRow, deletePajamaRow } from '@/lib/pajamaContentStore';
import PajamaCardEditor from '@/components/admin/PajamaCardEditor';
import AdminPajamaLive from '@/components/admin/AdminPajamaLive';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const TABS = [
  { id: 'live', label: '📡 Ζωντανό' },
  ...PAJAMA_CATEGORIES.map((c) => ({ id: c.id, label: `${c.icon} ${c.name}` })),
  { id: 'secrets', label: '🤫 Μυστικά' },
];

function SecretRow({ row, onSave, onDelete }) {
  const [text, setText] = useState(row.text || '');
  return (
    <div className="flex gap-2 items-start">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== row.text && onSave(row.id, text)}
        rows={2}
        className="flex-1 px-2 py-1.5 rounded bg-slate-950/60 border border-pink-500/30 text-pink-50 text-sm focus:outline-none"
      />
      <ComicButton variant="red" size="sm" onClick={() => onDelete(row.id)}>🗑️</ComicButton>
    </div>
  );
}

export default function AdminPajama() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('live');
  const [loading, setLoading] = useState(true);
  const [newSecret, setNewSecret] = useState('');

  async function load() {
    setLoading(true);
    try {
      setRows(await listPajamaRows());
    } catch (e) {
      console.error('Pajama content load error', e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveCard(id, data) {
    try {
      await updatePajamaRow(id, data);
      setRows((r) => r.map((x) => (x.id === id ? { ...x, ...data } : x)));
    } catch (e) { console.error('save error', e); }
  }

  async function removeRow(id) {
    try {
      await deletePajamaRow(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (e) { console.error('delete error', e); }
  }

  async function addCard(catId) {
    try {
      const created = await createPajamaRow({
        kind: 'card',
        categoryId: catId,
        title: '',
        text: 'Νέα κάρτα — γράψε εδώ το κείμενο',
        success: 2,
        fail: 1,
        timer: 0,
        scored: true,
        order: rows.filter((r) => r.categoryId === catId).length,
      });
      setRows((r) => [...r, created]);
    } catch (e) { console.error('create error', e); }
  }

  async function addSecret() {
    if (!newSecret.trim()) return;
    try {
      const created = await createPajamaRow({
        kind: 'secret',
        categoryId: 'secrets',
        text: newSecret.trim(),
        order: rows.filter((r) => r.kind === 'secret').length,
      });
      setRows((r) => [...r, created]);
      setNewSecret('');
    } catch (e) { console.error('create secret error', e); }
  }

  async function saveSecret(id, text) {
    try {
      await updatePajamaRow(id, { text });
      setRows((r) => r.map((x) => (x.id === id ? { ...x, text } : x)));
    } catch (e) { console.error('save secret error', e); }
  }

  if (loading) return <div className="text-center font-heading text-xl comic-pulse">ΦΟΡΤΩΣΗ...</div>;

  const cards = rows.filter((r) => r.kind === 'card' && r.categoryId === tab);
  const secrets = rows.filter((r) => r.kind === 'secret');

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-secondary">
        <div className="font-heading text-2xl text-pink-200">🩴 PAJAMA PEDI-GLAM — ΠΕΡΙΕΧΟΜΕΝΟ</div>
        <div className="text-xs text-foreground/60 mt-1">
          Επεξεργάσου κάρτες και μυστικά. Οι αλλαγές περνούν αμέσως στο παιχνίδι (Splash → Dashboard → Confessions).
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          {TABS.map((t) => (
            <ComicButton key={t.id} variant={tab === t.id ? 'magenta' : 'white'} size="sm" onClick={() => setTab(t.id)}>
              {t.label}
            </ComicButton>
          ))}
        </div>
      </ComicPanel>

      {tab === 'live' && <AdminPajamaLive />}

      {tab !== 'secrets' && tab !== 'live' && (
        <ComicPanel className="bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-heading text-lg">{cards.length} κάρτες</div>
            <ComicButton variant="green" size="sm" onClick={() => addCard(tab)}>➕ ΝΕΑ ΚΑΡΤΑ</ComicButton>
          </div>
          {cards.length === 0 && <div className="text-xs text-foreground/60">Καμία κάρτα σε αυτή την κατηγορία.</div>}
          {cards.map((row) => (
            <PajamaCardEditor key={row.id} row={row} onSave={saveCard} onDelete={removeRow} />
          ))}
        </ComicPanel>
      )}

      {tab === 'secrets' && (
        <ComicPanel className="bg-card space-y-2">
          <div className="font-heading text-lg">🤫 Ιδέες για Secret Confessions ({secrets.length})</div>
          {secrets.map((row) => (
            <SecretRow key={row.id} row={row} onSave={saveSecret} onDelete={removeRow} />
          ))}
          <div className="flex gap-2 items-start pt-2 border-t border-border/30">
            <textarea
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              rows={2}
              placeholder="Νέο μυστικό..."
              className="flex-1 px-2 py-1.5 rounded bg-slate-950/60 border border-pink-500/30 text-pink-50 text-sm focus:outline-none"
            />
            <ComicButton variant="green" size="sm" onClick={addSecret} disabled={!newSecret.trim()}>➕</ComicButton>
          </div>
        </ComicPanel>
      )}
    </div>
  );
}