import React from 'react';

export default function PajamaStage({ atmo, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: atmo.base, color: atmo.text }}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: atmo.stage }} />

        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: '80vw',
            height: '70vh',
            background: `radial-gradient(ellipse at 50% 0%, ${atmo.accent}26, transparent 68%)`,
            filter: 'blur(8px)',
          }}
        />

        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: 'clamp(22px, 4.5vw, 76px)',
            background: `repeating-linear-gradient(90deg, ${atmo.curtainDark} 0 10px, ${atmo.curtain} 10px 22px)`,
            boxShadow: 'inset -18px 0 46px rgba(0,0,0,.85)',
          }}
        />
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: 'clamp(22px, 4.5vw, 76px)',
            background: `repeating-linear-gradient(90deg, ${atmo.curtain} 0 12px, ${atmo.curtainDark} 12px 22px)`,
            boxShadow: 'inset 18px 0 46px rgba(0,0,0,.85)',
          }}
        />

        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 92% 80% at 50% 45%, transparent 38%, rgba(0,0,0,.7))' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{ background: `linear-gradient(0deg, ${atmo.base}, transparent)` }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}