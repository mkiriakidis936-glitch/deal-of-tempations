import React, { useEffect, useState } from 'react';
import { appApi } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';

const FIELDS = [
  ['event_date', 'ΗΜΕΡΟΜΗΝΙΑ & ΩΡΑ', '📅'],
  ['event_location', 'ΤΟΠΟΘΕΣΙΑ', '📍'],
  ['event_arrival', 'ΟΔΗΓΙΕΣ ΑΦΙΞΗΣ', '🚶'],
  ['event_notes', 'ΠΡΑΚΤΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ', '📝'],
];

function dateLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('el-GR', { dateStyle: 'full', timeStyle: 'short' });
}

export default function EventPortal() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all(FIELDS.map(([key]) => appApi.entities.AppSetting.filter({ key }, { limit: 1 })))
      .then((results) => {
        const next = {};
        FIELDS.forEach(([key], index) => {
          const value = results[index]?.items?.[0]?.value;
          if (value) next[key] = value;
        });
        setValues(next);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#090909] text-[#f1e6c8] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="text-center space-y-3">
          <div className="text-xs tracking-[0.35em] text-[#c7a76b]">ΠΛΗΡΟΦΟΡΙΕΣ ΙΔΙΩΤΙΚΗΣ ΕΚΔΗΛΩΣΗΣ</div>
          <h1 className="font-display text-3xl sm:text-5xl tracking-widest text-[#d7b777]">DEAL OF TEMPTATION</h1>
          <p className="text-sm text-white/65">Πληροφορίες εκδήλωσης</p>
        </header>
        {loading ? (
          <div className="py-12 text-center text-sm text-white/60">Φόρτωση πληροφοριών…</div>
        ) : error ? (
          <ComicPanel className="bg-card text-center"><p>Δεν ήταν δυνατή η φόρτωση των πληροφοριών. Δοκίμασε ξανά αργότερα.</p></ComicPanel>
        ) : FIELDS.filter(([key]) => values[key]).length === 0 ? (
          <ComicPanel className="bg-card text-center"><p>Δεν έχουν καταχωρηθεί ακόμη πληροφορίες για την εκδήλωση.</p></ComicPanel>
        ) : (
          <section className="space-y-3">
            {FIELDS.filter(([key]) => values[key]).map(([key, label, icon]) => (
              <ComicPanel key={key} className="bg-[#15120e] border border-[#8f7445]/50">
                <h2 className="font-heading text-sm tracking-wider text-[#d7b777]">{icon} {label}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                  {key === 'event_date' ? dateLabel(values[key]) : values[key]}
                </p>
              </ComicPanel>
            ))}
          </section>
        )}
        <footer className="pt-4 text-center text-[10px] tracking-[0.3em] text-white/35">18+ · ΙΔΙΩΤΙΚΕΣ ΕΜΠΕΙΡΙΕΣ ΠΑΙΧΝΙΔΙΟΥ</footer>
      </div>
    </main>
  );
}
