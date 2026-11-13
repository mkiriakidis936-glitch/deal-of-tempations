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
  overline: 'PRIVATE GAME EXPERIENCES · 18+',
  titleLines: ['DEAL OF', 'TEMPTATION'],
  tagline: 'Ανακάλυψε τα δύο αρχικά events και τα διαθέσιμα ψηφιακά Game Modes.',
  cta: { label: 'ΕΠΙΛΟΓΗ EXPERIENCE', path: '/site#modes' },
};

function HomeProgram() {
  return (
    <section id="program" className="px-4 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-tarot-gold/20 bg-[#111] p-6 sm:p-8">
          <div className="text-[10px] tracking-[0.4em] text-tarot-gold/65 uppercase mb-3">Program</div>
          <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold">ΠΡΟΓΡΑΜΜΑ & ΣΤΑΔΙΑ</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">Κάθε event και Mode διαθέτει ξεχωριστό πρόγραμμα. Άνοιξε την αντίστοιχη παρουσίαση για να δεις τα στάδια και τη ροή του.</p>
          <a href="#modes" className="inline-flex mt-5 text-xs font-bold tracking-[0.18em] text-tarot-gold uppercase">Επιλογή Mode ↗</a>
        </div>
        <div id="faq" className="rounded-2xl border border-tarot-gold/20 bg-[#111] p-6 sm:p-8">
          <div className="text-[10px] tracking-[0.4em] text-tarot-gold/65 uppercase mb-3">FAQ</div>
          <h2 className="font-display text-2xl sm:text-3xl text-tarot-gold">ΣΥΧΝΕΣ ΕΡΩΤΗΣΕΙΣ</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">Οι ερωτήσεις και οι απαντήσεις διαφέρουν ανά εμπειρία. Επίλεξε event ή Mode για να δεις τις αντίστοιχες πληροφορίες και τους κανόνες.</p>
          <a href="#modes" className="inline-flex mt-5 text-xs font-bold tracking-[0.18em] text-tarot-gold uppercase">Δες τις εμπειρίες ↗</a>
        </div>
      </div>
    </section>
  );
}

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
  const register = () => navigate(c.cta.path);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteNav ev={isHome ? '' : ev} onEvent={setEvent} c={pageContent} isHome={isHome} />
      {isHome ? (
        <>
          <SiteHero c={homeContent} ev="home" eventDate="" heroSrc={PHOTO.siteHero} />
          <SiteAbout />
          <SiteModes onSelect={setEvent} />
          <SiteVideo c={{ videoTitle: 'VIDEO & TRAILERS' }} />
          <SiteGallery initialTab="all" />
          <HomeProgram />
          <SiteRegistration c={c} onRegister={register} />
          <SiteContact c={c} onRegister={register} />
        </>
      ) : (
        <div key={ev}>
          <SiteHero c={c} ev={ev} eventDate={eventDate} heroSrc={heroSrc} />
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
        <div className="mt-2 text-[9px] tracking-[0.3em] text-foreground/35 uppercase">18+ · Private Game Experiences</div>
      </footer>
    </div>
  );
}
