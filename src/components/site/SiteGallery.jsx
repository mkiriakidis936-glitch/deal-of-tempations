import React, { useState } from 'react';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { HEIST_PHOTOS, PAJAMA_PHOTOS } from '@/data/brandArt';

const TABS = [
  { id: 'all', label: 'Όλες', photos: [...HEIST_PHOTOS, ...PAJAMA_PHOTOS] },
  { id: 'heist', label: 'Heist', photos: HEIST_PHOTOS },
  { id: 'pajama', label: 'Pajama', photos: PAJAMA_PHOTOS },
];

export default function SiteGallery({ initialTab = 'all' }) {
  const [tab, setTab] = useState(initialTab);
  const photos = (TABS.find((t) => t.id === tab) || TABS[0]).photos;

  return (
    <section id="photos" className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-[11px] tracking-[0.45em] text-tarot-gold/60 uppercase mb-2">Gallery</div>
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em]">Η ΑΤΜΟΣΦΑΙΡΑ</h2>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-5 py-2 text-[11px] tracking-[0.25em] uppercase rounded-full border transition-colors',
              tab === t.id
                ? 'border-tarot-gold text-tarot-gold bg-tarot-gold/10'
                : 'border-foreground/20 text-foreground/50 hover:text-tarot-gold hover:border-tarot-gold/50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((src) => (
          <div
            key={src}
            className="relative overflow-hidden rounded-md border border-tarot-gold/25 aspect-[4/5] group"
          >
            <Image src={src} fittingType="fill" className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        ))}
      </div>
    </section>
  );
}