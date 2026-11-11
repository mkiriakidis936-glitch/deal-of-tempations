import React, { useState, useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 5200);
    const t3 = setTimeout(() => onComplete(), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div className={`comic-dots-dark fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700 ${phase === 2 ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center">
        <div className={`text-6xl opacity-70 transition-transform duration-700 ease-lux ${phase >= 1 ? 'scale-100' : 'scale-75 opacity-0'}`}>
          🔮
        </div>
        <div className={`ds-title mt-6 text-6xl leading-none transition-all duration-700 ease-lux sm:text-7xl ${phase >= 1 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          Deal of
        </div>
        <div className={`ds-title mt-3 text-5xl leading-none text-primary transition-all delay-300 duration-700 ease-lux sm:text-6xl ${phase >= 1 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          Temptation
        </div>
        <div className="ds-rule mx-auto mt-8 w-40" />
        <div className={`ds-eyebrow mt-6 text-foreground/45 transition-opacity delay-500 duration-700 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          18+ · Ritual of Secrets
        </div>
        <div className="ds-label mt-10 text-foreground/20">
          © 2026 — Base44 Interactive
        </div>
      </div>
    </div>
  );
}