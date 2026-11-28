import React, { useEffect, useState } from 'react';
import { request } from '@/api/apiClient';
import { nightSession } from '@/lib/readiness';

// 12.0 · Σύστημα → Υγεία server: όλα όσα πρέπει να είναι εντάξει πριν και κατά τη βραδιά, σε μία ματιά.
const MB = (b) => (b == null ? '—' : b >= 1073741824 ? `${(b / 1073741824).toFixed(1)}GB` : `${Math.round(b / 1048576)}MB`);
const ago = (sec) => { if (sec == null) return '—'; const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); return h ? `${h}ώ ${m}′` : `${m}′`; };

function Card({ title, tone = 'ok', children }) {
  const color = tone === 'bad' ? '#FF453A' : tone === 'warn' ? '#FF9F0A' : '#30D158';
  return (
    <section className="adm-card space-y-2" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} /><div className="adm-card-title">{title}</div></div>
      <div className="space-y-1 text-[14px]">{children}</div>
    </section>
  );
}
const Row = ({ k, v }) => <div className="flex justify-between gap-3"><span className="text-foreground/60">{k}</span><b className="text-right tabular-nums">{v}</b></div>;

export default function AdminHealth({ sessions = [] }) {
  const [h, setH] = useState(null);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(null);
  const [lights, setLights] = useState(null);
  const [tv, setTv] = useState(null);
  const night = nightSession(sessions);

  useEffect(() => {
    let alive = true;
    const load = () => {
      request('GET', '/api/admin/health').then((r) => { if (alive) { setH(r); setError(''); } }).catch((e) => { if (alive) setError(e.message || 'Ο server δεν απαντά.'); });
      request('GET', '/api/lights/status').then((r) => { if (alive) setLights(r); }).catch(() => { if (alive) setLights(null); });
      if (night?.sessionCode) {
        request('GET', `/api/entities/player-presence/${encodeURIComponent(night.sessionCode)}`)
          .then(({ players = [] }) => { if (alive) setOnline(players.length); }).catch(() => { if (alive) setOnline(null); });
        request('GET', `/api/entities/tv-presence/${encodeURIComponent(night.sessionCode)}`)
          .then((r) => { if (alive) setTv(r); }).catch(() => { if (alive) setTv(null); });
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [night?.sessionCode]);

  if (error && !h) return <Card title="Server" tone="bad"><p>{error}</p></Card>;
  if (!h) return <div className="adm-loading">Έλεγχος server…</div>;

  const freePct = h.disk?.total ? Math.round((h.disk.free / h.disk.total) * 100) : null;
  const diskTone = h.disk ? (h.disk.free < 300 * 1048576 ? 'bad' : h.disk.free < 1024 * 1048576 ? 'warn' : 'ok') : 'warn';
  const players = night?.state?.players || [];
  return (
    <div className="space-y-4">
      <p className="text-[14px] text-foreground/60">Ανανεώνεται κάθε 15″. Πράσινο = εντάξει · Πορτοκαλί = πρόσεξέ το · Κόκκινο = θέλει διόρθωση πριν τη βραδιά.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="🖥️ Server" tone={error ? 'warn' : 'ok'}>
          <Row k="Έκδοση" v={h.version} />
          <Row k="Σε λειτουργία" v={ago(h.uptimeSec)} />
          <Row k="Μνήμη" v={`${h.memoryMB}MB`} />
          <Row k="Node" v={h.node} />
          {error && <p className="text-[#FF9F0A]">Τελευταίος έλεγχος απέτυχε: {error}</p>}
        </Card>
        <Card title="🗄️ Βάση δεδομένων" tone={h.db?.ok ? (h.db.latencyMs > 800 ? 'warn' : 'ok') : 'bad'}>
          <Row k="Κατάσταση" v={h.db?.ok ? 'Συνδεδεμένη' : `Σφάλμα: ${h.db?.error || '—'}`} />
          {h.db?.ok && <Row k="Ταχύτητα απάντησης" v={`${h.db.latencyMs}ms`} />}
          {h.db?.ok && <Row k="Παρτίδες / αιτήσεις" v={`${h.db.records?.GameSession || 0} / ${(h.db.records?.PajamaIntake || 0) + (h.db.records?.PlayerIntake || 0)}`} />}
        </Card>
        <Card title="💾 Χώρος αποθήκευσης" tone={diskTone}>
          <Row k="Ελεύθερος" v={h.disk ? `${MB(h.disk.free)} από ${MB(h.disk.total)}${freePct != null ? ` (${freePct}%)` : ''}` : 'Άγνωστο'} />
          <Row k="Φωτογραφίες, βίντεο, ήχοι" v={h.uploads ? `${MB(h.uploads.size)} · ${h.uploads.files} αρχεία` : '—'} />
          <Row k="Αντίγραφα ασφαλείας" v={h.backups ? `${MB(h.backups.size)} · ${h.backups.files} αρχεία` : '—'} />
          {h.disk && <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full" style={{ width: `${100 - (freePct || 0)}%`, background: diskTone === 'bad' ? '#FF453A' : diskTone === 'warn' ? '#FF9F0A' : '#30D158' }} /></div>}
          {diskTone !== 'ok' && <p className="text-[13px] text-[#FF9F0A]">Λίγος χώρος: τα μεγάλα βίντεο μπορεί να μην ανεβαίνουν. Σβήσε παλιά αντίγραφα (Σύστημα → Αντίγραφα) ή μεγάλωσε το Volume στο Railway.</p>}
        </Card>
        <Card title="📱 Βραδιά & συνδέσεις" tone={!night ? 'warn' : (online != null && online < players.length) || tv?.online === false ? 'warn' : 'ok'}>
          <Row k="Ανοιχτή παρτίδα" v={night ? night.sessionCode : 'Καμία'} />
          {night && <Row k="TV" v={!tv ? '—' : !tv.online ? 'Κλειστή' : tv.sound ? 'Ανοιχτή · ήχος ✓' : 'Ανοιχτή · πάτα την οθόνη για ήχο'} />}
          {night && <Row k="Κινητά online" v={online == null ? '—' : `${online}/${players.length}`} />}
          <Row k="Φώτα SmartThings" v={!lights ? '—' : lights.auth?.type === 'none' ? 'Δεν έχουν συνδεθεί' : lights.auth?.expired ? 'Η σύνδεση έληξε' : `${lights.enabled ? 'Ενεργά' : 'Ανενεργά'} · ${lights.devices?.length || 0} φώτα${lights.lastError ? ' · σφάλμα' : ''}`} />
        </Card>
      </div>
    </div>
  );
}
