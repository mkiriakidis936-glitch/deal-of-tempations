import React, { useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

export default function AdminLiveControl({ sessions = [], selectedSession, onSelect, onUpdate }) {
  if (!selectedSession) {
    return (
      <ComicPanel className="bg-card text-center py-8">
        <div className="text-4xl mb-2">📡</div>
        <div className="font-heading text-xl">Δεν υπάρχει ενεργή παρτίδα</div>
        <div className="text-sm text-foreground/60 mt-1">Ξεκίνα παρτίδα από το Tablet ή επίλεξε μία από τις διαθέσιμες συνεδρίες.</div>
      </ComicPanel>
    );
  }

  const [busyAction, setBusyAction] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const state = selectedSession.state || {};
  const players = state.players || [];
  const mode = state.mode || selectedSession.mode || '—';
  const stage = Number(state.stage ?? 0);
  const isPaused = !!(state.stopActive || state.mg?.stop);

  async function runAction(label, action) {
    if (busyAction) return;
    setBusyAction(label);
    setActionMessage('');
    try {
      const result = await action();
      if (result === null || result === false) throw new Error('Η ενέργεια δεν αποθηκεύτηκε.');
      setActionMessage('Η ενέργεια αποθηκεύτηκε.');
    } catch (error) {
      setActionMessage(error?.message || 'Η ενέργεια απέτυχε.');
    } finally {
      setBusyAction('');
    }
  }

  async function update(patch) {
    return onUpdate(selectedSession.id, patch);
  }

  async function resetAllPenalties() {
    return runAction('penalties', () => update({ players: players.map((player) => ({ id: player.id, penaltyStep: 0, immunity: false })) }));
  }

  async function giveAllImmunity() {
    return runAction('immunity', () => update({ players: players.map((player) => ({ id: player.id, immunity: true })) }));
  }

  async function togglePause() {
    const now = Date.now();
    const pausePatch = isPaused
      ? {
          stopActive: false,
          mg: { stop: false, stopAt: null, stopBy: null },
          gamePausedMs: Number(state.gamePausedMs || 0) + (state.gamePausedAt ? Math.max(0, now - state.gamePausedAt) : 0),
          gamePausedAt: null,
        }
      : {
          stopActive: true,
          mg: { stop: true, stopAt: now, stopBy: 'admin' },
          gamePausedAt: now,
        };
    return runAction('pause', () => update(pausePatch));
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-primary">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-heading text-xl">ΖΩΝΤΑΝΟΣ ΕΛΕΓΧΟΣ</div>
            <div className="text-xs font-bold">{selectedSession.sessionCode} · {mode} · {players.length} παίκτριες</div>
          </div>
          <select
            aria-label="Επιλογή ενεργής παρτίδας"
            value={selectedSession.id}
            onChange={(event) => onSelect(sessions.find((session) => session.id === event.target.value) || null)}
            className="w-full sm:w-auto rounded border-2 border-border bg-card px-3 py-2 text-sm"
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionCode} · {session.mode || session.state?.mode || '—'}
              </option>
            ))}
          </select>
        </div>
      </ComicPanel>

      {actionMessage && <div role="status" aria-live="polite" className="rounded-lg border border-border bg-card px-3 py-2 text-sm">{actionMessage}</div>}
      {busyAction && <div role="status" aria-live="polite" className="text-xs text-foreground/60">Αποθήκευση ενέργειας…</div>}

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">Κατάσταση παρτίδας</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-lg bg-secondary p-3"><b className="block text-xl">{state.stage ?? 0}</b>Στάδιο</div>
          <div className="rounded-lg bg-secondary p-3"><b className="block text-xl">{state.round ?? 1}</b>Γύρος</div>
          <div className="rounded-lg bg-secondary p-3"><b className="block text-xl">{players.length}</b>Παίκτριες</div>
          <div className="rounded-lg bg-secondary p-3"><b className="block text-xl">{isPaused ? 'Σε παύση' : 'Σε εξέλιξη'}</b>Κατάσταση</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ComicButton
            variant={isPaused ? 'green' : 'red'}
            onClick={togglePause}
            disabled={!!busyAction}
          >
            {isPaused ? '▶️ ΣΥΝΕΧΙΣΗ ΠΑΡΤΙΔΑΣ' : '⏸ ΠΑΥΣΗ ΠΑΡΤΙΔΑΣ'}
          </ComicButton>
          {state.bombEvent && (
            <ComicButton variant="red" disabled={!!busyAction} onClick={() => runAction('bomb', () => update({ bombEvent: null }))}>
              ΑΚΥΡΩΣΗ BOMB
            </ComicButton>
          )}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">Έλεγχος σταδίου</div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((value) => (
            <ComicButton
              key={value}
              variant={stage === value ? 'magenta' : 'white'}
              onClick={() => runAction('stage', () => update({ stage: value }))}
              disabled={!!busyAction}
            >
              Στάδιο {value}
            </ComicButton>
          ))}
        </div>
      </ComicPanel>

      <ComicPanel className="bg-card space-y-3">
        <div className="font-heading text-lg">Συνολικές ενέργειες παρτίδας</div>
        <div className="flex flex-wrap gap-2">
          <ComicButton variant="dark" disabled={!!busyAction} onClick={resetAllPenalties}>ΜΗΔΕΝΙΣΜΟΣ ΟΛΩΝ ΤΩΝ ΠΟΙΝΩΝ</ComicButton>
          <ComicButton variant="cyan" disabled={!!busyAction} onClick={giveAllImmunity}>ΑΣΥΛΙΑ ΣΕ ΟΛΕΣ</ComicButton>
        </div>
      </ComicPanel>
    </div>
  );
}
