import React from 'react';
import { CalendarDays, MapPin, Shirt, Footprints, Info } from 'lucide-react';

const ICONS = [CalendarDays, MapPin, Shirt, Footprints, Info, Info];

export default function SiteInfo({ c, eventDate }) {
  const dateLabel = eventDate
    ? new Date(eventDate).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Ανακοινώνεται σύντομα';
  const items = (c.info || []).map((it) => ({ ...it, text: String(it.text || '').replace('{date}', dateLabel) }));

  return (
    <section id="info" className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">Πληροφορίες</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">ΤΑ ΠΡΑΚΤΙΚΑ</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map(({ title, text }, i) => {
          const Icon = ICONS[Math.min(i, ICONS.length - 1)];
          return (
            <div key={i} className="comic-panel-sm p-5 flex gap-4">
              <Icon className="w-5 h-5 text-tarot-gold shrink-0 mt-1" />
              <div className="min-w-0">
                <div className="text-[11px] tracking-[0.3em] uppercase text-tarot-gold/70 mb-1">{title}</div>
                <div className="text-foreground/75">{text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {c.participation && (
        <div className="comic-panel-sm p-5 mt-4 text-center">
          <div className="text-[11px] tracking-[0.3em] uppercase text-tarot-gold/70 mb-2">Συμμετοχή</div>
          <p className="text-foreground/70">{c.participation}</p>
        </div>
      )}
    </section>
  );
}
