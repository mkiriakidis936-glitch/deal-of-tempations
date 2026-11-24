import React, { useEffect, useState } from 'react';
import { request } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';

export default function AdminVipCode() {
  const [status, setStatus] = useState(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const load = () => request('GET', '/api/entities/vip-access/code').then(setStatus).catch(() => setStatus(null));
  useEffect(() => { load(); }, []);
  async function save() {
    setMessage('');
    try {
      await request('POST', '/api/entities/vip-access/code', { code });
      setCode('');
      setMessage('Ο κωδικός VIP αποθηκεύτηκε. Οι παλιές VIP συνδέσεις έκλεισαν.');
      load();
    } catch (error) { setMessage(error.message || 'Δεν αποθηκεύτηκε.'); }
  }
  return (
    <ComicPanel className="bg-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-heading text-xl text-primary">Κωδικός VIP</div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${status?.configured ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{status?.configured ? 'Ενεργός' : 'Δεν έχει οριστεί'}</span>
      </div>
      {status?.fromEnvironment
        ? <p className="text-xs text-foreground/60">Ο κωδικός ορίζεται από τη μεταβλητή VIP_ACCESS_CODE του server.</p>
        : (
          <div className="flex gap-2">
            <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Νέος κωδικός VIP" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button type="button" className="adm-pill" disabled={code.trim().length < 4} onClick={save}>Αποθήκευση</button>
          </div>
        )}
      {message && <div className="text-xs">{message}</div>}
    </ComicPanel>
  );
}
