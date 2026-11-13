import React from 'react';
import { SITE_EVENTS, getSiteContent } from '@/data/siteContent';
import { ART, MODE_COVERS, MODE_MEDIA } from '@/data/brandArt';

const MODE_IDS = {
  extended: 'pedi_extended',
  lockdown: 'lockdown',
  beachbar: 'beach_bar',
  marathon4h: 'marathon_4h',
};

const imageFor = (id) => {
  const modeId = MODE_IDS[id];
  if (modeId) return MODE_MEDIA[modeId]?.hero || MODE_MEDIA[modeId]?.cover || MODE_COVERS[`modeCover_${modeId}`] || '';
  return id === 'pajama' ? ART.party1 : ART.heistNight;
};

export default function SiteModes({ onSelect, compact = false }) {
  return (
    <section id="modes" className="relative px-4 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-14">
          <div className="text-[10px] sm:text-xs tracking-[0.42em] text-tarot-gold/65 uppercase mb-3">Choose your experience</div>
          <h2 className="font-display text-3xl sm:text-4xl text-tarot-gold tracking-[0.08em]">GAME MODES</h2>
          <p className="mt-4 text-sm sm:text-base text-foreground/60 leading-relaxed">Διάλεξε ένα από τα δύο αρχικά events ή ανακάλυψε τα διαθέσιμα ψηφιακά Modes.</p>
        </div>
        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 ${compact ? 'max-w-5xl mx-auto' : ''}`}>
          {SITE_EVENTS.map((event, index) => {
            const c = getSiteContent(event.id);
            const src = imageFor(event.id);
            return (
              <a
                key={event.id}
                href={`/site?event=${event.id}#top`}
                onClick={(e) => { if (onSelect) { e.preventDefault(); onSelect(event.id); } }}
                className="group relative min-h-[340px] overflow-hidden rounded-2xl border border-tarot-gold/20 bg-[#111] text-left shadow-[0_18px_50px_rgba(0,0,0,.25)] transition-all duration-300 hover:-translate-y-1 hover:border-tarot-gold/55"
              >
                {src && <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/65 to-[#090909]/5" />
                <div className="relative flex min-h-[340px] flex-col justify-end p-5 sm:p-6">
                  <div className="text-[10px] tracking-[0.3em] text-tarot-gold/70 uppercase">Experience 0{index + 1}</div>
                  <h3 className="mt-2 font-display text-xl sm:text-2xl tracking-[0.06em] text-white">{c.titleLines.join(' ')}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70 line-clamp-3">{c.tagline}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-tarot-gold uppercase">Discover mode <span aria-hidden="true">↗</span></span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
