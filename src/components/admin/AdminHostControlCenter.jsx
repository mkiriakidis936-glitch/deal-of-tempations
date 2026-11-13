import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function AdminHostControlCenter({ session, onUpdate }) {
  const state = session?.state || {};
  if (!session) return <ComicPanel className="bg-card">Δεν υπάρχει ενεργή συνεδρία για έλεγχο.</ComicPanel>;
  const update = (patch) => onUpdate(session.id, { ...state, ...patch });
  return (
    <div className="space-y-3">
      <ComicPanel className="bg-primary">
        <div className="font-heading text-2xl">HOST CONTROL CENTER</div>
        <div className="text-xs font-bold mt-1">{session.sessionCode} · {state.mode || session.mode || '—'} · {Array.isArray(state.players) ? state.players.length : 0} παίκτες</div>
      </ComicPanel>
      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">Κεντρικός χειρισμός συνεδρίας</div>
        <div className="flex flex-wrap gap-2">
          <ComicButton variant={state.stopActive ? 'green' : 'red'} onClick={() => update({ stopActive: !state.stopActive })}>
            {state.stopActive ? '▶ ΣΥΝΕΧΙΣΗ' : '⏸ ΠΑΥΣΗ'}
          </ComicButton>
          {state.bombEvent && <ComicButton variant="dark" onClick={() => update({ bombEvent: null })}>ΑΚΥΡΩΣΗ BOMB</ComicButton>}
        </div>
        <div>
          <div className="text-xs font-bold mb-2">Μετάβαση σε υπάρχον στάδιο</div>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((stage) => <ComicButton key={stage} size="sm" variant={Number(state.stage || 0) === stage ? 'magenta' : 'white'} onClick={() => update({ stage })}>ΣΤΑΔΙΟ {stage}</ComicButton>)}
          </div>
        </div>
        <p className="text-[11px] text-foreground/55">Οι ενέργειες χρησιμοποιούν τους ήδη υπάρχοντες χειρισμούς της συνεδρίας. Δεν προστίθενται νέοι κανόνες ή μηχανισμοί.</p>
      </ComicPanel>
    </div>
  );
}
