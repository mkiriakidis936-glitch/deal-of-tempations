import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44, request } from '@/api/base44Client';

export default function TVProductionOutput({ sessionCode }) {
  const [cue, setCue] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const lastCommandRef = useRef('');
  const activeSessionRef = useRef(sessionCode);
  const cueRef = useRef(null);

  useEffect(() => {
    activeSessionRef.current = sessionCode;
    cueRef.current = null;
    setCue(null);
    setError('');
    lastCommandRef.current = '';
    let alive = true;

    const refresh = async () => {
      if (!sessionCode) return;
      try {
        const { items = [] } = await base44.entities.ProductionCue.filter({ sessionCode }, { limit: 1 });
        if (alive && activeSessionRef.current === sessionCode) {
          const next = items[0] || null;
          cueRef.current = next;
          setCue(next);
          if (next?.playbackStatus === 'error') setError(next.playbackError || 'Αποτυχία αναπαραγωγής.');
          else if (next?.playbackStatus === 'playing' || next?.playbackStatus === 'ready') setError('');
        }
      } catch {
        if (alive) setError('Δεν ήταν δυνατή η σύνδεση με τον έλεγχο TV.');
      }
    };

    refresh();
    const off = base44.entities.ProductionCue.subscribe((event) => {
      if (event?.type === 'resync' || event?.data?.sessionCode === sessionCode) refresh();
    }, { sessionCode });

    return () => {
      alive = false;
      off?.();
    };
  }, [sessionCode]);

  const acknowledge = useCallback(async (targetCue, status, detail = '') => {
    if (!targetCue?.id || !targetCue.commandId) return;
    try {
      await request('POST', '/api/entities/production-cue/ack', {
        cueId: targetCue.id,
        sessionCode: targetCue.sessionCode || sessionCode,
        commandId: targetCue.commandId,
        status,
        error: detail,
      });
      if (cueRef.current?.commandId === targetCue.commandId) {
        if (status === 'error') setError(detail || 'Αποτυχία αναπαραγωγής.');
        else if (status === 'playing' || status === 'ready') setError('');
      }
    } catch (err) {
      if (cueRef.current?.commandId === targetCue.commandId) {
        setError(err.message || 'Δεν στάλθηκε επιβεβαίωση στην κονσόλα.');
      }
    }
  }, [sessionCode]);

  useEffect(() => {
    if (!cue?.active || !cue.commandId || lastCommandRef.current === cue.commandId) return;
    lastCommandRef.current = cue.commandId;
    const targetCue = cue;
    const media = cue.kind === 'video' ? videoRef.current : cue.kind === 'audio' ? audioRef.current : null;
    const command = cue.playbackCommand || 'play';

    if (media) {
      media.volume = Math.max(0, Math.min(1, Number(cue.volume ?? 0.8)));
      media.muted = command === 'mute';
    }

    if (command === 'pause') {
      media?.pause();
      acknowledge(targetCue, 'paused');
    } else if (command === 'stop') {
      if (media) {
        media.pause();
        try { media.currentTime = 0; } catch {}
      }
      acknowledge(targetCue, 'stopped');
    } else if (command === 'close') {
      if (media) media.pause();
      acknowledge(targetCue, 'closed');
    } else if (command === 'volume') {
      if (media && Number.isFinite(cue.volume)) media.volume = Math.max(0, Math.min(1, cue.volume));
      acknowledge(targetCue, 'ready');
    } else if (command === 'mute' || command === 'unmute') {
      if (media) media.muted = command === 'mute';
      acknowledge(targetCue, 'ready');
    } else if (command === 'play') {
      if (!media) {
        acknowledge(targetCue, 'ready');
        return;
      }
      // Αν ο browser της TV μπλοκάρει τον ήχο, το βίντεο παίζει σε σίγαση αντί να μείνει παγωμένο.
      media.play().catch((err) => {
        if (err?.name !== 'NotAllowedError') { acknowledge(targetCue, 'error', err?.message || 'Ο browser απέρριψε την αναπαραγωγή.'); return; }
        media.muted = true;
        media.play()
          .then(() => acknowledge(targetCue, 'playing', 'Παίζει σε σίγαση — πάτα μία φορά στην TV για ήχο.'))
          .catch((retryError) => acknowledge(targetCue, 'error', retryError?.message || 'Ο browser απέρριψε την αναπαραγωγή.'));
      });
    }
  }, [cue, acknowledge]);

  if (!cue?.active) return null;
  const isMedia = cue.kind === 'video' || cue.kind === 'audio';
  const mediaProps = {
    src: cue.source,
    autoPlay: false,
    playsInline: true,
    preload: 'metadata',
    onCanPlay: () => acknowledge(cue, 'ready'),
    onPlaying: () => acknowledge(cue, 'playing'),
    onEnded: () => acknowledge(cue, 'ended'),
    onError: () => acknowledge(cue, 'error', 'Η TV δεν μπόρεσε να φορτώσει ή να αναπαράγει το αρχείο.'),
  };

  return (
    <section className="fixed inset-0 z-[120] flex items-center justify-center bg-black text-white" aria-label="Κεντρική έξοδος παραγωγής TV">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {cue.kind === 'video' && <video key={cue.id + cue.source} ref={videoRef} {...mediaProps} controls className="max-h-full max-w-full object-contain" />}
        {cue.kind === 'audio' && <div className="w-full max-w-xl space-y-6 text-center"><div className="text-6xl">♫</div><h2 className="text-2xl font-bold">{cue.label}</h2><audio key={cue.id + cue.source} ref={audioRef} {...mediaProps} controls className="w-full" /></div>}
        {cue.kind === 'image' && <img src={cue.source} alt={cue.label || 'Production media'} decoding="async" onLoad={() => acknowledge(cue, 'ready')} onError={() => acknowledge(cue, 'error', 'Η TV δεν μπόρεσε να φορτώσει την εικόνα.')} className="max-h-full max-w-full object-contain" />}
        {!isMedia && cue.kind !== 'image' && <div className="max-w-5xl text-center space-y-4"><p className="text-sm tracking-[0.3em] text-white/60">DEAL OF TEMPTATIONS · LIVE</p><h1 className="text-5xl md:text-7xl font-bold">{cue.label}</h1>{cue.winnerName && <p className="text-3xl">{cue.winnerName}</p>}{cue.winnerNotes && <p className="text-xl text-white/75">{cue.winnerNotes}</p>}</div>}
      </div>
      <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-2 text-xs" role="status">{error || cue.playbackError || cue.playbackStatus || 'LIVE OUTPUT'}</div>
      <button type="button" onClick={() => acknowledge(cue, 'closed')} className="absolute right-4 top-4 rounded-lg border border-white/40 bg-black/75 px-4 py-2 text-sm font-bold">ΚΛΕΙΣΙΜΟ</button>
    </section>
  );
}
