import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return remaining;
}

const UNITS = [
  { key: 'd', label: 'ΗΜΕΡΕΣ' },
  { key: 'h', label: 'ΩΡΕΣ' },
  { key: 'm', label: 'ΛΕΠΤΑ' },
  { key: 's', label: 'ΔΕΥΤ' },
];

export default function InvitationTeaser({ onOpen }) {
  const [eventDate, setEventDate] = useState(null);
  const [count, setCount] = useState(0);
  const countdown = useCountdown(eventDate);

  useEffect(() => {
    async function load() {
      try {
        const { items } = await base44.entities.AppSetting.filter({ key: 'event_date' }, { limit: 1 });
        if (items && items.length > 0 && items[0].value) setEventDate(items[0].value);
      } catch (e) { /* no event date */ }
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
              'radial-gradient(ellipse 38% 60% at 50% 30%, rgba(255,215,0,.10), rgba(10,10,10,.55) 55%, #0a0a0a 85%), linear-gradient(180deg, rgba(10,10,10,.5), rgba(26,10,10,.85))',
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
                    ? { color: '#ffd700', fontSize: '2.25rem', fontWeight: 700, textShadow: '0 0 34px rgba(255,215,0,.65), 0 2px 0 #000' }
                    : {}),
                }}
              >
                {line}
              </div>
            );
          })}
        </div>

        {eventDate && countdown && (
          <div className="w-full cinv-count">
            <div className="cinv-cl">Η ΣΦΡΑΓΙΔΑ ΣΠΑΕΙ ΣΕ</div>
            <div className="flex justify-center items-start gap-3 text-[#ffd700]" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
              {UNITS.map((u, idx) => (
                <React.Fragment key={u.key}>
                  {idx > 0 && <span className="text-[#8b0000]">:</span>}
                  <div className="flex flex-col items-center gap-2">
                    <span>{String(countdown[u.key]).padStart(2, '0')}</span>
                    <small className="text-[11px] text-[#a8892a] tracking-[0.3em]">{u.label}</small>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
        {eventDate && !countdown && (
          <div className="font-bold text-[#c40000] text-xl">Η ΣΦΡΑΓΙΔΑ ΕΧΕΙ ΣΠΑΕΙ.</div>
        )}

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