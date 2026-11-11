import React, { useState } from 'react';
import PromoHero from '@/components/promo/PromoHero';
import PromoSteps from '@/components/promo/PromoSteps';
import PromoExperience from '@/components/promo/PromoExperience';
import PromoCTA from '@/components/promo/PromoCTA';
import { PROMO_MODES } from '@/data/promoContent';

export default function Promo() {
  const initial = new URLSearchParams(window.location.search).get('mode') === 'pajama' ? 'pajama' : 'classic';
  const [mode, setMode] = useState(initial);
  const content = PROMO_MODES.find((m) => m.key === mode) || PROMO_MODES[0];

  const pick = (key) => {
    setMode(key);
    const url = key === 'pajama' ? '/promo?mode=pajama' : '/promo';
    window.history.replaceState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: '#0a0a0a', color: '#f1e6c8', fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      <div
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex gap-1 p-1 rounded-full"
        style={{ background: 'rgba(10,10,10,.8)', border: '1px solid #8b0000', backdropFilter: 'blur(8px)' }}
      >
        {PROMO_MODES.map((m) => {
          const active = m.key === mode;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => pick(m.key)}
              className="px-4 py-1.5 rounded-full font-bold transition-all"
              style={{
                fontSize: '.7rem',
                letterSpacing: '.22em',
                background: active ? 'linear-gradient(180deg,#a00000,#5c0000)' : 'transparent',
                color: active ? '#ffd700' : 'rgba(241,230,200,.5)',
                border: active ? '1px solid #ffd700' : '1px solid transparent',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <PromoHero content={content} />
      <PromoSteps content={content} />
      <PromoExperience content={content} />
      <PromoCTA content={content} />
    </div>
  );
}