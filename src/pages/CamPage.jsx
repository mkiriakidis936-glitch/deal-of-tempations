import React, { useEffect, useRef, useState } from 'react';
import { openCameraStream, startCameraSender } from '@/lib/liveCamera';

// /cam?code=XXXX&t=ΕΙΣΙΤΗΡΙΟ — ένα κινητό γίνεται κάμερα του Στούντιο (σκανάρει το QR από το Admin).
// Η εικόνα πηγαίνει απευθείας στην TV / στο Στούντιο μέσα στο WiFi· δεν περνά από τον server, δεν καταγράφεται, χωρίς ήχο.
export default function CamPage() {
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('code') || '').toUpperCase();
  const ticket = params.get('t') || '';
  const [label, setLabel] = useState(() => { try { return localStorage.getItem('dot_cam_label') || 'Κάμερα'; } catch { return 'Κάμερα'; } });
  const [facing, setFacing] = useState('environment');
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewers, setViewers] = useState(0);
  const sender = useRef(null);
  const preview = useRef(null);
  const wake = useRef(null);

  useEffect(() => () => { sender.current?.stop(); wake.current?.release?.(); }, []);

  async function start() {
    setBusy(true); setError('');
    try {
      try { localStorage.setItem('dot_cam_label', label); } catch { /* χωρίς storage */ }
      const stream = await openCameraStream(facing);
      if (preview.current) preview.current.srcObject = stream;
      sender.current = await startCameraSender({ sessionCode: code, stream, onViewers: setViewers, ticket, label });
      try { wake.current = await navigator.wakeLock?.request('screen'); } catch { /* η οθόνη μπορεί να σβήσει */ }
      setLive(true);
    } catch (e) {
      setError(e?.name === 'NotAllowedError' ? 'Δεν δόθηκε άδεια για την κάμερα. Επίτρεψέ την από τις ρυθμίσεις του browser.' : (e?.message || 'Η κάμερα δεν ξεκίνησε.'));
      await sender.current?.stop(); sender.current = null;
    } finally { setBusy(false); }
  }
  async function stop() {
    setBusy(true);
    await sender.current?.stop(); sender.current = null;
    if (preview.current) preview.current.srcObject = null;
    wake.current?.release?.(); wake.current = null;
    setLive(false); setViewers(0); setBusy(false);
  }

  if (!code || !ticket) {
    return <div className="ui-page ui-page--center"><div className="ui-stack text-center"><div className="ui-title">📷 Κάμερα Στούντιο</div><p className="ui-subtitle">Σκάναρε το QR «Πρόσθεσε κάμερα» από το Admin → Στούντιο.</p></div></div>;
  }
  return (
    <div className="ui-page">
      <div className="ui-stack">
        <div className="flex items-center justify-between">
          <div><div className="ui-eyebrow">Deal of Temptation · {code}</div><div className="ui-title" style={{ fontSize: 26 }}>📷 Κάμερα Στούντιο</div></div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${live ? 'bg-[#FF453A] text-white' : 'bg-white/10'}`}>{live ? `● LIVE · ${viewers}` : 'Ανενεργή'}</span>
        </div>
        <video ref={preview} muted playsInline autoPlay className="aspect-video w-full rounded-2xl bg-black object-cover" />
        {!live && (
          <>
            <label className="block text-sm font-semibold">Όνομα κάμερας
              <input className="ui-input mt-1" value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} placeholder="π.χ. Σαλόνι, Καρέκλα, Τραπέζι" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={`ui-btn ${facing === 'environment' ? 'ui-btn--primary' : ''}`} onClick={() => setFacing('environment')}>Πίσω κάμερα</button>
              <button type="button" className={`ui-btn ${facing === 'user' ? 'ui-btn--primary' : ''}`} onClick={() => setFacing('user')}>Μπροστινή</button>
            </div>
          </>
        )}
        {error && <div className="text-sm font-semibold text-[#FF6961]">{error}</div>}
        {live
          ? <button type="button" className="ui-btn ui-btn--danger ui-btn--block" disabled={busy} onClick={stop}>⏹ Τέλος κάμερας</button>
          : <button type="button" className="ui-btn ui-btn--primary ui-btn--block" disabled={busy} onClick={start}>{busy ? 'Σύνδεση…' : '● Έναρξη κάμερας'}</button>}
        <p className="ui-subtitle" style={{ fontSize: 13 }}>Άφησε το κινητό σταθερό και στην πρίζα. Η εικόνα πηγαίνει απευθείας στο Στούντιο και στην TV μέσα από το WiFi. Δεν περνά από τον server, δεν καταγράφεται, χωρίς ήχο. Στην TV βγαίνει μόνο όταν η διοργανώτρια πατήσει «TAKE».</p>
      </div>
    </div>
  );
}
