import React, { useEffect, useRef, useState } from 'react';
import MediaSpot from '@/components/shared/MediaSpot';
import { ART, PHOTO, FILM, MODE_COVERS, MODE_MEDIA, HEIST_PHOTOS, PAJAMA_PHOTOS, videosFor } from '@/data/brandArt';
import { SITE_EVENTS, getSiteContent } from '@/data/siteContent';
import { modeMeta, durationLabel } from '@/data/modes/modeRegistry';
import { MODE_GUIDE, SAFETY_RULES } from '@/data/modes/modeGuide';

// ------------------------------------------------------------------
// Το νέο /site: κινηματογραφική βιτρίνα. Όλα τα κείμενα έρχονται από
// Admin → Site & Σενάριο και όλα τα media από το MODE MEDIA CENTER.
// ------------------------------------------------------------------

const COUNT_WORDS = { 3: 'Τρεις', 4: 'Τέσσερις', 5: 'Πέντε', 6: 'Έξι', 7: 'Επτά', 8: 'Οκτώ' };
export const SITE_MODE_IDS = { movie: 'deal_movie', classic: 'classic', heist: 'arrest_heist', lockdown: 'lockdown', marathon4h: 'marathon_4h', villa: 'villa_takeover' };

const imageFor = (ev) => {
  const modeId = SITE_MODE_IDS[ev];
  const media = MODE_MEDIA[modeId] || {};
  return media.hero || media.cover || MODE_COVERS[`modeCover_${modeId}`] || (ev === 'heist' ? ART.heistNight : '') || ART.poster;
};

const factsFor = (ev) => {
  const meta = modeMeta(SITE_MODE_IDS[ev]);
  if (!meta) return ['2 ομάδες', '4–10 παίκτριες', '18+'];
  const hours = durationLabel(meta);
  return [hours, `${meta.min}–${meta.max} παίκτριες`, '18+'];
};

// Εμφάνιση με κίνηση όταν το στοιχείο μπαίνει στην οθόνη (σέβεται το «λιγότερη κίνηση»).
function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`dot-reveal ${shown ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</Tag>;
}

const Kicker = ({ children, className = '' }) => (
  <div className={`inline-flex items-center gap-2 rounded-full border border-[#E8C26B]/30 bg-[#E8C26B]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F7E3A8] ${className}`}>{children}</div>
);

const SectionTitle = ({ kicker, title, text, center = false }) => (
  <Reveal className={`mb-8 sm:mb-12 ${center ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl'}`}>
    {kicker && <Kicker>{kicker}</Kicker>}
    <h2 className="mt-4 font-display text-[clamp(2rem,6vw,4rem)] leading-[0.95] tracking-tight text-white">{title}</h2>
    {text && <p className="mt-4 text-base leading-relaxed text-white/65 sm:text-lg">{text}</p>}
  </Reveal>
);

function PrimaryButton({ children, onClick, href, className = '' }) {
  const cls = `group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-[#E8C26B] px-8 text-base font-bold text-black shadow-[0_10px_40px_-10px_rgba(232,194,107,0.7)] transition-transform active:scale-[0.97] ${className}`;
  const inner = <><span className="relative z-10">{children}</span><span className="relative z-10 transition-transform group-hover:translate-x-1">→</span><span className="dot-shine absolute inset-0" aria-hidden="true" /></>;
  return href ? <a href={href} onClick={onClick} className={cls}>{inner}</a> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

const GhostButton = ({ children, onClick, href }) => (
  <a href={href || '#'} onClick={onClick} className="inline-flex h-14 items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10">{children}</a>
);

// ------------------------------------------------------------------ Πλοήγηση
export function SiteTopBar({ isHome, onHome, onBook }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = isHome
    ? [['#experiences', 'Εμπειρίες'], ['#how', 'Πώς λειτουργεί'], ['#gallery', 'Γκαλερί'], ['#faq', 'Απορίες']]
    : [['#story', 'Το παιχνίδι'], ['#flow', 'Ροή'], ['#gallery', 'Γκαλερί'], ['#faq', 'Απορίες']];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-white/10 bg-black/70 backdrop-blur-xl' : 'bg-gradient-to-b from-black/70 to-transparent'}`} style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-20 sm:px-6" aria-label="Κύρια πλοήγηση">
        <a href="/site" onClick={(e) => { e.preventDefault(); onHome(); }} className="mr-auto flex items-center gap-2.5">
          <img src={ART.emblem} alt="" className="h-9 w-9 rounded-full ring-1 ring-[#E8C26B]/40" />
          <span className="font-display text-sm tracking-[0.25em] text-[#F7E3A8] sm:text-base">DEAL OF TEMPTATION</span>
        </a>
        <div className="hidden items-center gap-6 text-sm text-white/75 md:flex">
          {links.map(([href, label]) => <a key={href} href={href} className="transition-colors hover:text-white">{label}</a>)}
        </div>
        <button type="button" onClick={onBook} className="h-10 rounded-full bg-[#E8C26B] px-5 text-sm font-bold text-black active:scale-95">Κλείσε θέση</button>
      </nav>
    </header>
  );
}

// ------------------------------------------------------------------ Hero
export function SiteHeroV2({ overline, titleLines = [], tagline, image, slot, facts = [], primary, onPrimary, secondary, secondaryHref, onSecondary, eventDate }) {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden">
      <div className="absolute inset-0">
        <MediaSpot src={image} slot={slot} eager alt="" className="dot-kenburns h-full w-full object-cover" fallback={<div className="h-full w-full bg-[radial-gradient(ellipse_at_top,#3a2a10,#000_70%)]" />} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_100%,rgba(232,194,107,0.22),transparent_55%)]" />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-32 sm:px-6 sm:pb-20">
        <Reveal><Kicker>{overline}</Kicker></Reveal>
        <Reveal as="h1" delay={80} className="mt-5 font-display text-[clamp(3.2rem,13vw,9.5rem)] leading-[0.86] tracking-tight text-white">
          {titleLines.map((line, i) => <span key={line + i} className={`block ${i === titleLines.length - 1 ? 'dot-gold-text' : ''}`}>{line}</span>)}
        </Reveal>
        {tagline && <Reveal as="p" delay={160} className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">{tagline}</Reveal>}
        {eventDate && <Reveal delay={200} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">📅 {eventDate}</Reveal>}
        <Reveal delay={240} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <PrimaryButton onClick={onPrimary}>{primary}</PrimaryButton>
          {secondary && <GhostButton href={secondaryHref} onClick={onSecondary}>{secondary}</GhostButton>}
        </Reveal>
        {facts.length > 0 && (
          <Reveal delay={320} className="mt-10 grid grid-cols-4 gap-2 border-t border-white/10 pt-6 sm:flex sm:gap-x-10">
            {facts.map((fact) => <div key={fact.label || fact} className="text-xs text-white/60 sm:text-sm"><span className="block font-display text-xl text-white sm:text-2xl">{fact.value || fact}</span>{fact.label}</div>)}
          </Reveal>
        )}
      </div>
    </section>
  );
}

export function Marquee({ words }) {
  const row = [...words, ...words];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-[#0b0906] py-4" aria-hidden="true">
      <div className="dot-marquee flex w-max gap-10 whitespace-nowrap font-display text-xl tracking-wide text-white/70 sm:text-2xl">
        {row.map((word, i) => <span key={i} className="flex items-center gap-10">{word}<span className="text-[#E8C26B]">✦</span></span>)}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Εμπειρίες (αφίσες)
export function ExperiencesRail({ onOpen, onBook }) {
  return (
    <section id="experiences" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle kicker="Οι εμπειρίες" title={<>Διάλεξε τη <span className="dot-gold-text">βραδιά σου</span></>} text={`${COUNT_WORDS[SITE_EVENTS.length] || SITE_EVENTS.length} διαφορετικές εμπειρίες, μία ιδιωτική παρέα. Κάθε μία με δικό της σενάριο, ρυθμό και φινάλε.`} />
      </div>
      <div className="dot-rail flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:gap-6 sm:px-6 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-3 lg:overflow-visible">
        {SITE_EVENTS.map((event, index) => {
          const c = getSiteContent(event.id);
          const facts = factsFor(event.id);
          return (
            <Reveal key={event.id} delay={index * 90} className="w-[78vw] max-w-[340px] shrink-0 snap-center sm:w-[46vw] lg:w-auto lg:max-w-none">
              <article className="group relative flex aspect-[3/4.4] flex-col justify-end overflow-hidden rounded-[28px] bg-[#111] ring-1 ring-white/10 transition-transform duration-500 hover:-translate-y-1">
                <img src={imageFor(event.id)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="relative p-5">
                  <div className="font-display text-xs tracking-[0.3em] text-[#E8C26B]">0{index + 1}</div>
                  <h3 className="mt-1 font-display text-3xl leading-none text-white lg:text-[1.65rem] xl:text-3xl">{(c.titleLines || [c.tab]).join(' ')}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/70">{c.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{facts.map((f) => <span key={f} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">{f}</span>)}</div>
                  <div className="mt-4 grid gap-2">
                    <button type="button" onClick={() => onBook(event.id)} className="h-11 rounded-full bg-[#E8C26B] text-sm font-bold text-black active:scale-[0.97]">Κλείσε θέση</button>
                    <button type="button" onClick={() => onOpen(event.id)} className="h-11 rounded-full border border-white/25 bg-white/5 text-sm font-semibold text-white backdrop-blur active:scale-[0.97]">Δες την εμπειρία</button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Πώς λειτουργεί
export function HowItWorks() {
  const steps = [
    { n: '01', title: 'Διαλέγεις εμπειρία', text: 'Συμπληρώνεις τη φόρμα σε 3 λεπτά: όνομα, προτιμήσεις και τα δικά σου όρια.' },
    { n: '02', title: 'Παίρνεις έγκριση', text: 'Η διοργανώτρια εγκρίνει τη θέση σου και λαμβάνεις διεύθυνση και τελευταίες λεπτομέρειες.' },
    { n: '03', title: 'Ζεις τη βραδιά', text: 'Μπαίνεις με το κινητό σου. Η TV δείχνει τη δράση, το κινητό τις δικές σου μυστικές αποστολές.' },
  ];
  return (
    <section id="how" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle kicker="Πώς λειτουργεί" title={<>Τρία βήματα ως <span className="dot-gold-text">τη βραδιά</span></>} />
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 100} className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 sm:p-8">
              <div className="font-display text-6xl leading-none text-[#E8C26B]/25">{step.n}</div>
              <h3 className="mt-4 text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-white/65">{step.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Οι 3 οθόνες
export function ThreeScreens() {
  const tv = imageFor('lockdown');
  const phone = imageFor('villa');
  const tablet = imageFor('marathon4h');
  const items = [
    { icon: '📺', title: 'Τηλεόραση', text: 'Η σκηνή της βραδιάς: φάσεις, χρονόμετρα, βαθμολογία και η τελετή της νικήτριας.' },
    { icon: '📟', title: 'Tablet', text: 'Η διοργανώτρια σκηνοθετεί τα πάντα: κάρτες, φάσεις, ποινές και ΣΤΟΠ με ένα άγγιγμα.' },
    { icon: '📱', title: 'Το κινητό σου', text: 'Ζάρι, ψηφοφορίες, κωδικοί και μυστικές αποστολές που βλέπεις μόνο εσύ.' },
  ];
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-[420px] max-w-4xl rounded-full bg-[#E8C26B]/10 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle center kicker="Τρεις οθόνες, μία βραδιά" title={<>Σαν <span className="dot-gold-text">τηλεπαιχνίδι</span>, στο σαλόνι σου</>} />
        <Reveal className="relative mx-auto mb-14 max-w-4xl">
          <div className="overflow-hidden rounded-[22px] border-[6px] border-[#1c1c1e] bg-black shadow-2xl ring-1 ring-white/10">
            <img src={tv} alt="" loading="lazy" className="aspect-video w-full object-cover" />
          </div>
          <div className="absolute -bottom-8 -left-2 w-[34%] overflow-hidden rounded-[18px] border-[5px] border-[#1c1c1e] shadow-2xl sm:-left-10">
            <img src={tablet} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
          </div>
          <div className="absolute -bottom-10 -right-2 w-[18%] overflow-hidden rounded-[22px] border-[5px] border-[#1c1c1e] shadow-2xl sm:-right-6">
            <img src={phone} alt="" loading="lazy" className="aspect-[9/19] w-full object-cover" />
          </div>
        </Reveal>
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 90} className="rounded-[24px] bg-white/[0.04] p-6 ring-1 ring-white/10">
              <div className="text-3xl">{item.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm text-white/65">{item.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Βίντεο
export function TrailerSection({ eventId, title, kicker }) {
  const modeId = SITE_MODE_IDS[eventId];
  const trailer = modeId ? MODE_MEDIA[modeId]?.trailer : '';
  const homeTrailer = !modeId ? (FILM.siteTrailer || PHOTO.siteTrailer) : '';
  const extra = videosFor(modeId || 'site');
  if (!trailer && !homeTrailer && !extra.length) return null;
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle center kicker={kicker || 'Το τρέιλερ'} title={title || 'Δες πώς είναι'} />
        {(trailer || homeTrailer) && (
          <Reveal className="overflow-hidden rounded-[28px] bg-black ring-1 ring-white/10 shadow-[0_40px_120px_-40px_rgba(232,194,107,0.35)]">
            {trailer
              ? <video src={`${trailer}#t=0.1`} controls playsInline preload="metadata" className="aspect-video w-full bg-black object-contain" />
              : <MediaSpot src={homeTrailer} slot="siteTrailer" controls alt="" className="aspect-video w-full bg-black object-cover" />}
          </Reveal>
        )}
        {extra.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {extra.map((src) => <video key={src} src={`${src}#t=0.1`} controls playsInline preload="metadata" className="aspect-video w-full rounded-[22px] bg-black object-contain ring-1 ring-white/10" />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Γκαλερί με μεγέθυνση
export function GallerySection({ eventId }) {
  const modeId = SITE_MODE_IDS[eventId];
  const modeGallery = (id) => (MODE_MEDIA[id]?.gallery || []).filter(Boolean);
  // Γκαλερί του Admin: του mode αν υπάρχει· αλλιώς η Heist γκαλερί (Arrest Heist) ή η Pajama γκαλερί (modes με πιτζάμες).
  const fallback = modeId === 'arrest_heist' ? HEIST_PHOTOS : ['lockdown', 'marathon_4h', 'villa_takeover'].includes(modeId) ? PAJAMA_PHOTOS : [];
  const photos = modeId
    ? (modeGallery(modeId).length ? modeGallery(modeId) : fallback.filter(Boolean))
    : [...new Set([...HEIST_PHOTOS.filter(Boolean), ...PAJAMA_PHOTOS.filter(Boolean), ...Object.values(SITE_MODE_IDS).flatMap(modeGallery)])];
  const [open, setOpen] = useState(-1);
  useEffect(() => {
    if (open < 0) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(-1);
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % photos.length);
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, photos.length]);
  if (!photos.length) return null;
  return (
    <section id="gallery" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle kicker="Γκαλερί" title={<>Η <span className="dot-gold-text">ατμόσφαιρα</span></>} />
        <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
          {photos.map((src, i) => (
            <Reveal key={src + i} delay={(i % 6) * 60} className="mb-3 break-inside-avoid sm:mb-4">
              <button type="button" onClick={() => setOpen(i)} className="block w-full overflow-hidden rounded-[20px] ring-1 ring-white/10" aria-label={`Μεγέθυνση φωτογραφίας ${i + 1}`}>
                <img src={src} alt="" loading="lazy" decoding="async" className="block w-full transition-transform duration-700 hover:scale-105" />
              </button>
            </Reveal>
          ))}
        </div>
      </div>
      {open >= 0 && (
        <div role="dialog" aria-modal="true" aria-label="Φωτογραφία" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4" onClick={() => setOpen(-1)}>
          <img src={photos[open]} alt="" className="max-h-[86vh] max-w-full rounded-2xl object-contain" />
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(-1); }} aria-label="Κλείσιμο" className="absolute right-4 top-4 h-11 w-11 rounded-full bg-white/10 text-xl text-white">✕</button>
          {photos.length > 1 && <>
            <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + photos.length) % photos.length); }} aria-label="Προηγούμενη" className="absolute left-3 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-2xl text-white">‹</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % photos.length); }} aria-label="Επόμενη" className="absolute right-3 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-2xl text-white">›</button>
          </>}
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ Ασφάλεια
export function SafetySection() {
  const badges = [
    { icon: '🛑', title: 'ΣΤΟΠ, πάντα', text: 'Μια λέξη ή ένα κουμπί σταματά τα πάντα, αμέσως.' },
    { icon: '🙅', title: 'PASS χωρίς εξηγήσεις', text: 'Παραλείπεις ό,τι δεν θέλεις — κανείς δεν ρωτά γιατί.' },
    { icon: '🔒', title: 'Τα όριά σου, κρυφά', text: SAFETY_RULES.boundaries.slice(0, 3).join(' · ') + '…' },
    { icon: '📵', title: 'Ό,τι γίνεται, μένει εκεί', text: 'Καμία φωτογραφία ή βίντεο χωρίς ρητή συναίνεση.' },
  ];
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle kicker="18+ · Ασφάλεια" title={<>Τολμηρό. <span className="dot-gold-text">Ποτέ πιεστικό.</span></>} text={SAFETY_RULES.adults} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b, i) => (
            <Reveal key={b.title} delay={i * 80} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-3xl">{b.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-white">{b.title}</h3>
              <p className="mt-1.5 text-sm text-white/60">{b.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Απορίες
export function FaqSection({ items }) {
  const [open, setOpen] = useState(0);
  if (!items?.length) return null;
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle center kicker="Απορίες" title="Ό,τι θες να ξέρεις" />
        <div className="divide-y divide-white/10 rounded-[28px] border border-white/10 bg-white/[0.03]">
          {items.map((item, i) => (
            <div key={item.q}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7">
                <span className="text-base font-semibold text-white sm:text-lg">{item.q}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              <div className={`grid transition-all duration-300 ${open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <p className="overflow-hidden px-5 pb-5 text-white/65 sm:px-7">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Τελικό CTA
export function FinalCta({ title, text, label, onClick }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] p-8 text-center sm:p-16">
        <img src={ART.group || ART.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1f08]/95 via-black/85 to-[#3a0d1a]/80" />
        <div className="relative">
          <Kicker>Κλειστή λίστα · λίγες θέσεις</Kicker>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-[clamp(2.2rem,7vw,4.5rem)] leading-[0.95] text-white">{title}</h2>
          {text && <p className="mx-auto mt-4 max-w-xl text-white/70">{text}</p>}
          <div className="mt-8"><PrimaryButton onClick={onClick}>{label}</PrimaryButton></div>
        </div>
      </Reveal>
    </section>
  );
}

// ------------------------------------------------------------------ Σελίδα εμπειρίας
export function StorySection({ c }) {
  return (
    <section id="story" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionTitle kicker={c.scenarioKicker || 'Το παιχνίδι'} title={c.scenarioTitle} />
          <div className="space-y-5 text-lg leading-relaxed text-white/75">{(c.scenario || []).map((p) => <Reveal as="p" key={p}>{p}</Reveal>)}</div>
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {(c.highlights || []).map((h, i) => (
            <Reveal key={h} delay={i * 70} className="flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8C26B] font-display text-black">{i + 1}</span>
              <span className="text-lg font-semibold text-white">{h}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FlowSection({ c, eventId }) {
  const guide = MODE_GUIDE[SITE_MODE_IDS[eventId]];
  const steps = (c.program?.length ? c.program : (guide?.phases || []).map((p, i) => ({ roman: String(i + 1), title: p.title, lines: [p.text] })));
  if (!steps.length) return null;
  return (
    <section id="flow" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionTitle kicker={c.programKicker || 'Ροή'} title={c.programTitle || 'Η ροή της βραδιάς'} text={c.programNote} />
        <ol className="relative space-y-4 border-l border-[#E8C26B]/30 pl-6 sm:pl-10">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title + i} delay={i * 70} className="relative rounded-[22px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <span className="absolute -left-[37px] top-6 flex h-6 w-6 items-center justify-center rounded-full bg-[#E8C26B] text-[11px] font-black text-black sm:-left-[53px]">{i + 1}</span>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                {step.meta && <span className="text-xs font-semibold text-[#E8C26B]">{step.meta}</span>}
              </div>
              {step.subtitle && <div className="text-sm text-white/55">{step.subtitle}</div>}
              {(step.lines || []).map((line) => <p key={line} className="mt-2 text-white/70">{line}</p>)}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function InfoSection({ c, eventDate }) {
  const info = (c.info || []).map((item) => ({ ...item, text: String(item.text || '').replace('{date}', eventDate || 'Ανακοινώνεται με την πρόσκληση') }));
  if (!info.length) return null;
  const icons = ['📅', '📍', '👗', '🎒'];
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {info.map((item, i) => (
          <Reveal key={item.title} delay={i * 70} className="rounded-[24px] bg-white/[0.04] p-6 ring-1 ring-white/10">
            <div className="text-2xl">{icons[i] || '✦'}</div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">{item.title}</div>
            <div className="mt-1 text-white/85">{item.text}</div>
          </Reveal>
        ))}
      </div>
      {c.participation && <Reveal as="p" className="mx-auto mt-8 max-w-3xl px-4 text-center text-white/60">{c.participation}</Reveal>}
    </section>
  );
}

// ------------------------------------------------------------------ Σταθερό κουμπί στο κινητό
export function MobileBookBar({ label, onClick }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 p-3 transition-transform duration-300 md:hidden ${shown ? 'translate-y-0' : 'translate-y-full'}`} style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
      <button type="button" onClick={onClick} className="h-14 w-full rounded-full bg-[#E8C26B] text-base font-bold text-black shadow-[0_10px_40px_-6px_rgba(232,194,107,0.6)]">{label}</button>
    </div>
  );
}

export function SiteFooter({ onHome }) {
  return (
    <footer className="border-t border-white/10 px-4 pb-28 pt-12 text-center md:pb-12">
      <a href="/site" onClick={(e) => { e.preventDefault(); onHome(); }} className="font-display text-sm tracking-[0.3em] text-[#F7E3A8]">DEAL OF TEMPTATION</a>
      <div className="mt-2 text-xs tracking-[0.2em] text-white/40">THE PRIVATE REALITY GAME NIGHT · 18+</div>
      <div className="mt-5 flex justify-center gap-5 text-sm text-white/55">
        <a href="/forms" className="hover:text-white">Φόρμα συμμετοχής</a>
        <a href="/deal" className="hover:text-white">Δήλωση ενδιαφέροντος</a>
      </div>
    </footer>
  );
}

// Ημερολόγιο διαθεσιμότητας (Admin → Ιστοσελίδα → Αρχική). Δείχνει μόνο μελλοντικές ημερομηνίες.
export function CalendarSection({ items = [], onBook }) {
  const upcoming = (items || [])
    .filter((item) => item?.date && !Number.isNaN(Date.parse(item.date)) && Date.parse(item.date) > Date.now())
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (!upcoming.length) return null;
  return (
    <section id="calendar" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionTitle kicker="Ημερολόγιο" title={<>Οι επόμενες <span className="dot-gold-text">βραδιές</span></>} text="Διάλεξε ημερομηνία και κλείσε θέση πριν γεμίσει." />
        <ul className="mt-8 divide-y divide-white/10 overflow-hidden rounded-[28px] bg-[#111] ring-1 ring-white/10">
          {upcoming.map((item, i) => {
            const c = getSiteContent(item.event);
            const left = Math.max(0, Number(item.seats || 0) - Number(item.booked || 0));
            const soldOut = Number(item.seats || 0) > 0 && left === 0;
            const d = new Date(item.date);
            return (
              <li key={`${item.date}-${i}`} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <div className="w-16 shrink-0 text-center">
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#E8C26B]">{d.toLocaleDateString('el-GR', { month: 'short' })}</div>
                  <div className="font-display text-3xl leading-none text-white">{d.getDate()}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{c.tab || (c.titleLines || []).join(' ')}</div>
                  <div className="text-sm text-white/60">{d.toLocaleDateString('el-GR', { weekday: 'long' })} · {d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${soldOut ? 'bg-white/10 text-white/50' : left > 0 && left <= 3 ? 'bg-[#FF453A]/15 text-[#FF8A80]' : 'bg-[#30D158]/15 text-[#7BE495]'}`}>
                  {soldOut ? 'Sold out' : Number(item.seats || 0) > 0 ? `${left} ${left === 1 ? 'θέση' : 'θέσεις'}` : 'Διαθέσιμο'}
                </div>
                <button type="button" disabled={soldOut} onClick={() => onBook(item.event)} className="h-11 rounded-full bg-[#E8C26B] px-5 text-sm font-bold text-black disabled:opacity-30">Κλείσε θέση</button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
