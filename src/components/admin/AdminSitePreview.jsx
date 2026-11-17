import React from 'react';
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
      <SiteHero c={c} ev="heist" eventDate={c.date || ''} heroSrc={PHOTO.siteHero} onCta={() => {}} />
      <div className="hidden">
      <div className="relative px-5 py-14 text-center bg-gradient-to-b from-[#332719] via-[#15110d] to-[#090909]">
        <div className="text-[10px] tracking-[0.35em] text-[#c7a76b] uppercase">{c.overline}</div>
        <h1 className="font-display text-3xl sm:text-5xl text-[#d7b777] tracking-widest leading-tight my-5">
          {(c.titleLines || []).map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}
        </h1>
        <div className="w-20 h-px bg-[#c7a76b]/50 mx-auto" />
        <p className="text-sm sm:text-base text-white/75 max-w-xl mx-auto mt-5">{c.tagline}</p>
        <div className="mt-6 inline-block border border-[#c7a76b]/50 px-5 py-2 text-[10px] tracking-widest text-[#d7b777]">{c.cta?.label}</div>
      </div>
      </div>
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
