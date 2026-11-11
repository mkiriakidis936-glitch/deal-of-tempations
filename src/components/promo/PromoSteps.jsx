import React from 'react';

export default function PromoSteps({ content }) {
  return (
    <section className="relative px-5 py-20" style={{ background: 'linear-gradient(180deg,#0a0a0a,#140508 60%,#0a0a0a)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-[11px] tracking-[0.4em] font-bold mb-3" style={{ color: '#c9a227' }}>
            {content.stepsKicker}
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem,4.5vw,2.4rem)', color: '#ffd700', fontWeight: 700 }}>
            {content.stepsTitle}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {content.steps.map((s) => (
            <div
              key={s.n}
              className="p-6"
              style={{
                background: 'linear-gradient(180deg, rgba(26,10,10,.9), rgba(10,10,10,.9))',
                border: '1px solid #8b0000',
                borderRadius: 6,
                boxShadow: '0 0 30px rgba(139,0,0,.25), inset 0 0 0 1px rgba(255,215,0,.12)',
              }}
            >
              <div className="font-bold mb-2" style={{ fontSize: '1.5rem', color: '#ffd700', letterSpacing: '.2em' }}>
                {s.n}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1e6c8', marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(241,230,200,.65)' }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}