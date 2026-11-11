import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import { Image } from '@/components/ui/image';
import { GAME_MODES, INTENSITY_LEVELS } from '@/data/gameConfig';

const BANNER_URL = 'https://media.base44.com/images/public/6acb505bd92681cd7a001e3f/059bca0c5_Gemini_Generated_Image_hmy5gghmy5gghmy5.jpeg';

export default function AdminDashboard({ sessions, loading }) {
  if (loading) {
    return <ComicPanel className="bg-card text-center py-8"><div className="font-heading text-2xl comic-pulse">ΦΟΡΤΩΣΗ...</div></ComicPanel>;
  }

  const total = sessions.length;
  const active = sessions.filter((s) => (s.state?.stage || 0) < 3).length;
  const finished = sessions.filter((s) => (s.state?.stage || 0) >= 3).length;
  const totalPlayers = sessions.reduce((sum, s) => sum + (s.state?.players?.length || 0), 0);

  const byMode = GAME_MODES.map((m) => ({
    ...m,
    count: sessions.filter((s) => s.state?.mode === m.id || s.mode === m.id).length,
  }));

  const byIntensity = INTENSITY_LEVELS.map((i) => ({
    ...i,
    count: sessions.filter((s) => s.state?.intensity === i.id || s.intensity === i.id).length,
  }));

  const stageNames = { 0: 'Stage 0 (Setup)', 1: 'Stage 1 (Patrol)', 2: 'Stage 2 (Interrogation)', 3: 'Stage 3 (Finale)' };
  const byStage = [0, 1, 2, 3].map((st) => ({
    stage: st,
    name: stageNames[st],
    count: sessions.filter((s) => (s.state?.stage || 0) === st).length,
  }));

  const stats = [
    { label: 'Σύνολο Συνεδριών', value: total, icon: '🎮', color: 'bg-primary' },
    { label: 'Ενεργές', value: active, icon: '▶️', color: 'bg-tarot-forest' },
    { label: 'Ολοκληρωμένες', value: finished, icon: '🏆', color: 'bg-tarot-royal/60' },
    { label: 'Σύνολο Παικτριών', value: totalPlayers, icon: '👥', color: 'bg-tarot-wine/60' },
  ];

  return (
    <div className="space-y-4">
      {/* Brand banner */}
      <div className="relative h-32 rounded-xl overflow-hidden border-2 border-border" style={{ boxShadow: '0 0 20px rgba(201,162,39,.15)' }}>
        <Image src={BANNER_URL} fittingType="fill" className="w-full h-full" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,10,10,.7), transparent 60%, rgba(10,10,10,.7))' }} />
        <div className="absolute inset-0 flex items-center px-6">
          <div className="font-heading text-2xl comic-text-stroke text-primary">DEAL OF TEMPTATION</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <ComicPanel key={s.label} className={`${s.color} text-center`}>
            <div className="text-3xl">{s.icon}</div>
            <div className="font-heading text-3xl">{s.value}</div>
            <div className="text-xs font-bold">{s.label}</div>
          </ComicPanel>
        ))}
      </div>

      {/* By mode */}
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🎲 Ανά Λειτουργία</div>
        <div className="space-y-2">
          {byMode.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <span className="text-sm font-bold">{m.icon} {m.name}</span>
              <div className="flex items-center gap-2 flex-1 mx-3">
                <div className="flex-1 h-4 bg-background/10 rounded-full border-2 border-border overflow-hidden">
                  <div className="h-full bg-tarot-wine" style={{ width: `${total > 0 ? (m.count / total) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="font-heading text-lg">{m.count}</span>
            </div>
          ))}
        </div>
      </ComicPanel>

      {/* By intensity */}
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🔥 Ανά Ένταση</div>
        <div className="grid grid-cols-3 gap-2">
          {byIntensity.map((i) => (
            <div key={i.id} className="comic-panel-sm p-2 text-center bg-destructive/20">
              <div className="text-2xl">{i.icon}</div>
              <div className="text-xs font-bold">{i.name}</div>
              <div className="font-heading text-2xl">{i.count}</div>
            </div>
          ))}
        </div>
      </ComicPanel>

      {/* By stage */}
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">📍 Ανά Στάδιο</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {byStage.map((s) => (
            <div key={s.stage} className="comic-panel-sm p-2 text-center bg-secondary">
              <div className="text-xs font-bold">{s.name}</div>
              <div className="font-heading text-2xl">{s.count}</div>
            </div>
          ))}
        </div>
      </ComicPanel>

      {/* Recent sessions */}
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🕐 Πρόσφατες Συνεδρίες</div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {sessions.slice(0, 10).map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs border-b border-border/10 py-1">
              <span className="font-bold">{s.sessionCode}</span>
              <span>{s.state?.mode || s.mode || '—'}</span>
              <span>Στάδιο {s.state?.stage ?? '—'}</span>
              <span>{s.state?.players?.length || 0} παίκτριες</span>
            </div>
          ))}
          {sessions.length === 0 && <div className="text-center text-foreground/40 py-4">Δεν υπάρχουν συνεδρίες</div>}
        </div>
      </ComicPanel>
    </div>
  );
}