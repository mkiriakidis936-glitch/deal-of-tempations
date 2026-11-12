import React from 'react';

export default function SiteScenario({ c }) {
  const paragraphs = (c.scenario || []).filter(Boolean);
  const highlights = (c.highlights || []).filter(Boolean);
  if (!paragraphs.length && !highlights.length) return null;
  return (
    <section id="scenario" className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">{c.scenarioKicker}</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">{c.scenarioTitle}</h2>
      </div>
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-base sm:text-lg text-foreground/75 leading-relaxed">{p}</p>
        ))}
      </div>
      {highlights.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {highlights.map((h, i) => (
            <div key={i} className="comic-panel-sm p-3 text-center text-[11px] sm:text-xs tracking-[0.18em] uppercase text-tarot-gold/80 flex items-center justify-center min-h-[64px]">
              {h}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
