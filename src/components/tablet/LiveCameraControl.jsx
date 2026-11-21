import React, { useEffect, useRef, useState } from 'react';
import { DockItem, Card, Button, ButtonRow, Badge } from '@/design/ui';
import { openCameraStream, startCameraSender } from '@/lib/liveCamera';

// Tablet: στέλνει ζωντανά την κάμερα της συσκευής στην TV (μόνο εικόνα, τίποτα δεν καταγράφεται).
export default function LiveCameraControl({ sessionCode, camera, updateState }) {
  const [open, setOpen] = useState(false);
  const [facing, setFacing] = useState('environment');
  const [layout, setLayout] = useState(camera?.layout || 'pip');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewers, setViewers] = useState(0);
  const sender = useRef(null);
  const preview = useRef(null);
  const live = !!sender.current && !!camera?.live;

  useEffect(() => () => { sender.current?.stop(); sender.current = null; }, []);
  useEffect(() => {
    // Αν η TV έχει «ενεργή κάμερα» από παλιότερη συνεδρία του tablet, την καθαρίζουμε.
    if (camera?.live && !sender.current) updateState({ camera: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setBusy(true);
    setError('');
    try {
      const stream = await openCameraStream(facing);
      if (preview.current) preview.current.srcObject = stream;
      sender.current = await startCameraSender({ sessionCode, stream, onViewers: setViewers });
      await updateState({ camera: { live: true, camId: sender.current.camId, layout, at: Date.now() } });
    } catch (e) {
      setError(e?.name === 'NotAllowedError' ? 'Δεν δόθηκε άδεια για την κάμερα. Επίτρεψέ την από τις ρυθμίσεις του browser.' : (e?.message || 'Η κάμερα δεν ξεκίνησε.'));
      await sender.current?.stop();
      sender.current = null;
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    await sender.current?.stop();
    sender.current = null;
    if (preview.current) preview.current.srcObject = null;
    setViewers(0);
    await updateState({ camera: null });
    setBusy(false);
  }

  async function changeLayout(next) {
    setLayout(next);
    if (camera?.live) await updateState({ camera: { ...camera, layout: next } });
  }

  return (
    <>
      <DockItem order={3} fallbackClassName="fixed bottom-48 left-3 z-[65]">
        <button type="button" className={`ui-btn ${live ? 'ui-btn--danger' : ''}`} onClick={() => setOpen(true)}>
          {live ? `● Κάμερα (${viewers})` : '📷 Κάμερα'}
        </button>
      </DockItem>
      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-3 sm:items-center" style={{ display: open ? 'flex' : 'none' }} onClick={() => setOpen(false)}>
        <Card className="w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <div className="ui-title" style={{ fontSize: 22 }}>📷 Κάμερα στην TV</div>
            {live ? <Badge tone="red">● LIVE · {viewers} οθόνες</Badge> : <Badge>Ανενεργή</Badge>}
          </div>
          <video ref={preview} muted playsInline autoPlay className="aspect-video w-full rounded-xl bg-black object-cover" />
          <p className="ui-subtitle" style={{ fontSize: 13 }}>
            Η εικόνα πηγαίνει απευθείας στην TV μέσα από το WiFi του σπιτιού. Δεν περνά από τον server και δεν καταγράφεται.
            Μόνο εικόνα, χωρίς ήχο. Το ΣΤΟΠ κρύβει αμέσως την κάμερα από την TV.
          </p>
          {!live && (
            <ButtonRow>
              <Button variant={facing === 'environment' ? 'primary' : undefined} onClick={() => setFacing('environment')}>Πίσω κάμερα</Button>
              <Button variant={facing === 'user' ? 'primary' : undefined} onClick={() => setFacing('user')}>Μπροστινή</Button>
            </ButtonRow>
          )}
          <ButtonRow>
            <Button variant={layout === 'pip' ? 'primary' : undefined} onClick={() => changeLayout('pip')}>Γωνία</Button>
            <Button variant={layout === 'full' ? 'primary' : undefined} onClick={() => changeLayout('full')}>Πλήρης οθόνη</Button>
          </ButtonRow>
          {error && <div className="text-[14px] font-semibold" style={{ color: 'var(--ui-red)' }}>{error}</div>}
          {live
            ? <Button variant="danger" block disabled={busy} onClick={stop}>⏹ Τέλος κάμερας</Button>
            : <Button variant="primary" block disabled={busy} onClick={start}>{busy ? 'Σύνδεση…' : '● Έναρξη κάμερας'}</Button>}
          <Button variant="ghost" block onClick={() => setOpen(false)}>Κλείσιμο</Button>
        </Card>
      </div>
    </>
  );
}
