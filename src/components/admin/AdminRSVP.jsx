import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function AdminRSVP() {
  const [rsvps, setRsvps] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [total, { items }] = await Promise.all([
        base44.entities.InvitationRSVP.count({ confirmed: true }),
        base44.entities.InvitationRSVP.filter({ confirmed: true }, { sort: '-created_date', limit: 100 }),
      ]);
      setCount(total || 0);
      setRsvps(items || []);
    } catch (e) {
      console.error('RSVP load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    try {
      await base44.entities.InvitationRSVP.delete(id);
      setRsvps((prev) => prev.filter((r) => r.id !== id));
      setCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('RSVP delete error', e);
    }
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-primary flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-heading text-2xl comic-text-stroke">💌 ΠΡΟΣΚΛΗΣΕΙΣ — RSVP</div>
          <div className="text-xs font-bold">Πόσες κοπέλες επιβεβαίωσαν παρουσία</div>
        </div>
        <ComicButton variant="dark" size="sm" onClick={load} disabled={loading}>
          🔄 {loading ? 'ΦΟΡΤΩΣΗ...' : 'ΑΝΑΝΕΩΣΗ'}
        </ComicButton>
      </ComicPanel>

      <ComicPanel className="bg-tarot-wine/30 text-center">
        <div className="font-heading text-5xl text-tarot-wine">{count}</div>
        <div className="text-sm font-bold text-foreground/70 mt-1">{count === 1 ? 'ΚΟΠΕΛΑ ΘΑ ΕΡΘΕΙ' : 'ΚΟΠΕΛΕΣ ΘΑ ΕΡΘΟΥΝ'}</div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl text-foreground mb-3">📋 Λίστα Ονομάτων</div>
        {loading ? (
          <div className="text-center text-foreground/50 py-6">Φόρτωση...</div>
        ) : rsvps.length === 0 ? (
          <div className="text-center text-foreground/50 py-6">Καμία επιβεβαίωση ακόμη.</div>
        ) : (
          <div className="space-y-2">
            {rsvps.map((r, i) => (
              <div key={r.id} className="flex items-center justify-between gap-2 border-2 border-border rounded-lg px-3 py-2 bg-secondary">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-lg text-tarot-wine">{i + 1}.</span>
                  <span className="font-bold text-foreground">{r.name}</span>
                </div>
                <ComicButton variant="red" size="sm" onClick={() => handleDelete(r.id)}>
                  🗑️
                </ComicButton>
              </div>
            ))}
          </div>
        )}
      </ComicPanel>
    </div>
  );
}