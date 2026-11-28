import React, { useEffect, useState } from 'react';
import { appApi } from '@/api/apiClient';
import ModeMobile from '@/components/modes/ModeMobile';
import ModeArt from '@/components/modes/ModeArt';
import MobileStatus from '@/components/play/MobileStatus';
import PlayerCard from '@/components/shared/PlayerCard';
import SectionErrorBoundary from '@/components/shared/SectionErrorBoundary';
import { isNewMode } from '@/data/modes/modeRegistry';

// /play/preview?code=XXXX&player=ID — η οθόνη κινητού μιας παίκτριας, ΜΟΝΟ για προβολή μέσα στο Admin.
// Δεν χρησιμοποιεί τη ροή του /play: καμία παρουσία (heartbeat), κανένα PIN, καμία ουρά αλλαγών,
// καμία αποθήκευση στη συσκευή. Οι ενέργειες είναι «νεκρές» και η σελίδα δεν δέχεται πατήματα.

const noAction = async () => false;

function Screen({ state, me, code }) {
  if (!me) return <div className="ui-page grid min-h-screen place-items-center p-6 text-center text-white/60">Διάλεξε παίκτρια για προβολή.</div>;
  if (isNewMode(state.mode)) return <ModeMobile state={state} me={me} updateState={noAction} sessionCode={code} onChangePlayer={() => {}} />;
  return (
    <div className="ui-page space-y-3 p-4">
      <PlayerCard player={me} showRole compact />
      {(state.mode === 'classic' || state.mode === 'arrest_heist') && <ModeArt state={state} alt="" className="aspect-[16/9] rounded-2xl" />}
      <MobileStatus state={state} myPlayer={me} isMyTurn={state.players?.[state.currentPlayerIndex]?.id === me.id} />
    </div>
  );
}

export default function PlayPreview() {
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('code') || '').trim().toUpperCase();
  const playerId = params.get('player') || '';
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!code) { setStatus('missing'); return undefined; }
    let alive = true;
    const load = () => appApi.entities.GameSession.filter({ sessionCode: code }, { sort: '-created_date', limit: 1 })
      .then(({ items = [] }) => { if (!alive) return; setSession(items[0] || null); setStatus(items[0] ? 'ok' : 'missing'); })
      .catch(() => { if (alive) setStatus('error'); });
    load();
    const off = appApi.entities.GameSession.subscribe((event) => {
      if (!alive) return;
      if (event?.type === 'resync') { load(); return; }
      setSession((current) => {
        if (!current || event?.id !== current.id) return current;
        if (event.type === 'delete') return null;
        return { ...current, ...event.data };
      });
    }, { sessionCode: code });
    return () => { alive = false; off(); };
  }, [code]);

  if (status !== 'ok' || !session) {
    const text = { loading: 'Φόρτωση…', missing: 'Δεν βρέθηκε η παρτίδα.', error: 'Δεν ήταν δυνατή η σύνδεση.' }[status] || 'Δεν βρέθηκε η παρτίδα.';
    return <div className="ui-page grid min-h-screen place-items-center p-6 text-center text-white/60">{text}</div>;
  }
  const state = session.state || {};
  const me = (state.players || []).find((p) => p.id === playerId) || null;
  return (
    <div inert="" aria-hidden="true" style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <SectionErrorBoundary name="play-preview" resetKey={`${playerId}:${state.mode}`}>
        <Screen state={state} me={me} code={code} />
      </SectionErrorBoundary>
    </div>
  );
}
