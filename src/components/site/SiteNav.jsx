import React from 'react';
import { cn } from '@/lib/utils';
import { SITE_EVENTS, getSiteContent } from '@/data/siteContent';

const HOME_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#modes', label: 'Game Modes' },
  { href: '#photos', label: 'Gallery' },
  { href: '#program', label: 'Program' },
  { href: '#faq', label: 'FAQ' },
  { href: '#registration', label: 'Registration' },
  { href: '#contact', label: 'Contact' },
];
const DETAIL_LINKS = [
  { href: '#scenario', label: 'Experience' },
  { href: '#modes', label: 'Game Modes' },
  { href: '#photos', label: 'Gallery' },
  { href: '#program', label: 'Program' },
  { href: '#info', label: 'Info' },
  { href: '#faq', label: 'FAQ' },
  { href: '#registration', label: 'Registration' },
  { href: '#contact', label: 'Contact' },
];

export default function SiteNav({ ev, onEvent, isHome = false, onRegister }) {
  return (
    <header className="sticky top-0 z-40 border-b border-tarot-gold/25 bg-background/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <a href="/site" onClick={(e) => { e.preventDefault(); onEvent('home'); }} className="font-display text-tarot-gold tracking-[0.2em] text-[10px] sm:text-sm shrink-0">
          DEAL OF TEMPTATION
        </a>
        <nav className="hidden xl:flex items-center gap-4 text-[10px] tracking-[0.16em] uppercase text-foreground/60">
          {(isHome ? HOME_LINKS : DETAIL_LINKS).map((l) => (
            <a key={l.href} href={l.href} className="hover:text-tarot-gold transition-colors">{l.label}</a>
          ))}
        </nav>
        <button type="button" onClick={onRegister} className="rounded-full border border-tarot-gold/60 px-4 py-2 text-[10px] font-bold tracking-[0.16em] text-tarot-gold transition hover:bg-tarot-gold hover:text-black">
          ΚΡΑΤΗΣΗ
        </button>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto whitespace-nowrap">
        <button type="button" onClick={() => onEvent('home')} className={cn('min-h-[36px] shrink-0 rounded-full border px-3 text-[9px] uppercase tracking-[0.14em] transition-colors', isHome ? 'border-tarot-gold text-tarot-gold bg-tarot-gold/10' : 'border-foreground/20 text-foreground/50')}>Home</button>
        {SITE_EVENTS.map((event) => (
          <button type="button" key={event.id} onClick={() => onEvent(event.id)} className={cn(
            'min-h-[36px] shrink-0 rounded-full border px-3 text-[9px] uppercase tracking-[0.14em] transition-colors',
            ev === event.id ? 'border-tarot-gold text-tarot-gold bg-tarot-gold/10' : 'border-foreground/20 text-foreground/50 hover:text-tarot-gold hover:border-tarot-gold/50'
          )}>{getSiteContent(event.id).tab}</button>
        ))}
      </div>
    </header>
  );
}
