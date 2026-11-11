import React from 'react';
import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';

export default function MoodGallery({ photos = [], title, className }) {
  if (!photos.length) return null;
  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <div className="text-[11px] tracking-[0.4em] text-tarot-gold/50 uppercase">{title}</div>
      )}
      <div className={cn('grid gap-2', photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {photos.map((src, i) => (
          <div
            key={src}
            className="relative overflow-hidden rounded-md border border-tarot-gold/25 aspect-[3/4]"
          >
            <Image
              src={src}
              fittingType="fill"
              className="w-full h-full"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}