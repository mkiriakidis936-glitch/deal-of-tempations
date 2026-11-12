import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteNav from '@/components/site/SiteNav';
import SiteHero from '@/components/site/SiteHero';
import SiteVideo from '@/components/site/SiteVideo';
import SiteGallery from '@/components/site/SiteGallery';
import SiteSchedule from '@/components/site/SiteSchedule';
import SiteInfo from '@/components/site/SiteInfo';
import SiteFaq from '@/components/site/SiteFaq';
import { trackVisit } from '@/lib/track';

export default function Site() {
  const navigate = useNavigate();
  useEffect(() => { trackVisit('/site'); }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <SiteHero />
      <SiteVideo />
      <SiteGallery />
      <div className="h-px max-w-4xl mx-auto bg-tarot-gold/20" />
      <SiteSchedule />
      <div className="h-px max-w-4xl mx-auto bg-tarot-gold/20" />
      <SiteInfo />
      <div className="h-px max-w-4xl mx-auto bg-tarot-gold/20" />
      <SiteFaq />

      <section className="px-4 py-20 text-center border-t border-tarot-gold/20">
        <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em] mb-6">
          ΟΙ ΘΕΣΕΙΣ ΕΙΝΑΙ ΛΙΓΕΣ
        </h2>
        <button className="cinv-btn max-w-sm w-full mx-auto" style={{ animation: 'none' }} onClick={() => navigate('/pajama-form')}>
          ΚΛΕΙΣΕ ΘΕΣΗ
        </button>
        <div className="mt-10 text-[11px] tracking-[0.4em] text-tarot-gold/40 uppercase">
          Deal of Temptation · 18+ · Κλειστή λίστα
        </div>
      </section>
    </div>
  );
}