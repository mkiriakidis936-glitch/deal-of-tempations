import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function PajamaRSVP() {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function load() {
    try {
      const { items } = await base44.entities.InvitationRSVP.filter(
        { confirmed: true, event: 'pajama' },
        { sort: '-created_date', limit: 100 }
      );
      setList(items || []);
    } catch (e) {
      console.error('pajama rsvp load error', e);
    }
  }

  useEffect(() => { load(); }, []);

  async function confirm() {
    const clean = name.trim();
    if (!clean || saving) return;
    setSaving(true);
    try {
      await base44.entities.InvitationRSVP.create({ name: clean, confirmed: true, event: 'pajama' });
      setName('');
      setDone(true);
      await load();
    } catch (e) {
      console.error('pajama rsvp save error', e);
    }
    setSaving(false);
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 text-center">
      <div className="flex items-center justify-center gap-3">
        <div className="font-display text-4xl text-tarot-gold">{list.length}</div>
        <div className="text-left text-[11px] tracking-[0.3em] text-tarot-gold/70 uppercase leading-tight">
          {list.length === 1 ? 'Θέση κρατημένη' : 'Θέσεις κρατημένες'}
        </div>
      </div>

      {list.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {list.map((r) => (
            <span key={r.id} className="px-3 py-1 rounded-full border border-tarot-gold/30 text-xs tracking-[0.1em] text-foreground/70">
              {r.name}
            </span>
          ))}
        </div>
      )}

      {done ? (
        <div className="text-sm text-tarot-gold">✓ Η θέση σου κρατήθηκε. Τα υπόλοιπα δεν τα ξέρεις ακόμη.</div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
            placeholder="Το όνομά σου"
            className="cinp flex-1 text-center"
          />
          <button onClick={confirm} disabled={!name.trim() || saving} className="cinv-btn !text-base sm:!text-lg !px-4">
            {saving ? '...' : 'ΚΡΑΤΑ ΤΗ ΘΕΣΗ'}
          </button>
        </div>
      )}

      <p className="text-[10px] tracking-[0.25em] text-foreground/35 uppercase">
        Χωρίς λεπτομέρειες · χωρίς spoilers
      </p>
    </div>
  );
}