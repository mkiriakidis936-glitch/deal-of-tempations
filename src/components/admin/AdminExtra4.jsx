import React, { useMemo, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const numberValue = (value) => Math.max(0, Number(value) || 0);

export default function AdminExtra4({ sessions = [], selectedSession, onSelect, onNavigate, onUpdate }) {
  const [playerId, setPlayerId] = useState('');
  const [amount, setAmount] = useState('1');
  const session = selectedSession || sessions[0] || null;
  const state = session?.state || {};
  const extra4 = state.extra4 || {};
  const players = state.players || [];
  const terminals = Object.values(extra4.cards?.terminals || {}).filter(Boolean);
  const activeTerminals = terminals.filter((item) => item.active).length;
  const tokens = Object.values(extra4.economy?.tokens || {}).reduce((sum, value) => sum + numberValue(value), 0);
  const keys = Object.values(extra4.economy?.keys || {}).reduce((sum, value) => sum + numberValue(value), 0);
  const activeActivity = extra4.activity?.active?.status === 'active' ? extra4.activity.active : null;
  const selectedPlayerId = players.some((player) => player.id === playerId) ? playerId : players[0]?.id || '';
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId);
  const terminalEntries = useMemo(() => terminals.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [extra4.cards?.terminals]);

  async function saveExtra(patch) {
    if (!session?.id || !onUpdate) return;
    await onUpdate(session.id, {
      ...state,
      extra4: { ...extra4, ...patch },
    });
  }

  async function adjustBalance(kind, delta) {
    if (!selectedPlayerId) return;
    const current = numberValue(extra4.economy?.[kind]?.[selectedPlayerId]);
    const next = Math.max(0, current + delta);
    if (next === current) return;
    const transaction = {
      id: globalThis.crypto?.randomUUID?.() || `admin-economy-${Date.now()}`,
      type: kind === 'tokens' ? 'admin_tokens_adjustment' : 'admin_keys_adjustment',
      playerId: selectedPlayerId,
      mode: state.mode || null,
      amount: next - current,
      timestamp: Date.now(),
      source: 'central_admin',
    };
    await saveExtra({
      economy: {
        ...(extra4.economy || {}),
        [kind]: { ...(extra4.economy?.[kind] || {}), [selectedPlayerId]: next },
        transactions: [transaction, ...(extra4.economy?.transactions || [])].slice(0, 100),
      },
    });
  }

  async function changeTerminal(code, active) {
    const next = { ...(extra4.cards?.terminals || {}) };
    const terminal = next[code];
    if (!terminal) return;
    next[code] = active
      ? { ...terminal, active: true, reactivatedAt: Date.now() }
      : { ...terminal, active: false, deactivatedAt: Date.now() };
    await saveExtra({ cards: { ...(extra4.cards || {}), terminals: next } });
  }

  async function deleteTerminal(code) {
    const terminal = extra4.cards?.terminals?.[code];
    if (!terminal || terminal.active) return;
    const next = { ...(extra4.cards.terminals || {}) };
    delete next[code];
    await saveExtra({ cards: { ...(extra4.cards || {}), terminals: next } });
  }

  async function removeLoot(id) {
    const lootPool = (extra4.economy?.lootPool || []).map((item) =>
      item.id === id ? { ...item, removedAt: Date.now() } : item
    );
    await saveExtra({ economy: { ...(extra4.economy || {}), lootPool } });
  }

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-card space-y-3">
        <div className="ds-eyebrow text-primary/80">DEAL OF TEMPTATION</div>
        <div className="ds-title text-2xl">EXTRA 4.0 · ΚΕΝΤΡΙΚΗ ΔΙΑΧΕΙΡΙΣΗ</div>
        <p className="text-sm text-foreground/65">Κεντρική διαχείριση των δεδομένων EXTRA 4.0 της επιλεγμένης συνεδρίας. Οι υπάρχουσες ενότητες περιεχομένου και VIP παραμένουν συνδεδεμένες.</p>
        <label className="block text-xs">Ενεργή συνεδρία
          <select value={session?.id || ''} onChange={(event) => onSelect?.(sessions.find((item) => item.id === event.target.value))} className="mt-1 w-full rounded-lg border border-border bg-background p-2">
            {sessions.map((item) => <option key={item.id} value={item.id}>{item.sessionCode || item.id} · {item.state?.mode || '—'}</option>)}
          </select>
        </label>
      </ComicPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">ΤΑΚΤΙΚΗ</div><div className="font-heading text-xl text-primary">{extra4.tactical?.level || 'STANDARD'}</div></ComicPanel>
        <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">ΖΩΝΤΑΝΗ ΡΟΗ</div><div className="font-heading text-lg">{extra4.liveFeed?.status || 'OFF'}</div></ComicPanel>
        <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">ΕΝΕΡΓΑ QR</div><div className="font-heading text-2xl">{activeTerminals}</div></ComicPanel>
        <ComicPanel className="bg-card p-3"><div className="ds-label text-foreground/50">ΜΟΝΑΔΕΣ / ΚΛΕΙΔΙΑ</div><div className="font-heading text-xl">{tokens} / {keys}</div></ComicPanel>
      </div>

      {session && <>
        <ComicPanel className="bg-card space-y-2">
          <div className="ds-label text-primary/80">ΤΡΕΧΟΥΣΑ ΚΑΤΑΣΤΑΣΗ</div>
          <div className="text-sm">Λειτουργία: <strong>{state.mode || '—'}</strong></div>
          <div className="text-sm">Έλεγχος: <strong>{extra4.control?.status || (state.stopActive ? 'paused' : 'running')}</strong></div>
          <div className="text-sm">Δραστηριότητα: <strong>{activeActivity?.label || 'Καμία ενεργή δραστηριότητα'}</strong></div>
          <div className="text-sm">Ψηφιακή κάρτα: <strong>{extra4.cards?.activeCard?.name || 'Καμία επιλεγμένη κάρτα'}</strong></div>
          {extra4.cards?.activeCard && <ComicButton variant="red" size="sm" onClick={() => saveExtra({ cards: { ...(extra4.cards || {}), activeCard: null } })}>ΚΑΘΑΡΙΣΜΟΣ ΚΑΡΤΑΣ ΑΠΟ TV</ComicButton>}
        </ComicPanel>

        <ComicPanel className="bg-card space-y-3">
          <div className="ds-label text-primary/80">GLAM ΜΟΝΑΔΕΣ & ΚΛΕΙΔΙΑ</div>
          <label className="block text-xs">Παίκτης
            <select value={selectedPlayerId} onChange={(event) => setPlayerId(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-2">
              {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
            </select>
          </label>
          {selectedPlayer && <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-secondary p-3"><div className="text-xs text-foreground/50">ΜΟΝΑΔΕΣ</div><div className="font-heading text-2xl">{numberValue(extra4.economy?.tokens?.[selectedPlayerId])}</div></div>
            <div className="rounded bg-secondary p-3"><div className="text-xs text-foreground/50">ΚΛΕΙΔΙΑ</div><div className="font-heading text-2xl">{numberValue(extra4.economy?.keys?.[selectedPlayerId])}</div></div>
          </div>}
          <label className="block text-xs">Ποσότητα<input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-2" /></label>
          <div className="grid grid-cols-2 gap-2">
            <ComicButton onClick={() => adjustBalance('tokens', numberValue(amount))} disabled={!selectedPlayerId || numberValue(amount) < 1}>ΠΡΟΣΘΗΚΗ ΜΟΝΑΔΕΣ</ComicButton>
            <ComicButton variant="red" onClick={() => adjustBalance('tokens', -numberValue(amount))} disabled={!selectedPlayerId || numberValue(amount) < 1}>ΑΦΑΙΡΕΣΗ ΜΟΝΑΔΕΣ</ComicButton>
            <ComicButton variant="yellow" onClick={() => adjustBalance('keys', 1)} disabled={!selectedPlayerId}>ΑΠΟΝΟΜΗ ΚΛΕΙΔΙΟΥ</ComicButton>
            <ComicButton variant="red" onClick={() => adjustBalance('keys', -1)} disabled={!selectedPlayerId || !numberValue(extra4.economy?.keys?.[selectedPlayerId])}>ΑΦΑΙΡΕΣΗ ΚΛΕΙΔΙΟΥ</ComicButton>
          </div>
        </ComicPanel>

        <ComicPanel className="bg-card space-y-3">
          <div className="ds-label text-primary/80">ΣΥΛΛΟΓΗ ΑΝΤΙΚΕΙΜΕΝΩΝ · {state.mode || '—'}</div>
          {(extra4.economy?.lootPool || []).filter((item) => !item.removedAt && !item.consumedAt).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 border-b border-border/50 py-2 text-xs">
              <span>{item.name} · {String(item.rarity || 'common').toUpperCase()} · {item.mode || 'all'}</span>
              <ComicButton size="sm" variant="red" onClick={() => removeLoot(item.id)}>ΑΦΑΙΡΕΣΗ</ComicButton>
            </div>
          ))}
          {!(extra4.economy?.lootPool || []).some((item) => !item.removedAt && !item.consumedAt) && <div className="text-xs text-foreground/50">Δεν υπάρχουν διαθέσιμα αντικείμενα Loot.</div>}
        </ComicPanel>

        <ComicPanel className="bg-card space-y-3">
          <div className="ds-label text-primary/80">ΣΥΣΚΕΥΕΣ QR</div>
          {terminalEntries.map((terminal) => (
            <div key={terminal.code} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 text-xs">
              <span>{players.find((player) => player.id === terminal.playerId)?.name || 'Παίκτης'} · {terminal.active ? 'ΕΝΕΡΓΟ' : 'ΑΝΕΝΕΡΓΟ'}</span>
              <div className="flex gap-2">
                {terminal.active
                  ? <ComicButton size="sm" variant="red" onClick={() => changeTerminal(terminal.code, false)}>ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ</ComicButton>
                  : <><ComicButton size="sm" variant="green" onClick={() => changeTerminal(terminal.code, true)}>ΕΠΑΝΕΝΕΡΓΟΠΟΙΗΣΗ</ComicButton><ComicButton size="sm" variant="red" onClick={() => deleteTerminal(terminal.code)}>ΔΙΑΓΡΑΦΗ</ComicButton></>}
              </div>
            </div>
          ))}
          {!terminalEntries.length && <div className="text-xs text-foreground/50">Δεν υπάρχουν QR Terminals.</div>}
        </ComicPanel>
      </>}

      <ComicPanel className="bg-card space-y-3">
        <div className="ds-label text-primary/80">ΣΥΝΔΕΔΕΜΕΝΕΣ ΔΙΑΧΕΙΡΙΣΕΙΣ</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <ComicButton onClick={() => onNavigate?.('editor')}>ΚΑΡΤΕΣ & ΠΕΡΙΕΧΟΜΕΝΟ ΠΑΙΧΝΙΔΙΟΥ</ComicButton>
          <ComicButton variant="purple" onClick={() => onNavigate?.('invitations')}>VIP ΠΡΟΣΚΛΗΣΕΙΣ & QR</ComicButton>
          <ComicButton variant="yellow" onClick={() => onNavigate?.('forms')}>VIP ΠΡΟΦΙΛ & ΟΡΙΑ</ComicButton>
          <ComicButton onClick={() => onNavigate?.('links')}>ΣΥΝΔΕΣΜΟΙ QR & ΣΥΣΚΕΥΕΣ</ComicButton>
          <ComicButton variant="green" onClick={() => onNavigate?.('players')}>ΠΑΙΚΤΡΙΕΣ & ΡΟΛΟΙ</ComicButton>
          <ComicButton variant="red" onClick={() => onNavigate?.('live')}>ΖΩΝΤΑΝΟΣ ΕΛΕΓΧΟΣ</ComicButton>
        </div>
      </ComicPanel>
      {!session && <div className="text-sm text-foreground/60">Δεν υπάρχει διαθέσιμη συνεδρία. Δημιούργησε ή επίλεξε συνεδρία για να εμφανιστεί η κατάσταση EXTRA 4.0.</div>}
    </div>
  );
}
