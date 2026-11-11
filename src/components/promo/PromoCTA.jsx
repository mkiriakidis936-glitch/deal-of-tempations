import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PromoCTA({ content }) {
  const navigate = useNavigate();

  return (
    <section className="relative px-5 py-20 text-center" style={{ background: 'linear-gradient(180deg,#0a0a0a,#1a0508)' }}>
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
        <div style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', color: '#ffd700', fontWeight: 700, lineHeight: 1.25 }}>
          {content.ctaTitle[0]}
          <br />
          {content.ctaTitle[1]}
        </div>

        <button type="button" className="cinv-btn w-full max-w-sm" onClick={() => navigate(content.ctaPath)}>
          {content.ctaLabel}
        </button>

        <div className="text-xs tracking-wide" style={{ color: 'rgba(241,230,200,.45)', lineHeight: 1.8 }}>
          {content.footer}
        </div>
      </div>
    </section>
  );
}