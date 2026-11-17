import React from 'react';
import SiteNav from '@/components/site/SiteNav';
import SiteHero from '@/components/site/SiteHero';
import SiteModes from '@/components/site/SiteModes';
import SiteVideo from '@/components/site/SiteVideo';
import SiteGallery from '@/components/site/SiteGallery';
import SiteRegistration from '@/components/site/SiteRegistration';
import SiteContact from '@/components/site/SiteContact';
import { PHOTO } from '@/data/brandArt';
import SiteScenario from '@/components/site/SiteScenario';
import SiteSchedule from '@/components/site/SiteSchedule';
import SiteInfo from '@/components/site/SiteInfo';
import SiteFaq from '@/components/site/SiteFaq';

export default function AdminSitePreview({ content }) {
  const c = content || {};
  return (
    <section className="rounded-xl border-2 border-primary/50 overflow-hidden bg-[#090909] text-white">
      <div className="bg-primary/15 border-b border-primary/30 px-4 py-3">
        <div className="text-xs font-bold tracking-widest text-primary">ΖΩΝΤΑΝΗ ΠΡΟΕΠΙΣΚΟΠΗΣΗ · ΜΗ ΑΠΟΘΗΚΕΥΜΕΝΕΣ ΑΛΛΑΓΕΣ</div>
        <div className="text-[10px] text-foreground/60 mt-1">Προεπισκόπηση των πραγματικών sections του δημόσιας ιστοσελίδας.</div>
      </div>
      <SiteNav ev="heist" onEvent={() => {}} isHome={false} onRegister={() => {}} />
      <SiteHero c={c} ev="heist" eventDate={c.date || ''} heroSrc={PHOTO.siteHero} onCta={() => {}} />
      <div className="text-white">
        <SiteScenario c={c} />
        <SiteModes onSelect={() => {}} compact />
        <SiteVideo c={c} eventId="heist" />
        <SiteGallery initialTab="heist" eventId="heist" />
        <SiteSchedule c={c} />
        <SiteInfo c={c} eventDate={c.date || ''} />
        <SiteFaq c={c} />
        <SiteRegistration c={c} onRegister={() => {}} />
        <SiteContact c={c} onRegister={() => {}} />
      </div>
    </section>
  );
}
