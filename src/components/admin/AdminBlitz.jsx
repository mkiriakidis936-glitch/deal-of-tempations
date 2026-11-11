import React, { useEffect, useMemo, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import BlitzOverlay from '@/components/shared/BlitzOverlay';
import ScaledFrame from '@/components/admin/ScaledFrame';
import { blitzEntries, BLITZ_DURATION } from '@/data/blitzCommands';
import { getRemaining } from '@/lib/syncTimer';

export default function AdminBlitz({ sessions, selectedSession, onSelect, onUpdate }) {
  const session = selectedSession || sessions?.[0] || null;
  const state = session?.state || {};
  const players = state.players || [];
  const live = state.blitz;

  const [entries, setEntries] = useState(() => blitzEntries(players));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEntries(blitzEntries(players));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length, session?.id]);

  const roster = useMemo(() => blitzEntries(players).map(({ id, name }) => ({ id, name })), [players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function push(patch) {
    if (!session) return;
    setBusy(true);
    try {
      await onUpdate(session.id, { ...state, blitz: { ...(live || {}), ...patch } });
    } finally {
      setBusy(false);
    }
  }

  function play(mode) {
    const nextEntries = mode === 'commands' ? entries : roster;
    setEntries(mode === 'commands' ? entries : nextEntries);
    push({
      active: true,
      mode,
      running: true,
      duration: BLITZ_DURATION,
      startedAt: Date.now(),
      endsAt: Date.now() + BLITZ_DURATION * 1000,
      remaining: BLITZ_DURATION,
      entries: nextEntries,
    });
  }

  function stop() {
    push({ running: false, remaining: getRemaining(live) });
  }

  function hide() {
    push({ active: false, running: false });
  }

  function reshuffle() {
    const next = blitzEntries(players);
    setEntries(next);
    if (live?.active && live.mode === 'commands') push({ entries: next });
  }

  function previewFor(mode) {
    const base = {
      active: true,
      mode,
      duration: BLITZ_DURATION,
      entries: mode === 'commands' ? entries : roster,
    };
    if (live?.active && live.mode === mode) {
      return { ...base, running: live.running, endsAt: live.endsAt, remaining: live.remaining, entries: live.entries || base.entries };
    }
    return { ...base, running: false, remaining: BLITZ_DURATION };
  }

  if (!session) {
    return (
      <ComicPanel className="bg-card text-center py-8">
        <div className="text-3xl mb-2">⚡</div>
        <div className="font-heading text-lg text-primary">Καμία συνεδρία</div>
        <div className="text-xs text-foreground/60 font-body">Άνοιξε πρώτα συνεδρία από το Tablet για να στείλεις τα 8 δευτερόλεπτα στην TV.</div>
      </ComicPanel>
    );
  }

  const isLive = (mode) => live?.active && live.mode === mode;

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-secondary flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-heading text-2xl comic-text-stroke text-primary">⚡ 8 ΔΕΥΤΕΡΟΛΕΠΤΑ</div>
          <div className="text-[11px] text-foreground/60 font-body">
            Ό,τι πατάς εδώ εμφανίζεται αμέσως στην TV της ίδιας συνεδρίας.
          </div>
        </div>
        <select
          value={session.id}
          onChange={(e) => onSelect(sessions.find((s) => s.id === e.target.value) || null)}
          className="px-3 py-1.5 rounded-lg border-2 border-border bg-background text-foreground font-bold text-xs"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.sessionCode} · {s.mode} · {s.state?.players?.length || 0} παίκτριες
            </option>
          ))}
        </select>
      </ComicPanel>

      <div className="grid gap-3 lg:grid-cols-2">
        <ComicPanel className="bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-heading text-sm text-tarot-gold">⏱ ΧΡΟΝΟΜΕΤΡΟ · ΟΛΕΣ ΟΙ ΠΑΙΚΤΡΙΕΣ</div>
            {isLive('timer') && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${live.running ? 'bg-destructive text-foreground comic-pulse' : 'bg-primary text-tarot-dark'}`}>
                {live.running ? 'LIVE' : 'ΠΑΥΣΗ'}
              </span>
            )}
          </div>
          <ScaledFrame>
            <BlitzOverlay blitz={previewFor('timer')} embedded />
          </ScaledFrame>
          <div className="grid grid-cols-2 gap-2">
            <ComicButton variant="green" size="sm" onClick={() => play('timer')} disabled={busy}>▶ PLAY</ComicButton>
            <ComicButton variant="yellow" size="sm" onClick={stop} disabled={busy || !isLive('timer') || !live?.running}>■ STOP</ComicButton>
          </div>
        </ComicPanel>

        <ComicPanel className="bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-heading text-sm text-tarot-gold">📋 ΕΝΤΟΛΕΣ · ΤΙ ΚΑΝΕΙ / ΤΙ ΠΡΕΠΕΙ</div>
            {isLive('commands') && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${live.running ? 'bg-destructive text-foreground comic-pulse' : 'bg-primary text-tarot-dark'}`}>
                {live.running ? 'LIVE' : 'ΠΑΥΣΗ'}
              </span>
            )}
          </div>
          <ScaledFrame>
            <BlitzOverlay blitz={previewFor('commands')} embedded />
          </ScaledFrame>
          <div className="grid grid-cols-3 gap-2">
            <ComicButton variant="green" size="sm" onClick={() => play('commands')} disabled={busy}>▶ PLAY</ComicButton>
            <ComicButton variant="yellow" size="sm" onClick={stop} disabled={busy || !isLive('commands') || !live?.running}>■ STOP</ComicButton>
            <ComicButton variant="purple" size="sm" onClick={reshuffle} disabled={busy}>🎲 ΝΕΕΣ</ComicButton>
          </div>
        </ComicPanel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-foreground/50 font-body">
          Οι παίκτριες διαβάζονται από τη συνεδρία · χωρίς παίκτριες εμφανίζονται δοκιμαστικά ονόματα.
          {sessions[0] && session.id !== sessions[0].id && (
            <span className="text-destructive font-bold"> Η TV δείχνει την πιο πρόσφατη συνεδρία ({sessions[0].sessionCode}).</span>
          )}
        </div>
        <ComicButton variant="dark" size="sm" onClick={hide} disabled={busy || !live?.active}>✕ ΚΛΕΙΣΙΜΟ ΣΤΗΝ TV</ComicButton>
      </div>
    </div>
  );
}