import React from 'react';
import SiteNav from '@/components/site/SiteNav';
import SiteHero from '@/components/site/SiteHero';
import SiteModes from '@/components/site/SiteModes';
import SiteVideo from '@/components/site/SiteVideo';
import SiteGallery from '@/components/site/SiteGallery';
import SiteRegistration from '@/components/site/SiteRegistration';
import SiteContact from '@/components/site/SiteContact';
import { ART, PHOTO, MODE_COVERS, MODE_MEDIA } from '@/data/brandArt';
import SiteScenario from '@/components/site/SiteScenario';
import SiteSchedule from '@/components/site/SiteSchedule';
import SiteInfo from '@/components/site/SiteInfo';
import SiteFaq from '@/components/site/SiteFaq';

const MODE_IDS = { pedi_glam: 'pedi_glam', pedi_extended: 'pedi_extended', lockdown: 'lockdown', beachbar: 'beach_bar', marathon4h: 'marathon_4h' };

export default function AdminSitePreview({ content, eventId = 'heist' }) {
  const c = content || {};
  const modeId = MODE_IDS[eventId];
  const heroSrc = modeId ? (MODE_MEDIA[modeId]?.hero || MODE_MEDIA[modeId]?.cover || MODE_COVERS['modeCover_' + modeId]) : eventId === 'pajama' ? ART.party1 : eventId === 'heist' ? ART.heistNight : PHOTO.siteHero;
  return (
    <section className="rounded-xl border-2 border-primary/50 overflow-hidden bg-background text-foreground" style={ART.patternSeamless ? { backgroundImage: `url(\"${ART.patternSeamless}\")`, backgroundRepeat: 'repeat', backgroundSize: '420px auto' } : undefined}>
      <div className="bg-primary/15 border-b border-primary/30 px-4 py-3">
        <div className="text-xs font-bold tracking-widest text-primary">ΖΩΝΤΑΝΗ ΠΡΟΕΠΙΣΚΟΠΗΣΗ · ΜΗ ΑΠΟΘΗΚΕΥΜΕΝΕΣ ΑΛΛΑΓΕΣ</div>
        <div className="text-[10px] text-foreground/60 mt-1">Προεπισκόπηση των πραγματικών sections του δημόσιας ιστοσελίδας.</div>
      </div>
      <SiteNav ev={eventId} onEvent={() => {}} isHome={false} onRegister={() => {}} />
      <SiteHero c={c} ev={eventId} eventDate={c.date || ''} heroSrc={heroSrc} onCta={() => {}} />
      <div className="text-white">
        <SiteScenario c={c} />
        <SiteModes onSelect={() => {}} compact />
        <SiteVideo c={c} eventId={eventId} />
        <SiteGallery initialTab={['heist', 'pajama'].includes(eventId) ? eventId : 'all'} eventId={eventId} />
        <SiteSchedule c={c} />
        <SiteInfo c={c} eventDate={c.date || ''} />
        <SiteFaq c={c} />
        <SiteRegistration c={c} onRegister={() => {}} />
        <SiteContact c={c} onRegister={() => {}} />
      </div>
      <footer className="border-t border-tarot-gold/15 px-4 py-8 text-center">
        <span className="font-display text-[11px] tracking-[0.3em] text-tarot-gold/65">DEAL OF TEMPTATIONS</span>
        <div className="mt-2 text-[9px] tracking-[0.3em] text-foreground/35 uppercase">THE PRIVATE REALITY GAME NIGHT · 18+</div>
      </footer>
    </section>
  );
}
