import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { GAME_MODES } from '@/data/gameConfig';

const MODE_NAMES = Object.fromEntries(GAME_MODES.map((mode) => [mode.id, mode.name]));
const dateLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('el-GR');
};

export default function AdminSessionRecovery() {
  const [sessions, setSessions] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [sessionResult, snapshotResult] = await Promise.all([
        base44.entities.GameSession.filter({}, { sort: '-created_date', limit: 200 }),
        base44.entities.GameSessionSnapshot.filter({}, { sort: '-created_date', limit: 500 }),
      ]);
      setSessions(sessionResult.items || []);
      setSnapshots(snapshotResult.items || []);
    } catch (error) {
      setMessage({ ok: false, text: error.message || 'Δεν φορτώθηκαν τα δεδομένα ανάκτησης.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const snapshotsBySession = useMemo(() => {
    const grouped = new Map();
    snapshots.forEach((snapshot) => {
      const key = snapshot.sessionId;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(snapshot);
    });
    return grouped;
  }, [snapshots]);

  async function createSnapshot(session, label = 'Χειροκίνητο αντίγραφο') {
    const state = session.state || {};
    await base44.entities.GameSessionSnapshot.create({
      sessionId: session.id,
      sessionCode: session.sessionCode,
      mode: state.mode || session.mode || '',
      stage: Number(state.stage ?? 0),
      playerCount: Array.isArray(state.players) ? state.players.length : 0,
      label,
      state: JSON.parse(JSON.stringify(state)),
      sourceUpdatedAt: session.updated_date || session.created_date || null,
    });
  }

  async function saveSnapshot(session) {
    setBusy(session.id);
    setMessage(null);
    try {
      await createSnapshot(session);
      await load();
      setMessage({ ok: true, text: `Δημιουργήθηκε ασφαλές snapshot για τη συνεδρία ${session.sessionCode}.` });
    } catch (error) {
      setMessage({ ok: false, text: error.message || 'Δεν δημιουργήθηκε το snapshot.' });
    } finally {
      setBusy(null);
    }
  }

  async function restoreSnapshot(snapshot) {
    const session = sessions.find((item) => item.id === snapshot.sessionId);
    if (!session || session.sessionCode !== snapshot.sessionCode) {
      setMessage({ ok: false, text: 'Η αρχική συνεδρία δεν βρέθηκε ή δεν ταιριάζει. Δεν έγινε επαναφορά.' });
      return;
    }
    if (!snapshot.state || typeof snapshot.state !== 'object' || Array.isArray(snapshot.state)) {
      setMessage({ ok: false, text: 'Το snapshot δεν περιέχει έγκυρη κατάσταση παιχνιδιού.' });
      return;
    }
    const approved = window.confirm(
      `Επαναφορά της συνεδρίας ${snapshot.sessionCode} στο snapshot «${snapshot.label || 'Snapshot'}» της ${dateLabel(snapshot.created_date)}; Θα αποθηκευτεί πρώτα snapshot της τρέχουσας κατάστασης.`
    );
    if (!approved) return;

    setBusy(snapshot.id);
    setMessage(null);
    try {
      await createSnapshot(session, 'Αυτόματο αντίγραφο πριν από επαναφορά');
      await base44.entities.GameSession.update(session.id, { state: snapshot.state });
      await load();
      setMessage({ ok: true, text: `Η συνεδρία ${snapshot.sessionCode} επανήλθε. Το προηγούμενο state διατηρήθηκε ως snapshot.` });
    } catch (error) {
      setMessage({ ok: false, text: error.message || 'Η επαναφορά απέτυχε. Το αρχικό snapshot διατηρήθηκε.' });
    } finally {
      setBusy(null);
    }
  }

  async function deleteSnapshot(snapshot) {
    if (!window.confirm(`Να διαγραφεί μόνο το snapshot «${snapshot.label || 'Snapshot'}»; Η συνεδρία δεν θα επηρεαστεί.`)) return;
    setBusy(snapshot.id);
    try {
      await base44.entities.GameSessionSnapshot.delete(snapshot.id);
      setSnapshots((current) => current.filter((item) => item.id !== snapshot.id));
      setMessage({ ok: true, text: 'Το snapshot διαγράφηκε.' });
    } catch (error) {
      setMessage({ ok: false, text: error.message || 'Δεν διαγράφηκε το snapshot.' });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <ComicPanel className="bg-card text-center py-8"><div className="font-heading text-xl comic-pulse">ΦΟΡΤΩΣΗ ΙΣΤΟΡΙΚΟΥ ΚΑΙ SNAPSHOTS…</div></ComicPanel>;

  return (
    <div className="space-y-4">
      <ComicPanel className="bg-secondary">
        <div className="font-heading text-xl text-primary">🛟 SESSION RECOVERY</div>
        <p className="mt-1 text-xs text-foreground/65">Αποθήκευση σημείων επαναφοράς και ασφαλής συνέχιση υπάρχουσας συνεδρίας. Η επαναφορά δημιουργεί πρώτα snapshot της τρέχουσας κατάστασης.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-lg bg-background/60 px-3 py-2 text-xs font-bold">{sessions.length} συνεδρίες</span>
          <span className="rounded-lg bg-background/60 px-3 py-2 text-xs font-bold">{snapshots.length} snapshots</span>
          <ComicButton size="sm" variant="dark" onClick={load}>↻ Ανανέωση</ComicButton>
        </div>
      </ComicPanel>

      {message && <ComicPanel className={message.ok ? 'bg-tarot-forest' : 'bg-tarot-crimson'}><div className="text-sm font-bold">{message.text}</div></ComicPanel>}

      {sessions.length === 0 ? (
        <ComicPanel className="bg-card text-center py-8"><div className="font-heading text-lg">Δεν υπάρχουν αποθηκευμένες συνεδρίες</div><div className="mt-1 text-xs text-foreground/55">Δεν δημιουργήθηκαν δοκιμαστικά δεδομένα.</div></ComicPanel>
      ) : sessions.map((session) => {
        const state = session.state || {};
        const history = Array.isArray(state.history) ? state.history : [];
        const sessionSnapshots = snapshotsBySession.get(session.id) || [];
        const isExpanded = expanded === session.id;
        return (
          <ComicPanel key={session.id} className="bg-card space-y-3">
            <button type="button" onClick={() => setExpanded(isExpanded ? null : session.id)} className="w-full flex items-start justify-between gap-3 text-left">
              <span className="min-w-0">
                <span className="block font-heading text-lg">{session.sessionCode || 'Χωρίς κωδικό'}</span>
                <span className="block text-xs text-foreground/60">{MODE_NAMES[state.mode || session.mode] || state.mode || session.mode || 'Mode μη διαθέσιμο'} · Stage {state.stage ?? '—'} · {(state.players || []).length} παίκτες</span>
                <span className="block text-[11px] text-foreground/45">Τελευταία ενημέρωση: {dateLabel(session.updated_date || session.created_date)}</span>
              </span>
              <span className="shrink-0 text-xs font-bold">{sessionSnapshots.length} snapshots {isExpanded ? '▲' : '▼'}</span>
            </button>
            <div className="flex flex-wrap gap-2">
              <ComicButton size="sm" variant="green" disabled={busy === session.id} onClick={() => saveSnapshot(session)}>{busy === session.id ? '…' : '＋ Αποθήκευση snapshot'}</ComicButton>
              <span className="self-center text-xs text-foreground/55">Ιστορικό κινήσεων: {history.length}</span>
            </div>
            {isExpanded && (
              <div className="space-y-3 border-t border-border/40 pt-3">
                <div>
                  <div className="mb-2 text-xs font-bold">ΔΙΑΘΕΣΙΜΑ SNAPSHOTS</div>
                  {sessionSnapshots.length === 0 ? <div className="text-xs text-foreground/50">Δεν υπάρχει snapshot για αυτή τη συνεδρία.</div> : (
                    <div className="space-y-2">
                      {sessionSnapshots.map((snapshot) => (
                        <div key={snapshot.id} className="rounded-xl border border-border/60 bg-background/50 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-bold">{snapshot.label || 'Snapshot'}</div>
                              <div className="text-[11px] text-foreground/55">{dateLabel(snapshot.created_date)} · Stage {snapshot.stage ?? '—'} · {snapshot.playerCount ?? 0} παίκτες</div>
                            </div>
                            <div className="flex gap-2">
                              <ComicButton size="sm" variant="yellow" disabled={busy === snapshot.id} onClick={() => restoreSnapshot(snapshot)}>↶ Επαναφορά</ComicButton>
                              <ComicButton size="sm" variant="red" disabled={busy === snapshot.id} onClick={() => deleteSnapshot(snapshot)}>🗑</ComicButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-2 text-xs font-bold">ΠΡΟΣΦΑΤΟ ΙΣΤΟΡΙΚΟ ΠΑΙΧΝΙΔΙΟΥ</div>
                  {history.length === 0 ? <div className="text-xs text-foreground/50">Δεν υπάρχουν καταχωρισμένα events.</div> : (
                    <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg bg-background/50 p-2">
                      {[...history].reverse().map((event, index) => (
                        <div key={event.id || event.timestamp || index} className="flex gap-2 border-b border-border/30 py-1 text-xs last:border-0">
                          <span className="shrink-0 text-foreground/40">{dateLabel(event.timestamp)}</span>
                          <span className="font-bold">{event.type || 'Event'}</span>
                          <span className="min-w-0 break-words text-foreground/65">{event.player || event.description || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ComicPanel>
        );
      })}
    </div>
  );
}
