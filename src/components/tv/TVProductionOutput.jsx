import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44, request } from '@/api/base44Client';

export default function TVProductionOutput({ sessionCode }) {
  const [cue, setCue] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const lastCommandRef = useRef('');

  const refresh = useCallback(async () => {
    if (!sessionCode) return;
    try {
      const { items = [] } = await base44.entities.ProductionCue.filter({ sessionCode }, { limit: 1 });
      setCue(items[0] || null);
    } catch (err) {
      setError('Δεν ήταν δυνατή η σύνδεση με τον έλεγχο TV.');
    }
  }, [sessionCode]);

  useEffect(() => {
    setCue(null);
    setError('');
    lastCommandRef.current = '';
    refresh();
    const off = base44.entities.ProductionCue.subscribe((event) => {
      if (event?.data?.sessionCode === sessionCode) refresh();
    }, { sessionCode });
    return () => off?.();
  }, [sessionCode, refresh]);

  const acknowledge = useCallback(async (status, detail = '') => {
    if (!cue?.id || !cue.commandId) return;
    try {
      await request('POST', '/api/entities/production-cue/ack', {
        cueId: cue.id,
        sessionCode,
        commandId: cue.commandId,
        status,
        error: detail,
      });
      if (status === 'error') setError(detail || 'Αποτυχία αναπαραγωγής.');
      else if (status === 'playing' || status === 'ready') setError('');
    } catch (err) {
      setError(err.message || 'Δεν στάλθηκε επιβεβαίωση στην κονσόλα.');
    }
  }, [cue, sessionCode]);

  useEffect(() => {
    if (!cue?.active || !cue.commandId || lastCommandRef.current === cue.commandId) return;
    lastCommandRef.current = cue.commandId;
    const media = cue.kind === 'video' ? videoRef.current : cue.kind === 'audio' ? audioRef.current : null;
    if (media) {
      media.volume = Math.max(0, Math.min(1, Number(cue.volume ?? 0.8)));
      media.muted = cue.playbackCommand === 'mute';
    }
    const command = cue.playbackCommand || 'play';
    if (command === 'pause') {
      media?.pause();
      acknowledge('paused');
    } else if (command === 'stop') {
      if (media) { media.pause(); media.currentTime = 0; }
      acknowledge('stopped');
    } else if (command === 'volume') {
      if (media && Number.isFinite(cue.volume)) media.volume = Math.max(0, Math.min(1, cue.volume));
      acknowledge('ready');
    } else if (command === 'mute' || command === 'unmute') {
      if (media) media.muted = command === 'mute';
      acknowledge('ready');
    } else if (command === 'play') {
      if (!media) { acknowledge('ready'); return; }
      media.play().catch((err) => {
        acknowledge('error', err?.message || 'Ο browser απέρριψε την αναπαραγωγή.');
      });
    }
  }, [cue?.commandId, cue?.active, cue?.playbackCommand, cue?.volume, acknowledge]);

  if (!cue?.active) return null;
  const isMedia = cue.kind === 'video' || cue.kind === 'audio';
  const mediaProps = {
    src: cue.source,
    autoPlay: false,
    playsInline: true,
    preload: 'auto',
    onCanPlay: () => acknowledge('ready'),
    onPlaying: () => acknowledge('playing'),
    onEnded: () => acknowledge('ended'),
    onError: () => acknowledge('error', 'Η TV δεν μπόρεσε να φορτώσει ή να αναπαράγει το αρχείο.'),
  };

  return (
    <section className="fixed inset-0 z-[120] flex items-center justify-center bg-black text-white" aria-label="Κεντρική έξοδος παραγωγής TV">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {cue.kind === 'video' && <video key={cue.id + cue.source} ref={videoRef} {...mediaProps} controls className="max-h-full max-w-full object-contain" />}
        {cue.kind === 'audio' && <div className="w-full max-w-xl space-y-6 text-center"><div className="text-6xl">♫</div><h2 className="text-2xl font-bold">{cue.label}</h2><audio key={cue.id + cue.commandId} ref={audioRef} {...mediaProps} controls className="w-full" /></div>}
        {cue.kind === 'image' && <img src={cue.source} alt={cue.label || 'Production media'} className="max-h-full max-w-full object-contain" />}
        {!isMedia && cue.kind !== 'image' && <div className="max-w-5xl text-center space-y-4"><p className="text-sm tracking-[0.3em] text-white/60">DEAL OF TEMPTATIONS · LIVE</p><h1 className="text-5xl md:text-7xl font-bold">{cue.label}</h1>{cue.winnerName && <p className="text-3xl">{cue.winnerName}</p>}{cue.winnerNotes && <p className="text-xl text-white/75">{cue.winnerNotes}</p>}</div>}
      </div>
      <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-2 text-xs">{error || cue.playbackStatus || 'LIVE OUTPUT'}</div>
      <button type="button" onClick={() => acknowledge('closed')} className="absolute right-4 top-4 rounded-lg border border-white/40 bg-black/75 px-4 py-2 text-sm font-bold">ΚΛΕΙΣΙΜΟ</button>
    </section>
  );
}
