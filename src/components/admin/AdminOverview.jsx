import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import { GAME_MODES } from '@/data/gameConfig';

export default function AdminOverview({ sessions = [], loading = false }) {
  if (loading) return <ComicPanel className="bg-card text-center py-8"><div className="font-heading text-2xl">ΦΟΡΤΩΣΗ...</div></ComicPanel>;
  const activeSessions = sessions.filter((session) => (session.state?.stage ?? 0) < 3).length;
  const finishedSessions = sessions.filter((session) => (session.state?.stage ?? 0) >= 3).length;
  const playersInSessions = sessions.reduce((total, session) => total + (session.state?.players?.length || 0), 0);
  const latestSession = sessions[0] || null;
  const items = [
    { label: 'Αποθηκευμένες παρτίδες', value: sessions.length },
    { label: 'Ενεργές παρτίδες', value: activeSessions },
    { label: 'Ολοκληρωμένες παρτίδες', value: finishedSessions },
    { label: 'Συμμετοχές παικτών', value: playersInSessions },
    { label: 'Διαθέσιμα Game Modes', value: GAME_MODES.length },
  ];
  return (
    <div className="space-y-4">
      <ComicPanel className="bg-primary">
        <div className="font-heading text-2xl">Κεντρική εικόνα εφαρμογής</div>
        <p className="text-sm font-bold text-foreground/80 mt-1">Συνοπτική κατάσταση λειτουργίας — τα αναλυτικά στατιστικά βρίσκονται αποκλειστικά στην ενότητα Statistics.</p>
      </ComicPanel>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => <ComicPanel key={item.label} className="bg-card text-center"><div className="font-heading text-3xl text-primary">{item.value}</div><div className="text-xs font-bold">{item.label}</div></ComicPanel>)}
      </div>
      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">Τελευταία παρτίδα</div>
        {latestSession ? <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-bold">{latestSession.sessionCode || 'Χωρίς κωδικό'}</span><span>{latestSession.state?.mode || latestSession.mode || 'Mode χωρίς καταχώριση'}</span><span>Στάδιο {latestSession.state?.stage ?? '—'}</span></div> : <div className="text-sm text-foreground/60">Δεν υπάρχουν αποθηκευμένες παρτίδες.</div>}
      </ComicPanel>
    </div>
  );
}
