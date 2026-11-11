import React from 'react';
import { Image } from '@/components/ui/image';

export default function PromoExperience({ content }) {
  return (
    <section className="relative px-5 py-20" style={{ background: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-[11px] tracking-[0.4em] font-bold mb-3" style={{ color: '#c9a227' }}>
            {content.expKicker}
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem,4.5vw,2.4rem)', color: '#ffd700', fontWeight: 700 }}>
            {content.expTitle}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {content.expCards.map((c) => (
            <div key={c.title} className="flex flex-col overflow-hidden" style={{ border: '1px solid #3a1414', borderRadius: 6 }}>
              <div className="relative h-40">
                {c.img ? (
                  <Image src={c.img} fittingType="fill" className="w-full h-full" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'radial-gradient(circle at 50% 50%, rgba(139,0,0,.5), #0a0a0a 75%)' }}
                  >
                    <span style={{ fontSize: '2.5rem', color: '#ffd700', textShadow: '0 0 30px rgba(255,215,0,.6)' }}>✦</span>
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,10,.15), rgba(10,10,10,.92))' }} />
              </div>
              <div className="p-5" style={{ background: 'rgba(18,8,10,.95)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffd700', marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(241,230,200,.65)' }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-10 mx-auto max-w-xl text-center p-5"
          style={{ border: '1px dashed #8b0000', borderRadius: 6, color: 'rgba(241,230,200,.55)', fontSize: '.95rem', lineHeight: 1.6 }}
        >
          {content.expNote[0]}
          <br />
          {content.expNote[1]}
        </div>
      </div>
    </section>
  );
}