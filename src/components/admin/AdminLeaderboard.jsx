import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const BADGES = [
  { icon: '👑', title: 'Νίκη', test: (e) => e.wins >= 1 },
  { icon: '🩴', title: '3+ βραδιές', test: (e) => e.nights >= 3 },
  { icon: '🔥', title: '5+ βραδιές', test: (e) => e.nights >= 5 },
  { icon: '⭐', title: '50+ πόντοι', test: (e) => e.points >= 50 },
];

export default function AdminLeaderboard() {
  const [rows, setRows] = useState([]);
  const [nights, setNights] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.SessionArchive.filter(
        { mode: 'pajama' },
        { sort: '-created_date', limit: 100 }
      );
      const sessions = items || [];
      setNights(sessions.length);
      const map = {};
      sessions.forEach((s) => {
        (s.playerNames || []).forEach((n) => {
          if (!n) return;
          const e = map[n] || { name: n, nights: 0, wins: 0, points: 0 };
          e.nights += 1;
          if (s.winner === n) e.wins += 1;
          e.points += s.stats?.[n]?.points || 0;
          map[n] = e;
        });
      });
      setRows(Object.values(map).sort((a, b) => b.points - a.points || b.wins - a.wins || b.nights - a.nights));
    } catch (e) {
      console.error('leaderboard load error', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-primary flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-heading text-2xl comic-text-stroke">🏅 ΚΑΤΑΤΑΞΗ ΟΛΩΝ ΤΩΝ ΒΡΑΔΙΩΝ</div>
          <div className="text-xs font-bold">Pajama Pedi-Glam · {nights} αρχειοθετημένες βραδιές</div>
        </div>
        <ComicButton variant="dark" size="sm" onClick={load} disabled={loading}>
          🔄 {loading ? 'ΦΟΡΤΩΣΗ...' : 'ΑΝΑΝΕΩΣΗ'}
        </ComicButton>
      </ComicPanel>

      <ComicPanel className="bg-card">
        {loading ? (
          <div className="text-center text-foreground/50 py-6">Φόρτωση...</div>
        ) : rows.length === 0 ? (
          <div className="text-center text-foreground/50 py-6">
            Καμία αρχειοθετημένη βραδιά ακόμη. Η κατάταξη χτίζεται μόλις τελειώσει το πρώτο παιχνίδι.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[28px_1fr_54px_54px_64px] gap-2 text-[10px] uppercase tracking-widest text-foreground/50 px-2">
              <span>#</span>
              <span>Παίκτρια</span>
              <span className="text-center">Βραδ.</span>
              <span className="text-center">Νίκες</span>
              <span className="text-center">Πόντοι</span>
            </div>
            {rows.map((e, i) => (
              <div key={e.name} className="grid grid-cols-[28px_1fr_54px_54px_64px] gap-2 items-center border-2 border-border rounded-lg px-2 py-1.5 bg-secondary">
                <span className="font-heading text-lg text-primary">{i + 1}</span>
                <span className="font-bold text-foreground truncate">
                  {e.name}
                  <span className="ml-1 text-sm">
                    {BADGES.filter((b) => b.test(e)).map((b) => (
                      <span key={b.icon} title={b.title}>{b.icon}</span>
                    ))}
                  </span>
                </span>
                <span className="text-center text-sm">{e.nights}</span>
                <span className="text-center text-sm">{e.wins}</span>
                <span className="text-center text-sm font-heading text-primary">{e.points}</span>
              </div>
            ))}
          </div>
        )}
      </ComicPanel>
    </div>
  );
}