import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SITE_EVENTS, getSiteContent } from '@/data/siteContent';

const LINKS = [
  { href: '#scenario', label: 'Το παιχνίδι' },
  { href: '#photos', label: 'Φωτογραφίες' },
  { href: '#program', label: 'Πρόγραμμα' },
  { href: '#info', label: 'Πληροφορίες' },
  { href: '#faq', label: 'Ερωτήσεις' },
];

export default function SiteNav({ ev, onEvent, c, isHome = false }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-tarot-gold/25 bg-background/85 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <a href="#top" className="font-display text-tarot-gold tracking-[0.22em] text-[11px] sm:text-sm">
          DEAL OF TEMPTATION
        </a>
        <nav className="hidden md:flex items-center gap-6 text-[11px] tracking-[0.28em] uppercase text-foreground/60">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-tarot-gold transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <button
          onClick={() => navigate(c.cta.path)}
          className="comic-boom px-4 py-2 text-[11px] tracking-[0.22em] text-tarot-gold"
        >
          ΚΡΑΤΗΣΗ
        </button>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {SITE_EVENTS.map((e) => (
          <button
            key={e.id}
            onClick={() => onEvent(e.id)}
            className={cn(
              'min-h-[38px] shrink-0 px-3 sm:px-4 text-[9px] sm:text-[10px] tracking-[0.14em] uppercase rounded-full border transition-colors',
              ev === e.id
                ? 'border-tarot-gold text-tarot-gold bg-tarot-gold/10'
                : 'border-foreground/20 text-foreground/50 hover:text-tarot-gold hover:border-tarot-gold/50'
            )}
          >
            {getSiteContent(e.id).tab}
          </button>
        ))}
      </div>
    </header>
  );
}
