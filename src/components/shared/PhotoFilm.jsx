import React, { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';

const LOOP_MS = 8000;

/**
 * 8-second looping "film" made of stills: slow Ken Burns push + crossfade.
 * Plays on mount, no controls.
 */
export default function PhotoFilm({ photos = [], className }) {
  const [active, setActive] = useState(0);
  const slideMs = photos.length ? LOOP_MS / photos.length : LOOP_MS;

  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % photos.length), slideMs);
    return () => clearInterval(t);
  }, [photos.length, slideMs]);

  if (!photos.length) return null;

  return (
    <div className={cn('relative w-full aspect-video overflow-hidden rounded-sm border border-tarot-gold/30 film-frame', className)}>
      {photos.map((src, i) => (
        <div key={src} className={cn('film-slide', i === active && 'is-on')}>
          <Image src={src} fittingType="fill" className="w-full h-full" />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/30" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.7)]" />
      <div className="pointer-events-none absolute left-0 bottom-0 h-px w-full bg-tarot-gold/20">
        <div key={active} className="film-progress h-px bg-tarot-gold" style={{ animationDuration: `${slideMs}ms` }} />
      </div>
    </div>
  );
}