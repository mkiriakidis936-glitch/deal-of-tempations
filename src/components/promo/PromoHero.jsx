import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FILM } from '@/data/brandArt';
import VideoFilm from '@/components/shared/VideoFilm';

export default function PromoHero({ content }) {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <VideoFilm src={FILM.agent} poster={content.heroImage} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 65% at 50% 40%, rgba(255,215,0,.10), rgba(10,10,10,.75) 60%, #0a0a0a 90%), linear-gradient(180deg, rgba(10,10,10,.85), rgba(26,10,10,.55) 45%, #0a0a0a 100%)',
          }}
        />
        {[12, 26, 38, 52, 64, 78, 88].map((left, i) => (
          <span
            key={left}
            className="promo-mote absolute bottom-0"
            style={{
              left: `${left}%`,
              width: i % 2 ? 4 : 2.5,
              height: i % 2 ? 4 : 2.5,
              background: '#ffd700',
              boxShadow: '0 0 12px rgba(255,215,0,.9)',
              animationDelay: `${i * 1.4}s`,
              animationDuration: `${9 + i}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-5 text-center pt-28 pb-24 flex flex-col items-center gap-5">
        <div className="text-[11px] sm:text-xs tracking-[0.42em] font-bold" style={{ color: '#c9a227' }}>
          {content.overline}
        </div>

        <h1
          className="promo-glow"
          style={{
            fontSize: 'clamp(2.1rem, 8vw, 4rem)',
            lineHeight: 1.02,
            letterSpacing: '.04em',
            color: '#ffd700',
            textShadow: '0 2px 0 #000, 0 0 40px rgba(139,0,0,.85)',
            fontWeight: 700,
          }}
        >
          {content.title}
        </h1>

        {content.titleSub && (
          <div
            className="font-bold"
            style={{ fontSize: 'clamp(.9rem,2.6vw,1.15rem)', letterSpacing: '.38em', color: '#e8d9b0', marginTop: -8 }}
          >
            {content.titleSub}
          </div>
        )}

        <div className="text-lg sm:text-2xl" style={{ color: '#e8d9b0', lineHeight: 1.45 }}>
          {content.subtitleTop}
          <br />
          {content.subtitle} <span style={{ color: '#ffd700' }}>{content.subtitleAccent}</span>.
        </div>

        <div className="text-sm sm:text-base italic max-w-md" style={{ color: 'rgba(241,230,200,.6)', lineHeight: 1.6 }}>
          {content.tagline[0]}
          <br />
          {content.tagline[1]}
        </div>

        <button type="button" className="cinv-btn w-full max-w-sm mt-3" onClick={() => navigate(content.ctaPath)}>
          {content.ctaLabel}
        </button>

        <div className="text-xs tracking-wide" style={{ color: 'rgba(241,230,200,.4)' }}>
          {content.ctaNote}
        </div>
      </div>
    </section>
  );
}