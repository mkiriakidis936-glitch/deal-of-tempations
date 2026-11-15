import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function AdminExtra4({ sessions = [], selectedSession, onSelect, onNavigate }) {
  const session = selectedSession || sessions[0] || null;
  const state = session?.state || {};
  const extra4 = state.extra4 || {};
  const terminals = Object.values(extra4.cards?.terminals || {}).filter(Boolean);
  const activeTerminals = terminals.filter((item) => item.active).length;
  const tokens = Object.values(extra4.economy?.tokens || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const keys = Object.values(extra4.economy?.keys || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const activeActivity = extra4.activity?.active?.status === 'active' ? extra4.activity.active : null;

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-card space-y-3">
        <div className="ds-eyebrow text-primary/80">DEAL OF TEMPTATION</div>
        <div className="ds-title text-2xl">EXTRA 4.0 · CENTRAL ADMIN</div>
        <p className="text-sm text-foreground/65">Κεντρική πρόσβαση στις υπάρχουσες λειτουργίες διαχείρισης περιεχομένου, VIP προφίλ, QR και ζωντανού ελέγχου.</p>
        <label className="block text-xs">Ενεργή συνεδρία
          <select value={session?.id || ''} onChange={(event) => onSelect?.(sessions.find((item) => item.id === event.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background p-2">
            {sessions.map((item) => <option key={item.id} value={item.id}>{item.sessionCode || item.id} · {item.state?.mode || '—'}</option>)}
          </select>
        </label>
      </ComicPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">TACTICAL</div><div className="font-heading text-xl text-primary">{extra4.tactical?.level || 'STANDARD'}</div></ComicPanel>
        <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">LIVE FEED</div><div className="font-heading text-lg">{extra4.liveFeed?.status || 'OFF'}</div></ComicPanel>
        <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">ACTIVE QR</div><div className="font-heading text-2xl">{activeTerminals}</div></ComicPanel>
        <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">TOKENS / KEYS</div><div className="font-heading text-xl">{tokens} / {keys}</div></ComicPanel>
      </div>

      {session && <ComicPanel className="bg-card space-y-2">
        <div className="ds-label text-primary/80">ΤΡΕΧΟΥΣΑ ΚΑΤΑΣΤΑΣΗ</div>
        <div className="text-sm">Mode: <strong>{state.mode || '—'}</strong></div>
        <div className="text-sm">Control: <strong>{extra4.control?.status || (state.stopActive ? 'paused' : 'running')}</strong></div>
        <div className="text-sm">Activity: <strong>{activeActivity?.label || 'Καμία ενεργή δραστηριότητα'}</strong></div>
        <div className="text-sm">Digital Cards: <strong>{extra4.cards?.activeCard?.name || 'Καμία επιλεγμένη κάρτα'}</strong></div>
      </ComicPanel>}

      <ComicPanel className="bg-card space-y-3">
        <div className="ds-label text-primary/80">ΔΙΑΧΕΙΡΙΣΗ EXTRA 4.0</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <ComicButton onClick={() => onNavigate?.('editor')}>CARDS & GAME CONTENT</ComicButton>
          <ComicButton variant="purple" onClick={() => onNavigate?.('invitations')}>VIP INVITATIONS & QR</ComicButton>
          <ComicButton variant="yellow" onClick={() => onNavigate?.('forms')}>VIP PROFILES & BOUNDARIES</ComicButton>
          <ComicButton onClick={() => onNavigate?.('links')}>QR LINKS & TERMINALS</ComicButton>
          <ComicButton variant="green" onClick={() => onNavigate?.('players')}>PLAYERS & ROLES</ComicButton>
          <ComicButton variant="red" onClick={() => onNavigate?.('live')}>LIVE CONTROL</ComicButton>
        </div>
      </ComicPanel>
      {!session && <div className="text-sm text-foreground/60">Δεν υπάρχει διαθέσιμη συνεδρία. Δημιούργησε ή επίλεξε συνεδρία για να εμφανιστεί η κατάσταση EXTRA 4.0.</div>}
    </div>
  );
}
