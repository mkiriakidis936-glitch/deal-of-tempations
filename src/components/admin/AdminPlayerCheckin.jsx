import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import QRScanner from '@/components/play/QRScanner';
import { base44 } from '@/api/base44Client';

const makeToken = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

export default function AdminPlayerCheckin({ session }) {
  const [record, setRecord] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [message, setMessage] = useState('');
  const players = session?.state?.players || [];
  const sessionCode = session?.sessionCode;
  const load = useCallback(async () => {
    if (!sessionCode) return;
    const { items } = await base44.entities.PlayerCheckin.filter({ sessionCode }, { limit: 1 });
    let rec = items?.[0] || null;
    const current = rec || {};
    const next = { ...current, players: { ...(current.players || {}) } };
    let changed = false;
    players.forEach((player) => {
      const playerId = player.id;
      if (!next.players[playerId]) {
        next.players[playerId] = { token: makeToken(), checkedInAt: null };
        changed = true;
      }
    });
    if (changed || !rec) {
      if (rec?.id) rec = await base44.entities.PlayerCheckin.update(rec.id, { players: next.players });
      else rec = await base44.entities.PlayerCheckin.create({ sessionCode, players: next.players });
    }
    setRecord(rec);
  }, [sessionCode, players]);

  useEffect(() => { setRecord(null); setMessage(''); load().catch((e) => setMessage(e.message)); }, [load]);

  const checkIn = async (raw) => {
    const parts = String(raw || '').split('|');
    if (parts.length !== 4 || parts[0] !== 'DOT-CHECKIN' || parts[1] !== sessionCode) {
      setMessage('Το QR δεν αντιστοιχεί στην επιλεγμένη συνεδρία.');
      return;
    }
    const [, , playerId, token] = parts;
    const current = record || {};
    const entry = current.players?.[playerId];
    if (!entry || entry.token !== token) {
      setMessage('Μη έγκυρο ή άγνωστο QR παίκτη.');
      return;
    }
    if (entry.checkedInAt) {
      setMessage('Ο παίκτης έχει ήδη καταχωριστεί ως παρών.');
      return;
    }
    const value = { ...current, players: { ...current.players, [playerId]: { ...entry, checkedInAt: new Date().toISOString() } } };
    const updated = await base44.entities.PlayerCheckin.update(record.id, { players: value.players });
    setRecord(updated);
    setMessage(`Παρουσία καταχωρίστηκε: ${players.find((p) => p.id === playerId)?.name || playerId}`);
  };

  if (!session) return <ComicPanel className="bg-card">Επίλεξε συνεδρία για να διαχειριστείς το check-in.</ComicPanel>;
  const checked = Object.values(record?.players || {}).filter((p) => p.checkedInAt).length;
  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card">
        <div className="font-heading text-xl text-primary">QR PLAYER CHECK-IN</div>
        <div className="text-xs mt-1">{sessionCode} · {checked}/{players.length} παρόντες</div>
        <div className="mt-3"><ComicButton variant="cyan" disabled={!record} onClick={() => setScanOpen((v) => !v)}>{scanOpen ? 'ΚΛΕΙΣΙΜΟ SCANNER' : 'ΣΑΡΩΣΗ QR ΠΑΙΚΤΗ'}</ComicButton></div>
        {scanOpen && <div className="mt-3"><QRScanner label="ΣΑΡΩΣΕ ΤΟ ΠΡΟΣΩΠΙΚΟ QR ΤΟΥ ΠΑΙΚΤΗ" onScan={(value) => { checkIn(value).catch((e) => setMessage(e.message)); setScanOpen(false); }} /></div>}
        {message && <div className="text-xs font-bold mt-3">{message}</div>}
      </ComicPanel>
      {players.map((player) => {
        const entry = record?.players?.[player.id];
        const value = entry ? `DOT-CHECKIN|${sessionCode}|${player.id}|${entry.token}` : '';
        return <ComicPanel key={player.id} className="bg-card">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div><div className="font-heading text-lg">{player.name}</div><div className="text-xs">{entry?.checkedInAt ? `ΠΑΡΩΝ · ${new Date(entry.checkedInAt).toLocaleString('el-GR')}` : 'ΕΚΚΡΕΜΕΙ CHECK-IN'}</div></div>
            {value && <div className="bg-white p-2 rounded"><QRCodeSVG value={value} size={104} /></div>}
          </div>
        </ComicPanel>;
      })}
    </div>
  );
}
