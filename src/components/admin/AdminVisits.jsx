import React, { useCallback, useEffect, useState } from 'react';
import { request } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const Stat = ({ label, value, sub }) => (
  <div className="border-2 border-border/40 rounded-lg p-3 bg-secondary/40 text-center">
    <div className="font-heading text-3xl text-primary">{value ?? '—'}</div>
    <div className="text-[11px] font-bold tracking-wide">{label}</div>
    {sub && <div className="text-[10px] text-foreground/50">{sub}</div>}
  </div>
);

export default function AdminVisits() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try { setS(await request('GET', '/api/visits/stats?path=all')); setErr(null); }
    catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const max = Math.max(1, ...(s?.days || []).map((d) => d.views));

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="font-heading text-xl text-primary">📈 Επισκέψεις στην ιστοσελίδα</div>
          <div className="text-xs text-foreground/70">Όλες οι δημόσιες σελίδες: Site (κάθε εμπειρία), φόρμες, VIP πρόσκληση, promo. 1 επίσκεψη ανά επισκέπτρια και σελίδα κάθε 30 λεπτά. <b>Δεν μετράνε</b> οι συσκευές όπου είσαι συνδεδεμένη στο Admin· για δοκιμή άνοιξε το site σε ιδιωτικό παράθυρο.</div>
        </div>
        <ComicButton variant="dark" size="sm" onClick={load}>🔄 Ανανέωση</ComicButton>
      </ComicPanel>

      {err && <div className="text-sm font-bold text-red-400">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="ΣΥΝΟΛΟ ΕΠΙΣΚΕΨΕΩΝ" value={s?.views} />
        <Stat label="Μοναδικοί επισκέπτες" value={s?.visitors} />
        <Stat label="Σήμερα" value={s?.today} />
        <Stat label="Τελευταίες 7 μέρες" value={s?.week} />
        <Stat label="Τελευταίες 30 μέρες" value={s?.month} />
        <Stat label="Μοναδικοί (30 μέρες)" value={s?.visitors_month} />
      </div>

      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">Τελευταίες 30 μέρες</div>
        <div className="flex items-end gap-[3px] h-32">
          {(s?.days || []).map((d) => (
            <div key={d.day} className="flex-1 flex flex-col justify-end h-full" title={`${d.day}: ${d.views}`}>
              <div className="bg-primary rounded-t-sm" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 3 : 1, opacity: d.views ? 1 : 0.25 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-foreground/50">
          <span>{s?.days?.[0]?.day}</span><span>{s?.days?.[s.days.length - 1]?.day}</span>
        </div>
      </ComicPanel>

      {!!s?.pages?.length && (
        <ComicPanel className="bg-card space-y-2">
          <div className="font-heading text-lg">Ανάλυση ανά σελίδα / event</div>
          {s.pages.map((page) => (
            <div key={page.path} className="flex items-center justify-between gap-3 text-sm border-b border-border/20 py-1">
              <span className="break-all">{page.path}</span>
              <span className="shrink-0 text-right"><b>{page.views}</b> επισκέψεις · {page.visitors} επισκέπτες</span>
            </div>
          ))}
        </ComicPanel>
      )}

      {!!s?.refs?.length && (
        <ComicPanel className="bg-card space-y-1">
          <div className="font-heading text-lg">Από πού έρχονται</div>
          {s.refs.map((r) => (
            <div key={r.ref} className="flex justify-between text-sm"><span>{r.ref}</span><b>{r.views}</b></div>
          ))}
        </ComicPanel>
      )}
    </div>
  );
}
