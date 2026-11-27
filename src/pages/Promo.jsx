import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MediaSpot from '@/components/shared/MediaSpot';
import { ART, PHOTO, MODE_MEDIA, MODE_COVERS } from '@/data/brandArt';
import { getSiteContent } from '@/data/siteContent';
import { GAME_MODES } from '@/data/gameConfig';
import { modeMeta, durationLabel } from '@/data/modes/modeRegistry';

// /promo — η σύντομη προωθητική σελίδα που στέλνεις σε όποια θες να μάθει για τη βραδιά.
// Δείχνει ΟΛΑ τα ενεργά modes. Τα κείμενα έρχονται από Admin → Ιστοσελίδα (ίδια με το /site),
// οι εικόνες από Admin → Φωτογραφίες & βίντεο (κεντρική εικόνα κάθε mode + «Promo — κεντρική»).
// /promo?mode=<id> ανοίγει κατευθείαν στο συγκεκριμένο mode (σύνδεσμος ανά mode στο Admin → Σύνδεσμοι & QR).

// mode → κλειδί κειμένων του site
export const PROMO_SITE_KEYS = { classic: 'classic', arrest_heist: 'heist', lockdown: 'lockdown', marathon_4h: 'marathon4h', villa_takeover: 'villa' };

export const promoModes = () => GAME_MODES
  .filter((mode) => !mode.retired && PROMO_SITE_KEYS[mode.id])
  .map((mode) => {
    const site = getSiteContent(PROMO_SITE_KEYS[mode.id]);
    const meta = modeMeta(mode.id);
    const media = MODE_MEDIA[mode.id] || {};
    const hours = durationLabel(meta);
    return {
      id: mode.id,
      icon: mode.icon,
      name: mode.name,
      title: (site.titleLines || []).join(' ') || mode.name,
      tagline: site.tagline || mode.desc || '',
      highlights: (site.highlights || []).slice(0, 4),
      facts: [hours, meta ? `${meta.min}–${meta.max} παίκτριες` : '', '18+'].filter(Boolean),
      image: media.hero || media.cover || MODE_COVERS[`modeCover_${mode.id}`] || ART.poster,
      cta: `/forms?mode=${mode.id}`,
    };
  });

export default function Promo() {
  const modes = useMemo(() => promoModes(), []);
  const focus = new URLSearchParams(window.location.search).get('mode') || '';

  useEffect(() => {
    if (!focus) return;
    const el = document.getElementById(`mode-${focus}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
  }, [focus]);

  return (
    <div className="min-h-[100dvh] bg-black text-[#F5F1E8]">
      {/* Hero */}
      <section className="relative flex min-h-[88svh] items-end overflow-hidden">
        <MediaSpot src={PHOTO.promo || ART.poster} slot="promo" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-14 sm:pb-20">
          <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#E8C26B]">18+ · Μόνο με πρόσκληση</div>
          <h1 className="mt-3 text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">DEAL OF<br />TEMPTATION</h1>
          <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">Ιδιωτικές βραδιές παιχνιδιού σαν τηλεοπτικό reality. Διάλεξε την εμπειρία σου και κλείσε θέση.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {modes.map((mode) => (
              <a key={mode.id} href={`#mode-${mode.id}`} className={`rounded-full border px-4 py-2 text-sm font-semibold ${focus === mode.id ? 'border-[#E8C26B] bg-[#E8C26B] text-black' : 'border-white/20 bg-white/5 text-white/85'}`}>
                {mode.icon} {mode.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Ένα μπλοκ ανά mode */}
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:space-y-8 sm:px-5">
        {modes.map((mode, index) => (
          <section key={mode.id} id={`mode-${mode.id}`} className={`scroll-mt-6 overflow-hidden rounded-[28px] border bg-[#111] ${focus === mode.id ? 'border-[#E8C26B]' : 'border-white/10'}`}>
            <div className={`grid md:grid-cols-2 ${index % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[360px]">
                <img src={mode.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent md:bg-gradient-to-r" />
              </div>
              <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                <div className="text-3xl">{mode.icon}</div>
                <h2 className="text-3xl font-bold leading-tight">{mode.title}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {mode.facts.map((fact) => <span key={fact} className="rounded-full bg-[#E8C26B]/15 px-3 py-1 text-xs font-semibold text-[#F7E3A8]">{fact}</span>)}
                </div>
                <p className="text-[15px] leading-relaxed text-white/75">{mode.tagline}</p>
                {mode.highlights.length > 0 && (
                  <ul className="grid grid-cols-2 gap-2 text-sm text-white/80">
                    {mode.highlights.map((item) => <li key={item} className="rounded-xl bg-white/[0.04] px-3 py-2">✦ {item}</li>)}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link to={mode.cta} className="inline-flex h-12 items-center rounded-full bg-[#E8C26B] px-6 font-bold text-black">Κλείσε θέση</Link>
                  <Link to={`/site?event=${PROMO_SITE_KEYS[mode.id]}`} className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 font-semibold text-white/85">Περισσότερα</Link>
                </div>
              </div>
            </div>
          </section>
        ))}
      </main>

      <footer className="mx-auto max-w-5xl px-5 pb-14 text-center text-xs text-white/45">
        18+ · Μόνο με συναίνεση · Η λέξη-στοπ ισχύει πάντα και σταματά τα πάντα.
      </footer>
    </div>
  );
}
