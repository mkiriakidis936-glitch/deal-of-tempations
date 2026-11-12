import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PajamaRSVP from '@/components/pajama/PajamaRSVP';
import { Image } from '@/components/ui/image';
import { ART, FILM, PAJAMA_PHOTOS } from '@/data/brandArt';
import VideoFilm from '@/components/shared/VideoFilm';
import MoodGallery from '@/components/shared/MoodGallery';
import PhotoFilm from '@/components/shared/PhotoFilm';

const LINES = [
  'Πιτζάμες. Νύχια φρεσκοβαμμένα. Παντόφλες.',
  'Μια λίστα υποχρεώσεων που δεν διαβάζεις πριν φτάσεις.',
  'Λίγες καλεσμένες. Καμία δεν ξέρει τα υπόλοιπα.',
];

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

export default function PajamaInvite() {
  const navigate = useNavigate();
  const [eventDate, setEventDate] = useState('');
  const countdown = useCountdown(eventDate);

  useEffect(() => {
    async function load() {
      try {
        const { items } = await base44.entities.AppSetting.filter({ key: 'event_date' }, { limit: 1 });
        if (items?.[0]?.value) setEventDate(items[0].value);
      } catch (e) {
        /* silent */
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0">
        <VideoFilm slot="pajama" src={FILM.pajama} poster={ART.vault} className="w-full h-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 cinv-beam" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center space-y-8">
        <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 cinv-sealglow" />
          <div className="relative w-32 h-32 rounded-full border-2 border-tarot-gold/70 flex items-center justify-center cinv-seal">
            <Image src={ART.slipper} fittingType="fill" className="w-[116px] h-[116px] rounded-full" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs tracking-[0.5em] text-tarot-gold/70 uppercase">Πρόσκληση</div>
          <h1 className="font-display text-4xl sm:text-6xl text-tarot-gold tracking-[0.12em] leading-tight">
            PAJAMA<br />PEDI-GLAM
          </h1>
          <div className="w-24 h-px bg-tarot-gold/40 mx-auto" />
        </div>

        <PhotoFilm photos={PAJAMA_PHOTOS} />

        <div className="space-y-4">
          {LINES.map((line, i) => (
            <p
              key={i}
              className="cinv-line font-body"
              style={{ animationDelay: `${0.4 + i * 0.5}s` }}
            >
              {line}
            </p>
          ))}
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
                ].map((unit) => (
                  <div key={unit.l} className="text-center">
                    <div className="font-display text-3xl sm:text-4xl text-tarot-gold">
                      {String(unit.v).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] tracking-[0.25em] text-tarot-gold/60 mt-1">{unit.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button className="cinv-btn w-full" onClick={() => navigate('/pajama-form')}>
            ΚΛΕΙΣΕ ΘΕΣΗ
          </button>
          <p className="text-xs text-foreground/40 tracking-[0.2em] uppercase">
            5 λεπτά · μόνο τα βασικά
          </p>
        </div>

        <MoodGallery photos={PAJAMA_PHOTOS} title="Η ατμόσφαιρα" />

        <div className="pt-4 border-t border-tarot-gold/20">
          <div className="text-[11px] tracking-[0.4em] text-tarot-gold/60 uppercase mb-4">Ποιος έρχεται</div>
          <PajamaRSVP />
        </div>

        <div className="pt-6 text-[11px] tracking-[0.4em] text-tarot-gold/40 uppercase">
          Λίστα καλεσμένων: κλειστή · 18+
        </div>
      </div>
    </div>
  );
}