import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { request } from '@/api/apiClient';
import { modeDisplayName } from '@/data/gameConfig';
import { ART } from '@/data/brandArt';

// /memories/:token — η σελίδα αναμνήσεων μιας βραδιάς (ιδιωτικό link, χωρίς σύνδεση).
export default function Memories() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(-1);

  useEffect(() => {
    request('GET', `/api/entities/memories/${encodeURIComponent(token || '')}`).then(setData).catch((e) => setError(e.message || 'Η σελίδα δεν βρέθηκε.'));
    document.title = 'Η βραδιά μας — Deal of Temptation';
  }, [token]);

  if (error) return <div className="flex min-h-screen items-center justify-center bg-black p-6 text-center text-white/70">{error}</div>;
  if (!data) return <div className="flex min-h-screen items-center justify-center bg-black text-white/50">Φόρτωση…</div>;
  const date = data.eventDate ? new Date(data.eventDate).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return (
    <div className="min-h-screen bg-black px-4 pb-16 pt-10 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center">
          {ART.emblem && <img src={ART.emblem} alt="" className="mx-auto h-16 w-16 rounded-2xl" />}
          <div className="mt-4 text-[13px] font-semibold uppercase tracking-[0.25em] text-[#E8C26B]">Deal of Temptation · {modeDisplayName(data.mode)}</div>
          <h1 className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight">Η βραδιά μας</h1>
          {date && <div className="mt-1 text-white/60">{date}</div>}
        </header>
        {data.winner && (
          <section className="rounded-3xl bg-[#1C1C1E] p-6 text-center">
            <div className="text-5xl">👑</div>
            <div className="mt-2 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">Νικήτρια</div>
            <div className="mt-1 text-3xl font-bold text-[#F7E3A8]">{data.winner}</div>
          </section>
        )}
        {data.message && <section className="rounded-3xl bg-[#1C1C1E] p-5 text-[17px] leading-relaxed text-white/85">{data.message}</section>}
        {data.playerNames.length > 0 && (
          <section className="rounded-3xl bg-[#1C1C1E] p-5">
            <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.15em] text-white/55">Στο τραπέζι</div>
            <div className="flex flex-wrap gap-2">{data.playerNames.map((name) => <span key={name} className="rounded-full bg-[#2C2C2E] px-3 py-1.5 text-[15px]">{name}</span>)}</div>
          </section>
        )}
        {data.highlights.length > 0 && (
          <section className="rounded-3xl bg-[#1C1C1E] p-5">
            <div className="mb-2 text-[13px] font-semibold uppercase tracking-[0.15em] text-white/55">Στιγμές</div>
            <ul className="space-y-1.5 text-white/85">{data.highlights.map((h) => <li key={h}>✦ {h}</li>)}</ul>
          </section>
        )}
        {data.photos.length > 0 && (
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.photos.map((src, i) => (
              <button key={src} type="button" onClick={() => setOpen(i)} className="aspect-square overflow-hidden rounded-2xl bg-[#1C1C1E]">
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </section>
        )}
        <footer className="text-center">
          <a href="/site" className="inline-flex h-12 items-center rounded-full bg-[#E8C26B] px-6 font-bold text-black">Η επόμενη βραδιά →</a>
          <p className="mt-3 text-xs text-white/40">Ιδιωτική σελίδα — μοιράσου τη μόνο με όσες ήταν εκεί.</p>
        </footer>
      </div>
      {open >= 0 && (
        <div role="dialog" aria-label="Φωτογραφία" onClick={() => setOpen(-1)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <img src={data.photos[open]} alt="" className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}
