import React from 'react';
import { PHOTO, FILM, MODE_MEDIA, videosFor } from '@/data/brandArt';
import MediaSpot from '@/components/shared/MediaSpot';

const MODE_IDS = { lockdown: 'lockdown', beachbar: 'beach_bar', marathon4h: 'marathon_4h', heist: 'arrest_heist' };

export default function SiteVideo({ c, eventId }) {
  const modeId = MODE_IDS[eventId];
  const trailer = modeId ? MODE_MEDIA[modeId]?.trailer : '';
  const siteTrailer = !modeId ? FILM.siteTrailer : '';
  const isModeDetail = !!modeId;
  const kicker = c?.videoKicker || 'Το τρέιλερ';
  const title = c?.videoTitle || 'ΒΙΝΤΕΟ & ΤΡΕΙΛΕΡ';
  const extraVideos = videosFor(modeId || 'site');
  if (isModeDetail && !trailer && !extraVideos.length) return null;
  return (
    <section className="px-4 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <div className="text-[10px] sm:text-xs tracking-[0.42em] text-tarot-gold/65 uppercase mb-3">Βίντεο & Τρέιλερ</div>
          <h2 className="font-display text-3xl sm:text-4xl text-tarot-gold tracking-[0.08em]">{title}</h2>
        </div>
        {isModeDetail && !trailer ? null : trailer || siteTrailer ? (
          <div className="overflow-hidden rounded-2xl border border-tarot-gold/25 bg-black shadow-[0_24px_70px_rgba(0,0,0,.35)]">
            <video src={trailer || siteTrailer} controls playsInline preload="metadata" className="w-full aspect-video object-contain bg-black" />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-tarot-gold/25 bg-black shadow-[0_24px_70px_rgba(0,0,0,.35)]">
            <MediaSpot src={PHOTO.siteTrailer || FILM.siteTrailer} slot="siteTrailer" alt="" className="w-full aspect-video bg-black object-cover object-top" />
          </div>
        )}
        {extraVideos.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {extraVideos.map((src) => <div key={src} className="overflow-hidden rounded-xl border border-tarot-gold/20 bg-black"><video src={src} controls playsInline preload="metadata" className="w-full aspect-video bg-black object-contain" /></div>)}
          </div>
        )}
      </div>
    </section>
  );
}