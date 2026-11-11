import React from 'react';
import { ART, FILM } from '@/data/brandArt';

export default function SiteVideo() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <div className="mb-6 text-center">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">Το τρέιλερ</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">30 ΔΕΥΤΕΡΟΛΕΠΤΑ ΑΠΟ ΤΗ ΝΥΧΤΑ</h2>
      </div>
      <div className="relative rounded-lg overflow-hidden border-2 border-tarot-gold/40 shadow-[0_0_50px_rgba(201,162,39,0.15)]">
        <video
          src={FILM.agent}
          poster={ART.poster}
          controls
          playsInline
          preload="metadata"
          className="w-full aspect-video bg-black"
        />
      </div>
    </section>
  );
}