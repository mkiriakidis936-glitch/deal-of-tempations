import React from 'react';
import { useNavigate } from 'react-router-dom';

const LINKS = [
  { href: '#photos', label: 'Φωτογραφίες' },
  { href: '#program', label: 'Πρόγραμμα' },
  { href: '#info', label: 'Πληροφορίες' },
  { href: '#faq', label: 'Ερωτήσεις' },
];

export default function SiteNav() {
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
          onClick={() => navigate('/pajama-form')}
          className="comic-boom px-4 py-2 text-[11px] tracking-[0.22em] text-tarot-gold"
        >
          ΚΡΑΤΗΣΗ
        </button>
      </div>
    </header>
  );
}