import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SiteNav from '@/components/site/SiteNav';
import SiteHero from '@/components/site/SiteHero';
import SiteAbout from '@/components/site/SiteAbout';
import SiteModes from '@/components/site/SiteModes';
import SiteScenario from '@/components/site/SiteScenario';
import SiteVideo from '@/components/site/SiteVideo';
import SiteGallery from '@/components/site/SiteGallery';
import SiteSchedule from '@/components/site/SiteSchedule';
import SiteInfo from '@/components/site/SiteInfo';
import SiteFaq from '@/components/site/SiteFaq';
import SiteRegistration from '@/components/site/SiteRegistration';
import SiteContact from '@/components/site/SiteContact';
import { HomeProgram, HomeFaq } from '@/components/site/SiteHomeProgram';
import { getSiteContent, SITE_EVENTS } from '@/data/siteContent';
import { ART, PHOTO, MODE_COVERS, MODE_MEDIA } from '@/data/brandArt';
import { trackVisit } from '@/lib/track';

const MODE_IDS = {
  extended: 'pedi_extended',
  lockdown: 'lockdown',
  beachbar: 'beach_bar',
  marathon4h: 'marathon_4h',
};

const homeContent = {
  overline: 'ΙΔΙΩΤΙΚΕΣ ΕΜΠΕΙΡΙΕΣ ΠΑΙΧΝΙΔΙΟΥ · 18+',
  titleLines: ['DEAL OF', 'TEMPTATION'],
  tagline: 'Ανακάλυψε τα δύο αρχικά events και τα διαθέσιμα ψηφιακά Game Modes.',
  cta: { label: 'ΕΠΙΛΟΓΗ EXPERIENCE', path: '/site#modes' },
};

export default function Site() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const evParam = params.get('event');
  const isHome = !SITE_EVENTS.some((event) => event.id === evParam);
  const ev = isHome ? 'heist' : evParam;
  const c = getSiteContent(ev);
  const [globalDate, setGlobalDate] = useState('');
  const eventDate = c.date || globalDate;
  const pageContent = isHome ? { ...c, cta: homeContent.cta } : c;
  const modeId = MODE_IDS[ev];
  const heroSrc = modeId
    ? (MODE_MEDIA[modeId]?.hero || MODE_MEDIA[modeId]?.cover || MODE_COVERS[`modeCover_${modeId}`])
    : ev === 'pajama' ? ART.party1 : ev === 'heist' ? ART.heistNight : PHOTO.siteHero;

  useEffect(() => { trackVisit(isHome ? '/site' : `/site?event=${ev}`); }, [isHome, ev]);
  useEffect(() => {
    base44.entities.AppSetting.filter({ key: 'event_date' }, { limit: 1 })
      .then(({ items }) => { if (items?.[0]?.value) setGlobalDate(items[0].value); })
      .catch(() => {});
  }, []);

  const setEvent = (id) => {
    setParams(id === 'home' ? {} : { event: id }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const register = () => {
    if (isHome) {
      const modes = document.getElementById('modes');
      if (modes) {
        const top = modes.getBoundingClientRect().top + window.scrollY - 112;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      return;
    }
    navigate(c.cta.path);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteNav ev={isHome ? '' : ev} onEvent={setEvent} c={pageContent} isHome={isHome} onRegister={register} />
      {isHome ? (
        <>
          <SiteHero c={homeContent} ev="home" eventDate="" heroSrc={PHOTO.siteHero} onCta={register} />
          <SiteAbout />
          <SiteModes onSelect={setEvent} />
          <SiteVideo c={{ videoTitle: 'ΒΙΝΤΕΟ & ΤΡΕΙΛΕΡ' }} />
          <SiteGallery initialTab="all" />
          <HomeProgram onSelect={setEvent} />
          <HomeFaq />
          <SiteRegistration c={pageContent} onRegister={register} />
          <SiteContact c={pageContent} onRegister={register} isHome />
        </>
      ) : (
        <div key={ev}>
          <SiteHero c={c} ev={ev} eventDate={eventDate} heroSrc={heroSrc} onCta={register} />
          <SiteScenario c={c} />
          <SiteModes onSelect={setEvent} compact />
          <SiteVideo c={c} eventId={ev} />
          <SiteGallery initialTab={['heist', 'pajama'].includes(ev) ? ev : 'all'} eventId={ev} />
          <SiteSchedule c={c} />
          <SiteInfo c={c} eventDate={eventDate} />
          <SiteFaq c={c} />
          <SiteRegistration c={c} onRegister={register} />
          <SiteContact c={c} onRegister={register} />
        </div>
      )}
      <footer className="border-t border-tarot-gold/15 px-4 py-8 text-center">
        <a href="/site" onClick={(e) => { e.preventDefault(); setEvent('home'); }} className="font-display text-[11px] tracking-[0.3em] text-tarot-gold/65">DEAL OF TEMPTATION</a>
        <div className="mt-2 text-[9px] tracking-[0.3em] text-foreground/35 uppercase">18+ · Ιδιωτικές εμπειρίες παιχνιδιού</div>
      </footer>
    </div>
  );
}
