import React, { useCallback, useEffect, useState } from 'react';
import { request } from '@/api/base44Client';
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
          <div className="font-heading text-xl text-primary">📈 ΕΠΙΣΚΕΨΕΙΣ ΣΤΗΝ ΙΣΤΟΣΕΛΙΔΑ</div>
          <div className="text-xs text-foreground/70">Συγκεντρώνει όλες τις δημόσιες σελίδες και τα event pages. Μετράει 1 επίσκεψη ανά άτομο και σελίδα ανά 30 λεπτά.</div>
        </div>
        <ComicButton variant="dark" size="sm" onClick={load}>🔄 Ανανέωση</ComicButton>
      </ComicPanel>

      {err && <div className="text-sm font-bold text-red-400">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="ΣΥΝΟΛΟ ΕΠΙΣΚΕΨΕΩΝ ΙΣΤΟΣΕΛΙΔΑΣ" value={s?.views} />
        <Stat label="ΜΟΝΑΔΙΚΟΙ ΕΠΙΣΚΕΠΤΕΣ" value={s?.visitors} />
        <Stat label="ΣΗΜΕΡΑ" value={s?.today} />
        <Stat label="ΤΕΛΕΥΤΑΙΕΣ 7 ΜΕΡΕΣ" value={s?.week} />
        <Stat label="ΤΕΛΕΥΤΑΙΕΣ 30 ΜΕΡΕΣ" value={s?.month} />
        <Stat label="ΜΟΝΑΔΙΚΟΙ (30 ΜΕΡΕΣ)" value={s?.visitors_month} />
      </div>

      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">ΤΕΛΕΥΤΑΙΕΣ 30 ΜΕΡΕΣ</div>
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
          <div className="font-heading text-lg">ΑΝΑΛΥΣΗ ΑΝΑ ΣΕΛΙΔΑ / EVENT</div>
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
          <div className="font-heading text-lg">ΑΠΟ ΠΟΥ ΕΡΧΟΝΤΑΙ</div>
          {s.refs.map((r) => (
            <div key={r.ref} className="flex justify-between text-sm"><span>{r.ref}</span><b>{r.views}</b></div>
          ))}
        </ComicPanel>
      )}
    </div>
  );
}
