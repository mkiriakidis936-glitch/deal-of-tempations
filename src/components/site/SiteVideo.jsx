import React from 'react';
import { PHOTO, FILM, SITE_VIDEOS, MODE_MEDIA } from '@/data/brandArt';
import MediaSpot from '@/components/shared/MediaSpot';

const MODE_IDS = { extended: 'pedi_extended', lockdown: 'lockdown', beachbar: 'beach_bar', marathon4h: 'marathon_4h' };

export default function SiteVideo({ c, eventId }) {
  const modeId = MODE_IDS[eventId];
  const trailer = modeId ? MODE_MEDIA[modeId]?.trailer : '';
  const isModeDetail = !!modeId;
  const kicker = c?.videoKicker || 'Το τρέιλερ';
  const title = c?.videoTitle || 'VIDEO & TRAILER';
  if (isModeDetail && !trailer) return null;
  return (
    <section className="px-4 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <div className="text-[10px] sm:text-xs tracking-[0.42em] text-tarot-gold/65 uppercase mb-3">Video & Trailer</div>
          <h2 className="font-display text-3xl sm:text-4xl text-tarot-gold tracking-[0.08em]">{title}</h2>
        </div>
        {trailer ? (
          <div className="overflow-hidden rounded-2xl border border-tarot-gold/25 bg-black shadow-[0_24px_70px_rgba(0,0,0,.35)]">
            <video src={trailer} controls playsInline preload="metadata" className="w-full aspect-video object-contain bg-black" />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-tarot-gold/25 bg-black shadow-[0_24px_70px_rgba(0,0,0,.35)]">
            <MediaSpot src={PHOTO.siteTrailer || FILM.siteTrailer} slot="siteTrailer" alt="" className="w-full aspect-video bg-black object-cover object-center" />
          </div>
        )}
        {!modeId && SITE_VIDEOS.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {SITE_VIDEOS.map((src) => <div key={src} className="overflow-hidden rounded-xl border border-tarot-gold/20 bg-black"><video src={src} controls playsInline preload="metadata" className="w-full aspect-video bg-black object-contain" /></div>)}
          </div>
        )}
      </div>
    </section>
  );
}