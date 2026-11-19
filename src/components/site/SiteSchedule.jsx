import React from 'react';

export default function SiteSchedule({ c }) {
  const items = c.program || [];
  return (
    <section id="program" className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">{c.programKicker}</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">{c.programTitle}</h2>
        {c.programNote && <p className="text-foreground/50 mt-3 text-sm tracking-wide">{c.programNote}</p>}
      </div>

      <div className="space-y-3">
        {items.map((act, i) => (
          <React.Fragment key={i}>
            {act.group && act.group !== items[i - 1]?.group && (
              <div className="text-[11px] tracking-[0.4em] text-tarot-gold/50 uppercase pt-4">{act.group}</div>
            )}
            <div className="comic-panel-sm p-4 sm:p-5 flex gap-4">
              {act.roman && <div className="font-display text-tarot-gold text-lg w-8 shrink-0">{act.roman}</div>}
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-display text-tarot-gold tracking-[0.08em] text-base sm:text-lg">{act.title}</h3>
                  {act.meta && <span className="text-[11px] tracking-[0.2em] uppercase text-foreground/40">{act.meta}</span>}
                </div>
                {act.subtitle && <div className="text-sm text-foreground/55 italic mt-1">{act.subtitle}</div>}
                <ul className="mt-2 space-y-1">
                  {(act.lines || []).map((line, k) => (
                    <li key={k} className="text-sm text-foreground/70 flex gap-2">
                      <span className="text-tarot-gold/50">·</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
