import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GAME_MODES } from '@/data/gameConfig';

const THEMES = {
  classic: { accent: '#d8b66a', glow: 'rgba(216,182,106,.16)', label: 'CLASSIC EXPERIENCE' },
  marathon: { accent: '#e2bd63', glow: 'rgba(226,189,99,.18)', label: 'MEGA MARATHON' },
  arrest_heist: { accent: '#ff5964', glow: 'rgba(255,89,100,.16)', label: 'ARREST & HEIST' },
  pajama: { accent: '#d5a5ff', glow: 'rgba(213,165,255,.16)', label: 'PAJAMA PEDI-GLAM' },
  lockdown: { accent: '#ff496b', glow: 'rgba(255,73,107,.16)', label: 'PAJAMA LOCKDOWN 18+' },
  beach_bar: { accent: '#58d9e8', glow: 'rgba(88,217,232,.16)', label: 'BEACH BAR HOME LOCKDOWN' },
};

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('el-GR', { dateStyle: 'full', timeStyle: 'short' });
}

export default function VIPEventPage() {
  const [params] = useSearchParams();
  const eventCode = (params.get('event') || '').trim().toUpperCase();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState(eventCode ? 'loading' : 'missing');

  useEffect(() => {
    let active = true;
    setEvent(null);
    if (!eventCode) {
      setStatus('missing');
      return () => { active = false; };
    }
    setStatus('loading');
    fetch(`/api/public/vip/${encodeURIComponent(eventCode)}`, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Η εκδήλωση δεν βρέθηκε.');
        return data;
      })
      .then((data) => {
        if (active) {
          setEvent(data.event);
          setStatus('ready');
        }
      })
      .catch(() => { if (active) setStatus('not-found'); });
    return () => { active = false; };
  }, [eventCode]);

  const mode = useMemo(
    () => GAME_MODES.find((item) => item.id === event?.mode),
    [event?.mode]
  );
  const theme = THEMES[event?.mode] || THEMES.classic;
  const title = event?.title || mode?.name || theme.label;
  const details = [
    event?.scheduledAt ? { icon: '◷', label: 'ΗΜΕΡΟΜΗΝΙΑ & ΩΡΑ', value: formatDate(event.scheduledAt) } : null,
    event?.venue ? { icon: '⌖', label: 'ΤΟΠΟΘΕΣΙΑ', value: event.venue } : null,
  ].filter(Boolean);

  return (
    <main className="min-h-[100dvh] px-4 py-8 sm:py-14 text-[#f4eddf]" style={{ background: `radial-gradient(ellipse at 50% 0%, ${theme.glow} 0%, #101014 42%, #070709 100%)` }}>
      <div className="mx-auto w-full max-w-xl">
        <header className="rounded-3xl border px-6 py-9 text-center shadow-2xl sm:px-10" style={{ borderColor: `${theme.accent}88`, background: 'rgba(10,10,13,.88)', boxShadow: `0 20px 80px ${theme.glow}` }}>
          <div className="text-[10px] font-bold tracking-[.42em]" style={{ color: theme.accent }}>PRIVATE EVENT EXPERIENCE</div>
          <div className="my-5 text-3xl font-black tracking-[.12em] sm:text-4xl" style={{ color: theme.accent }}>VIP</div>
          <div className="mx-auto mb-5 h-px max-w-40" style={{ background: `linear-gradient(90deg,transparent,${theme.accent},transparent)` }} />
          {status === 'ready' && <>
            <div className="text-xs font-bold tracking-[.2em]" style={{ color: theme.accent }}>{theme.label}</div>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{title}</h1>
            {mode?.desc && <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/65">{mode.desc}</p>}
          </>}
        </header>

        {status === 'loading' && <section className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-8 text-center text-sm text-white/65">Φόρτωση προσωπικής σελίδας Event…</section>}
        {status === 'missing' && <section className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-8 text-center"><h1 className="text-xl font-bold">ΠΡΟΣΩΠΙΚΟΣ ΣΥΝΔΕΣΜΟΣ VIP</h1><p className="mt-3 text-sm leading-6 text-white/65">Η σελίδα VIP ανοίγει μόνο από τον μοναδικό σύνδεσμο ή το QR Code της συγκεκριμένης εκδήλωσης.</p></section>}
        {status === 'not-found' && <section className="mt-5 rounded-2xl border border-red-400/30 bg-black/50 p-8 text-center"><h1 className="text-xl font-bold">Η ΕΚΔΗΛΩΣΗ ΔΕΝ ΒΡΕΘΗΚΕ</h1><p className="mt-3 text-sm text-white/65">Ο σύνδεσμος VIP δεν είναι έγκυρος ή η εκδήλωση δεν είναι πλέον διαθέσιμη.</p></section>}
        {status === 'ready' && <section className="mt-5 space-y-3">
          {details.length > 0 ? details.map((item) => <article key={item.label} className="rounded-2xl border bg-black/55 p-5 sm:p-6" style={{ borderColor: `${theme.accent}55` }}>
            <div className="text-xs font-bold tracking-[.18em]" style={{ color: theme.accent }}>{item.icon} {item.label}</div>
            <div className="mt-2 whitespace-pre-wrap text-base leading-7">{item.value}</div>
          </article>) : <article className="rounded-2xl border border-white/10 bg-black/50 p-6 text-center text-sm text-white/65">Οι πληροφορίες της εκδήλωσης θα ανακοινωθούν σύντομα.</article>}
          {event?.eventNotes && <article className="rounded-2xl border bg-black/55 p-5 sm:p-6" style={{ borderColor: `${theme.accent}55` }}>
            <div className="text-xs font-bold tracking-[.18em]" style={{ color: theme.accent }}>ΠΛΗΡΟΦΟΡΙΕΣ ΓΙΑ ΤΗΝ ΕΜΠΕΙΡΙΑ</div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{event.eventNotes}</p>
          </article>}
          <footer className="pt-5 text-center text-[10px] tracking-[.28em] text-white/35">PRIVATE EVENT · DEAL OF TEMPTATION</footer>
        </section>}
      </div>
    </main>
  );
}
