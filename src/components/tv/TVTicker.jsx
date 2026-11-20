import React from 'react';

export default function TVTicker({ items = [] }) {
  const content = items.length > 0 ? items : ['Αναμονή για γεγονότα...'];
  const allItems = [...content, ...content];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 overflow-hidden border-t border-primary/20 bg-surface-1/95 py-3 backdrop-blur">
      <div className="flex items-center gap-12 whitespace-nowrap tv-marquee">
        {allItems.map((text, i) => (
          <span key={i} className="flex shrink-0 items-center gap-3 font-body text-lg tracking-[0.02em] text-foreground/80">
            <span className="ds-label text-primary/70">●</span>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}