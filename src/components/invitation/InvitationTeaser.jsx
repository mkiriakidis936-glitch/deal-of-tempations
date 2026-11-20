import React, { useState, useEffect } from 'react';
import { Image } from '@/components/ui/image';
import { ART, PHOTO, FILM, HEIST_PHOTOS } from '@/data/brandArt';
import MediaSpot from '@/components/shared/MediaSpot';
import MoodGallery from '@/components/shared/MoodGallery';

const TEASER_LINES = [
  'Κάτι έρχεται.',
  'Η πρόσκληση ήρθε.',
  'Το περιεχόμενο — σφραγισμένο.',
  'Μην αναρωτιέσαι τι.',
  'Αναρωτήσου πότε.',
];

const SEAL_URL = ART.emblem;
const BG_URL = ART.invitationBg;

export default function InvitationTeaser({ onOpen }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const total = await base44.entities.PlayerIntake.count({});
        setCount(total || 0);
      } catch (e) { /* ignore */ }
    }
    load();
  }, []);

  return (
    <div
      className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center overflow-x-hidden"
      style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#f1e6c8' }}
    >
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ opacity: 0.55 }}>
          <MediaSpot src={PHOTO.invitation || FILM.invitation} slot="invitation" className="w-full h-full object-cover" />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 38% 60% at 50% 30%, rgba(232,194,107,.10), rgba(10,10,10,.55) 55%, #0a0a0a 85%), linear-gradient(180deg, rgba(10,10,10,.5), rgba(26,10,10,.85))',
          }}
        />
      </div>
      <div className="fixed top-0 left-0 w-full h-[56px] bg-black z-20" style={{ borderBottom: '1px solid #3a1414' }} />
      <div className="fixed bottom-0 left-0 w-full h-[56px] bg-black z-20" style={{ borderTop: '1px solid #3a1414' }} />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-8 text-center py-24 px-4">
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          <Image
            src={SEAL_URL}
            fittingType="fill"
            className="rounded-full border-[3px] border-[#3a0000] w-[220px] h-[220px]"
            style={{ boxShadow: '0 30px 60px rgba(0,0,0,.9), 0 0 90px rgba(139,0,0,.7), inset 0 0 40px rgba(0,0,0,.6)' }}
          />
        </div>

        <div className="flex flex-col gap-3 min-h-[220px]">
          {TEASER_LINES.map((line, i) => {
            const isLast = i === TEASER_LINES.length - 1;
            return (
              <div
                key={i}
                className="cinv-line"
                style={{
                  opacity: 1,
                  animation: 'none',
                  ...(isLast
                    ? { color: '#E8C26B', fontSize: '2.25rem', fontWeight: 700, textShadow: '0 0 34px rgba(232,194,107,.65), 0 2px 0 #000' }
                    : {}),
                }}
              >
                {line}
              </div>
            );
          })}
        </div>

        <button type="button" className="w-full cinv-btn" style={{ animation: 'none' }} onClick={onOpen}>
          🔓 ΑΝΟΙΓΜΑ ΦΑΚΕΛΟΥ
        </button>

        {count > 0 && (
          <div className="text-sm italic tracking-wide" style={{ color: 'rgba(241,230,200,.45)' }}>
            Ως τώρα {count} {count === 1 ? 'κοπέλα έχει κατοχυρώσει θέση.' : 'κοπέλες έχουν κατοχυρώσει θέση.'}
          </div>
        )}

        <MoodGallery photos={HEIST_PHOTOS} title="Το σκηνικό" className="w-full" />

        <div className="text-sm italic tracking-wide" style={{ color: 'rgba(241,230,200,.45)' }}>
          Δεν θα δεις τι περιέχει — μέχρι τότε.
        </div>
      </div>
    </div>
  );
}