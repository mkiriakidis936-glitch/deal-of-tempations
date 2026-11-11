import React from 'react';
import { PAJAMA_ACTS, PAJAMA_TOTAL_MINUTES } from '@/data/pajamaProgram';

const ZONES = [
  { id: 'night', label: 'Νύχτα' },
  { id: 'morning', label: 'Πρωί' },
];

export default function SiteSchedule() {
  return (
    <section id="program" className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">Πρόγραμμα</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">ΕΠΤΑ ΠΡΑΞΕΙΣ</h2>
        <p className="text-foreground/50 mt-3 text-sm tracking-wide">
          Σύνολο περίπου {Math.round(PAJAMA_TOTAL_MINUTES / 60)} ώρες, με διαλείμματα.
        </p>
      </div>

      <div className="space-y-10">
        {ZONES.map((zone) => (
          <div key={zone.id}>
            <div className="text-[11px] tracking-[0.4em] text-tarot-gold/50 uppercase mb-4">{zone.label}</div>
            <div className="space-y-3">
              {PAJAMA_ACTS.filter((a) => a.zone === zone.id).map((act) => (
                <div key={act.id} className="comic-panel-sm p-4 sm:p-5 flex gap-4">
                  <div className="font-display text-tarot-gold text-lg w-8 shrink-0">{act.roman}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-tarot-gold tracking-[0.08em] text-base sm:text-lg">{act.title}</h3>
                      <span className="text-[11px] tracking-[0.2em] uppercase text-foreground/40">
                        {act.minutes}′{act.breakMinutes ? ` · +${act.breakMinutes}′ διάλειμμα` : ''}
                      </span>
                    </div>
                    <div className="text-sm text-foreground/55 italic mt-1">{act.subtitle}</div>
                    <ul className="mt-2 space-y-1">
                      {act.brief.map((line, i) => (
                        <li key={i} className="text-sm text-foreground/70 flex gap-2">
                          <span className="text-tarot-gold/50">·</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}