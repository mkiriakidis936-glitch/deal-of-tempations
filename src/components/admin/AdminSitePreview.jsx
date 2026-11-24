import React from 'react';
import {
  SiteHeroV2, Marquee, StorySection, FlowSection, InfoSection, FaqSection, FinalCta, SITE_MODE_IDS,
} from '@/components/site/SiteV2';
import { ART, PHOTO, MODE_COVERS, MODE_MEDIA } from '@/data/brandArt';
import { SITE_HOME_ID } from '@/data/siteContent';

// Ζωντανή προεπισκόπηση με τα ΙΔΙΑ sections του νέου /site (μη αποθηκευμένες αλλαγές).
export default function AdminSitePreview({ content, eventId = SITE_HOME_ID }) {
  const c = content || {};
  const isHome = eventId === SITE_HOME_ID;
  const modeId = SITE_MODE_IDS[eventId];
  const heroSrc = isHome
    ? PHOTO.siteHero || ART.heist5 || ART.group
    : MODE_MEDIA[modeId]?.hero || MODE_MEDIA[modeId]?.cover || MODE_COVERS[`modeCover_${modeId}`] || ART.poster;
  const cta = c.cta?.label === 'ΚΛΕΙΣΕ ΘΕΣΗ' ? 'Κλείσε θέση' : (c.cta?.label || 'Κλείσε θέση');
  return (
    <section className="overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
      <div className="flex items-center justify-between bg-[#1C1C1E] px-4 py-2.5 text-[12px] font-medium text-white/60">
        <span>Προεπισκόπηση · μη αποθηκευμένες αλλαγές</span>
        <span className="rounded-full bg-[#2C2C2E] px-2 py-0.5">/site{isHome ? '' : `?event=${eventId}`}</span>
      </div>
      <div className="dot-site pointer-events-none max-h-[70vh] overflow-y-auto bg-black text-white [&_*]:pointer-events-none" aria-hidden="true">
        <SiteHeroV2 overline={c.overline} titleLines={c.titleLines || []} tagline={c.tagline} image={heroSrc} primary={cta} onPrimary={() => {}} secondary={isHome ? 'Πώς λειτουργεί' : 'Το παιχνίδι'} onSecondary={() => {}} eventDate={isHome ? '' : c.date} />
        {isHome ? (
          <>
            <Marquee words={(c.marquee || []).filter(Boolean)} />
            <FaqSection items={c.faq} />
            <FinalCta title={c.finalTitle} text={c.finalText} label={c.finalLabel} onClick={() => {}} />
          </>
        ) : (
          <>
            <StorySection c={c} />
            <FlowSection c={c} eventId={eventId} />
            <InfoSection c={c} eventDate={c.date || ''} />
            <FaqSection items={c.faq} />
          </>
        )}
      </div>
    </section>
  );
}
