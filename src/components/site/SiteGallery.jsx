import React, { useState } from 'react';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { HEIST_PHOTOS, PAJAMA_PHOTOS, MODE_MEDIA } from '@/data/brandArt';

const MODE_IDS = { extended: 'pedi_extended', lockdown: 'lockdown', beachbar: 'beach_bar', marathon4h: 'marathon_4h' };
const TABS = [
  { id: 'all', label: 'Όλες', photos: [...HEIST_PHOTOS, ...PAJAMA_PHOTOS] },
  { id: 'heist', label: 'Heist', photos: HEIST_PHOTOS },
  { id: 'pajama', label: 'Pajama', photos: PAJAMA_PHOTOS },
];

export default function SiteGallery({ initialTab = 'all', eventId }) {
  const modeId = MODE_IDS[eventId];
  const modePhotos = modeId ? (MODE_MEDIA[modeId]?.gallery || []) : [];
  const [tab, setTab] = useState(initialTab);
  const photos = modeId ? modePhotos : (TABS.find((t) => t.id === tab) || TABS[0]).photos;
  if (modeId && !modePhotos.length) return null;

  return (
    <section id="photos" className="px-4 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-[10px] sm:text-xs tracking-[0.42em] text-tarot-gold/65 uppercase mb-3">Photo & Video Galleries</div>
          <h2 className="font-display text-3xl sm:text-4xl text-tarot-gold tracking-[0.08em]">Η ΑΤΜΟΣΦΑΙΡΑ</h2>
        </div>
        {!modeId && <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'min-h-10 px-5 py-2 text-[10px] tracking-[0.22em] uppercase rounded-full border transition-colors',
              tab === t.id ? 'border-tarot-gold text-tarot-gold bg-tarot-gold/10' : 'border-foreground/20 text-foreground/50 hover:text-tarot-gold hover:border-tarot-gold/50'
            )}>{t.label}</button>
          ))}
        </div>}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {photos.map((src, index) => (
            <div key={`${src}-${index}`} className="relative overflow-hidden rounded-xl border border-tarot-gold/20 aspect-[4/5] bg-[#111] group">
              <Image src={src} fittingType="fill" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/45 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}