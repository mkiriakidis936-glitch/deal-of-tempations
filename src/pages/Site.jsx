import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SiteNav from '@/components/site/SiteNav';
import SiteHero from '@/components/site/SiteHero';
import SiteScenario from '@/components/site/SiteScenario';
import SiteVideo from '@/components/site/SiteVideo';
import SiteGallery from '@/components/site/SiteGallery';
import SiteSchedule from '@/components/site/SiteSchedule';
import SiteInfo from '@/components/site/SiteInfo';
import SiteFaq from '@/components/site/SiteFaq';
import { getSiteContent, SITE_EVENTS } from '@/data/siteContent';
import { trackVisit } from '@/lib/track';

export default function Site() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const evParam = params.get('event');
  const ev = SITE_EVENTS.some((e) => e.id === evParam) ? evParam : 'heist';
  const c = getSiteContent(ev);
  const [globalDate, setGlobalDate] = useState('');
  const eventDate = c.date || globalDate;

  useEffect(() => { trackVisit('/site'); }, []);
  useEffect(() => {
    base44.entities.AppSetting.filter({ key: 'event_date' }, { limit: 1 })
      .then(({ items }) => { if (items?.[0]?.value) setGlobalDate(items[0].value); })
      .catch(() => {});
  }, []);

  const setEvent = (id) => { setParams(id === 'heist' ? {} : { event: id }, { replace: true }); window.scrollTo({ top: 0 }); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav ev={ev} onEvent={setEvent} c={c} />
      <div key={ev}>
        <SiteHero c={c} ev={ev} eventDate={eventDate} />
        <SiteScenario c={c} />
        <SiteVideo c={c} />
        <SiteGallery initialTab={['heist', 'pajama'].includes(ev) ? ev : 'all'} />
        <div className="h-px max-w-4xl mx-auto bg-tarot-gold/20" />
        <SiteSchedule c={c} />
        <div className="h-px max-w-4xl mx-auto bg-tarot-gold/20" />
        <SiteInfo c={c} eventDate={eventDate} />
        <div className="h-px max-w-4xl mx-auto bg-tarot-gold/20" />
        <SiteFaq c={c} />

        <section className="px-4 py-20 text-center border-t border-tarot-gold/20">
          <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold tracking-[0.1em] mb-6">
            ΟΙ ΘΕΣΕΙΣ ΕΙΝΑΙ ΛΙΓΕΣ
          </h2>
          <button className="cinv-btn max-w-sm w-full mx-auto" style={{ animation: 'none' }} onClick={() => navigate(c.cta.path)}>
            {c.cta.label}
          </button>
          <div className="mt-10 text-[11px] tracking-[0.4em] text-tarot-gold/40 uppercase">
            Deal of Temptation · 18+ · Κλειστή λίστα
          </div>
        </section>
      </div>
    </div>
  );
}
