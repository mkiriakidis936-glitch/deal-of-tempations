import React from 'react';

export default function PajamaStageHeader({ act, atmo, round, totalRounds, currentPlayer }) {
  return (
    <div className="select-none text-center">
      <div className="flex items-center justify-center gap-3 text-[10px] tracking-[0.42em]" style={{ color: atmo.accent }}>
        <span className="h-px w-8" style={{ background: atmo.border }} />
        {atmo.label}
        <span className="h-px w-8" style={{ background: atmo.border }} />
      </div>

      <div
        className="font-display mt-1 leading-none"
        style={{
          fontSize: 'clamp(1.7rem, 4vw, 2.8rem)',
          color: atmo.accent,
          textShadow: `0 2px 0 #000, 0 0 46px ${atmo.accent}66`,
        }}
      >
        ΠΡΑΞΗ {act?.roman}
      </div>

      <div className="font-heading mt-1 tracking-[0.18em]" style={{ color: atmo.text }}>
        {act?.title}
      </div>
      <div className="text-xs italic" style={{ color: atmo.dim }}>
        {act?.subtitle}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.22em]" style={{ color: atmo.dim }}>
        {totalRounds > 0 && <span>Γύρος {round}/{totalRounds}</span>}
        {currentPlayer && (
          <span>
            Σειρά: <b style={{ color: atmo.text }}>{currentPlayer.name}</b>
          </span>
        )}
      </div>
    </div>
  );
}