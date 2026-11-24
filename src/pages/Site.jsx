import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { HOME_FAQ } from '@/components/site/SiteHomeProgram';
import {
  SiteTopBar, SiteHeroV2, Marquee, ExperiencesRail, HowItWorks, ThreeScreens, TrailerSection,
  GallerySection, SafetySection, FaqSection, FinalCta, StorySection, FlowSection, InfoSection,
  MobileBookBar, SiteFooter, SITE_MODE_IDS,
} from '@/components/site/SiteV2';
import { getSiteContent, SITE_EVENTS } from '@/data/siteContent';
import { ART, PHOTO, MODE_COVERS, MODE_MEDIA } from '@/data/brandArt';

const HOME = {
  overline: 'The private reality game night · 18+',
  titleLines: ['DEAL OF', 'TEMPTATION'],
  tagline: 'Ιδιωτικές βραδιές παιχνιδιού σαν τηλεοπτικό reality: κάρτες, αποστολές, ανατροπές και μία νικήτρια. Μόνο για καλεσμένες.',
};

const MARQUEE = ['Κάρτες', 'Μυστικές αποστολές', 'Χειροπέδες', 'VIP Vault', 'Beach Queen', 'Ανάκριση', 'Κωδικός εξόδου', 'Golden Minute', 'Στέψη'];

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
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
  const modeId = SITE_MODE_IDS[ev];
  const heroSrc = isHome
    ? PHOTO.siteHero || ART.heist5 || ART.group
    : (MODE_MEDIA[modeId]?.hero || MODE_MEDIA[modeId]?.cover || MODE_COVERS[`modeCover_${modeId}`] || (ev === 'heist' ? ART.heistNight : ART.poster));

  useEffect(() => {
    base44.entities.AppSetting.filter({ key: 'event_date' }, { limit: 1 })
      .then(({ items }) => { if (items?.[0]?.value) setGlobalDate(items[0].value); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const title = isHome ? 'Deal of Temptation — The private reality game night' : `${(c.titleLines || []).join(' ')} — Deal of Temptation`;
    document.title = title;
  }, [isHome, c.titleLines]);

  const openEvent = (id) => {
    setParams(id === 'home' ? {} : { event: id });
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  // Κράτηση: πάντα στη σωστή φόρμα του mode (ποτέ σε σελίδα που ζητά σύνδεση).
  const book = (id = ev) => navigate(getSiteContent(id).cta?.path || '/forms');
  const bookFromHome = () => scrollToId('experiences');

  if (isHome) {
    return (
      <div className="dot-site min-h-screen overflow-x-clip bg-black text-white">
        <SiteTopBar isHome onHome={() => openEvent('home')} onBook={bookFromHome} />
        <SiteHeroV2
          overline={HOME.overline}
          titleLines={HOME.titleLines}
          tagline={HOME.tagline}
          image={heroSrc}
          slot="siteHero"
          primary="Κλείσε θέση"
          onPrimary={bookFromHome}
          secondary="Πώς λειτουργεί"
          secondaryHref="#how"
          onSecondary={(e) => { e.preventDefault(); scrollToId('how'); }}
          facts={[{ value: '4', label: 'εμπειρίες' }, { value: '3', label: 'οθόνες' }, { value: '18+', label: 'μόνο ενήλικες' }, { value: '100%', label: 'ιδιωτικό' }]}
        />
        <Marquee words={MARQUEE} />
        <ExperiencesRail onOpen={openEvent} onBook={book} />
        <HowItWorks />
        <ThreeScreens />
        <TrailerSection title="Δες πώς είναι" />
        <GallerySection />
        <SafetySection />
        <FaqSection items={HOME_FAQ} />
        <FinalCta title={<>Η επόμενη βραδιά <span className="dot-gold-text">σε περιμένει</span></>} text="Διάλεξε εμπειρία, συμπλήρωσε τη φόρμα σε 3 λεπτά και περίμενε την πρόσκλησή σου." label="Διάλεξε εμπειρία" onClick={bookFromHome} />
        <SiteFooter onHome={() => openEvent('home')} />
        <MobileBookBar label="Κλείσε θέση" onClick={bookFromHome} />
      </div>
    );
  }

  // Τα κεφαλαία ελληνικά δεν έχουν τόνους: το προεπιλεγμένο «ΚΛΕΙΣΕ ΘΕΣΗ» γράφεται σωστά «Κλείσε θέση».
  const ctaLabel = !c.cta?.label || c.cta.label === 'ΚΛΕΙΣΕ ΘΕΣΗ' ? 'Κλείσε θέση' : c.cta.label;
  return (
    <div key={ev} className="dot-site min-h-screen overflow-x-clip bg-black text-white">
      <SiteTopBar onHome={() => openEvent('home')} onBook={() => book()} />
      <SiteHeroV2
        overline={c.overline}
        titleLines={c.titleLines}
        tagline={c.tagline}
        image={heroSrc}
        primary={ctaLabel}
        onPrimary={() => book()}
        secondary="Το παιχνίδι"
        secondaryHref="#story"
        onSecondary={(e) => { e.preventDefault(); scrollToId('story'); }}
        eventDate={eventDate}
      />
      <StorySection c={c} />
      <TrailerSection eventId={ev} title={c.videoTitle} kicker={c.videoKicker} />
      <FlowSection c={c} eventId={ev} />
      <InfoSection c={c} eventDate={eventDate} />
      <GallerySection eventId={ev} />
      <FaqSection items={c.faq} />
      <FinalCta title={<>Έτοιμη για το <span className="dot-gold-text">{(c.titleLines || []).join(' ')}</span>;</>} text={c.participation} label={ctaLabel} onClick={() => book()} />
      <section className="pb-8">
        <ExperiencesRail onOpen={openEvent} onBook={book} />
      </section>
      <SiteFooter onHome={() => openEvent('home')} />
      <MobileBookBar label={ctaLabel} onClick={() => book()} />
    </div>
  );
}
