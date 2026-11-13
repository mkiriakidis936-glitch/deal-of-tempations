import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ART, PHOTO, FILM } from '@/data/brandArt';
import MediaSpot from '@/components/shared/MediaSpot';
import { Image } from '@/components/ui/image';

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    done: diff === 0,
  };
}

export default function SiteHero({ c, ev, eventDate, heroSrc }) {
  const navigate = useNavigate();
  const countdown = useCountdown(eventDate);

  return (
    <section id="top" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4 py-20">
      <div className="absolute inset-0 -z-10">
        <MediaSpot src={heroSrc || PHOTO.siteHero || FILM.siteHero} slot={heroSrc ? undefined : "siteHero"} className="w-full h-full object-cover object-center opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      <div className="relative w-full max-w-4xl text-center space-y-8">
        <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 relative flex items-center justify-center">
          <div className="absolute inset-0 cinv-sealglow" />
          <Image
            src={ART.emblem}
            fittingType="fill"
            className="relative w-full h-full rounded-full border-2 border-tarot-gold/60"
          />
        </div>

        <div className="space-y-3">
          <div className="text-[11px] tracking-[0.5em] text-tarot-gold/70 uppercase">{c.overline}</div>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl text-tarot-gold tracking-[0.1em] leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,.6)]">
            {c.titleLines.map((l, i) => (<React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>))}
          </h1>
          <div className="w-24 h-px bg-tarot-gold/40 mx-auto" />
          <p className="text-base sm:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            {c.tagline}
          </p>
        </div>

        {countdown && (
          <div className="cinv-count inline-block">
            <div className="cinv-cl">Η ΝΥΧΤΑ ΞΕΚΙΝΑΕΙ ΣΕ</div>
            {countdown.done ? (
              <div className="font-display text-2xl text-tarot-gold">Απόψε.</div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                {[
                  { v: countdown.days, l: 'ΜΕΡΕΣ' },
                  { v: countdown.hours, l: 'ΩΡΕΣ' },
                  { v: countdown.minutes, l: 'ΛΕΠΤΑ' },
                  { v: countdown.seconds, l: 'ΔΕΥΤ' },
                ].map((u) => (
                  <div key={u.l} className="text-center">
                    <div className="font-display text-3xl sm:text-4xl text-tarot-gold">
                      {String(u.v).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] tracking-[0.25em] text-tarot-gold/60 mt-1">{u.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="cinv-btn w-full sm:w-auto" style={{ animation: 'none' }} onClick={() => navigate(c.cta.path)}>
            {c.cta.label}
          </button>
          <a href="#photos" className="comic-boom px-8 py-4 text-xs tracking-[0.3em] text-tarot-gold inline-flex items-center justify-center">
            ΔΕΣ ΤΟ GALLERY
          </a>
        </div>
      </div>
    </section>
  );
}