import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import { Image } from '@/components/ui/image';
import { GAME_MODES, INTENSITY_LEVELS } from '@/data/gameConfig';
import { ART } from '@/data/brandArt';
import { request } from '@/api/base44Client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    request('GET', '/api/visits/session-stats')
      .then((data) => { if (mounted) setStats(data); })
      .catch((e) => { if (mounted) setError(e.message || 'Δεν φορτώθηκαν τα στατιστικά.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <ComicPanel className="bg-card text-center py-8"><div className="font-heading text-2xl comic-pulse">ΦΟΡΤΩΣΗ...</div></ComicPanel>;
  }
  if (error || !stats) {
    return <ComicPanel className="bg-card text-center py-8 text-red-400">{error || 'Δεν υπάρχουν διαθέσιμα στατιστικά.'}</ComicPanel>;
  }

  const total = Number(stats.total || 0);
  const byMode = GAME_MODES.map((mode) => ({
    ...mode,
    count: Number(stats.byMode?.find((item) => item.id === mode.id)?.count || 0),
  }));
  const byIntensity = INTENSITY_LEVELS.map((intensity) => ({
    ...intensity,
    count: Number(stats.byIntensity?.find((item) => item.id === intensity.id)?.count || 0),
  }));
  const stageNames = { 0: 'Στάδιο 0 (Προετοιμασία)', 1: 'Στάδιο 1 (Περιπολία)', 2: 'Στάδιο 2 (Ανάκριση)', 3: 'Στάδιο 3 (Φινάλε)' };
  const byStage = [0, 1, 2, 3].map((stage) => ({
    stage,
    name: stageNames[stage],
    count: Number(stats.byStage?.find((item) => Number(item.stage) === stage)?.count || 0),
  }));
  const cards = [
    { label: 'Σύνολο Συνεδριών', value: total, icon: '🎮', color: 'bg-primary' },
    { label: 'Ενεργές · 24 ώρες', value: stats.active, icon: '▶️', color: 'bg-tarot-forest' },
    { label: 'Ολοκληρωμένες', value: stats.completed, icon: '🏆', color: 'bg-tarot-royal/60' },
    { label: 'Αδρανείς · άνω 24 ωρών', value: stats.inactive, icon: '⏸', color: 'bg-secondary' },
    { label: 'Συμμετοχές Παικτριών', value: stats.player_participations, icon: '👥', color: 'bg-tarot-wine/60' },
    { label: 'Μοναδικές Παίκτριες με αποθηκευμένο προφίλ', value: stats.unique_players ?? 0, icon: '🧍', color: 'bg-secondary' },
  ];

  return (
    <div className="space-y-4">
      <div className="relative h-32 rounded-xl overflow-hidden border-2 border-border" style={{ boxShadow: '0 0 20px rgba(201,162,39,.15)' }}>
        <Image src={ART.banner} fittingType="fill" className="w-full h-full" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(10,10,10,.7), transparent 60%, rgba(10,10,10,.7))' }} />
        <div className="absolute inset-0 flex items-center px-6">
          <div className="font-heading text-2xl comic-text-stroke text-primary">DEAL OF TEMPTATION</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <ComicPanel key={card.label} className={`${card.color} text-center`}>
            <div className="text-3xl">{card.icon}</div>
            <div className="font-heading text-3xl">{card.value ?? 0}</div>
            <div className="text-xs font-bold">{card.label}</div>
          </ComicPanel>
        ))}
      </div>
      <p className="text-xs text-foreground/60">Οι ενεργές συνεδρίες έχουν ενημερωθεί τις τελευταίες 24 ώρες. Οι αδρανείς δεν θεωρούνται ολοκληρωμένες. Οι μοναδικές παίκτριες δεν μπορούν να υπολογιστούν αξιόπιστα στα παλιά δεδομένα, επειδή δεν αποθηκεύεται σταθερό αναγνωριστικό συμμετέχουσας μεταξύ συνεδριών.</p>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🎲 Ανά Λειτουργία</div>
        <div className="space-y-2">
          {byMode.map((mode) => (
            <div key={mode.id} className="flex items-center justify-between">
              <span className="text-sm font-bold">{mode.icon} {mode.name}</span>
              <div className="flex items-center gap-2 flex-1 mx-3">
                <div className="flex-1 h-4 bg-background/10 rounded-full border-2 border-border overflow-hidden">
                  <div className="h-full bg-tarot-wine" style={{ width: `${total > 0 ? (mode.count / total) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="font-heading text-lg">{mode.count}</span>
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🔥 Ανά Ένταση</div>
        <div className="grid grid-cols-3 gap-2">
          {byIntensity.map((intensity) => (
            <div key={intensity.id} className="comic-panel-sm p-2 text-center bg-destructive/20">
              <div className="text-2xl">{intensity.icon}</div>
              <div className="text-xs font-bold">{intensity.name}</div>
              <div className="font-heading text-2xl">{intensity.count}</div>
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">📍 Ανά Στάδιο</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {byStage.map((stage) => (
            <div key={stage.stage} className="comic-panel-sm p-2 text-center bg-secondary">
              <div className="text-xs font-bold">{stage.name}</div>
              <div className="font-heading text-2xl">{stage.count}</div>
            </div>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card">
        <div className="font-heading text-xl mb-2">🕐 Πρόσφατες Συνεδρίες</div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {(stats.recent || []).map((session) => (
            <div key={session.id} className="flex items-center justify-between text-xs border-b border-border/10 py-1 gap-2">
              <span className="font-bold">{session.sessionCode || '—'}</span>
              <span>{session.mode || '—'}</span>
              <span>Στάδιο {session.stage}</span>
              <span>{session.players} παίκτριες</span>
            </div>
          ))}
          {!stats.recent?.length && <div className="text-center text-foreground/40 py-4">Δεν υπάρχουν συνεδρίες</div>}
        </div>
      </ComicPanel>
    </div>
  );
}