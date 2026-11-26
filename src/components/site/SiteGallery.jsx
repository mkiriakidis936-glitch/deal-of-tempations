import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { HEIST_PHOTOS, MODE_MEDIA } from '@/data/brandArt';

import { MEDIA_MODES } from '@/data/modes/modeRegistry';

const MODE_IDS = { lockdown: 'lockdown', marathon4h: 'marathon_4h', heist: 'arrest_heist', villa: 'villa_takeover', classic: 'classic' };
const galleryOf = (modeId) => (MODE_MEDIA[modeId]?.gallery || []).filter(Boolean);

// Καρτέλες: «Όλες» + μία ανά mode που έχει φωτογραφίες (υπολογίζεται κάθε φορά, ώστε να φαίνονται αμέσως οι αλλαγές του Admin).
function buildTabs() {
  const modeTabs = MEDIA_MODES.map((mode) => ({ id: mode.id, label: mode.name, photos: galleryOf(mode.id) })).filter((tab) => tab.photos.length);
  const all = [...new Set([...HEIST_PHOTOS.filter(Boolean), ...modeTabs.flatMap((tab) => tab.photos)])];
  return [{ id: 'all', label: 'Όλες', photos: all }, ...modeTabs];
}

export default function SiteGallery({ initialTab = 'all', eventId }) {
  const modeId = MODE_IDS[eventId];
  const TABS = buildTabs();
  const modePhotos = modeId ? (galleryOf(modeId).length || modeId !== 'arrest_heist' ? galleryOf(modeId) : HEIST_PHOTOS.filter(Boolean)) : [];
  const [tab, setTab] = useState(initialTab);
  const photos = modeId ? modePhotos : (TABS.find((t) => t.id === tab) || TABS[0]).photos;
  if (modeId && !modePhotos.length) return null;
  if (!photos.length) return null;

  return (
    <section id="photos" className="px-4 py-20 sm:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div className="text-[10px] sm:text-xs tracking-[0.42em] text-tarot-gold/65 uppercase mb-3">Φωτογραφίες & Βίντεο</div>
          <h2 className="font-display text-3xl sm:text-4xl text-tarot-gold tracking-[0.08em]">Η ΑΤΜΟΣΦΑΙΡΑ</h2>
        </div>
        {!modeId && TABS.length > 1 && <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'min-h-10 px-5 py-2 text-[10px] tracking-[0.22em] uppercase rounded-full border transition-colors',
              tab === t.id ? 'border-tarot-gold text-tarot-gold bg-tarot-gold/10' : 'border-foreground/20 text-foreground/50 hover:text-tarot-gold hover:border-tarot-gold/50'
            )}>{t.label}</button>
          ))}
        </div>}
        <div className="columns-2 md:columns-3 xl:columns-4 gap-3 sm:gap-4">
          {photos.map((src, index) => (
            <div key={`${src}-${index}`} className="mb-3 sm:mb-4 break-inside-avoid overflow-hidden rounded-xl border border-tarot-gold/20 bg-[#111]">
              <img src={src} alt="" loading="lazy" decoding="async" className="block h-auto w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}