import React from 'react';
import PajamaTimer from '@/components/pajama/PajamaTimer';

export default function PajamaCardStage({ card, cat, atmo, onResolve }) {
  return (
    <div
      className="comic-pop rounded-2xl p-5 sm:p-7 space-y-4"
      style={{
        background: atmo.cardBg,
        border: `2px solid ${atmo.border}`,
        boxShadow: `0 30px 80px rgba(0,0,0,.75), 0 0 70px ${atmo.accent}2e, inset 0 0 0 1px ${atmo.accentSoft}`,
      }}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em]" style={{ color: atmo.accent }}>
        <span>{cat?.icon} {cat?.name}</span>
        <span>{card.scored === false ? 'ΧΩΡΙΣ ΣΚΟΡ' : `+${card.success ?? 2} / −${card.fail ?? 1}`}</span>
      </div>

      {card.title && (
        <h2
          className="font-display text-center leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 3.4vw, 2.3rem)', color: atmo.text, textShadow: '0 2px 0 #000' }}
        >
          {card.title}
        </h2>
      )}

      <p className="text-center font-body leading-snug" style={{ fontSize: 'clamp(1.05rem, 1.7vw, 1.5rem)', color: atmo.text }}>
        {card.text}
      </p>

      {card.timer ? (
        <div className="space-y-1">
          <PajamaTimer seconds={card.timer} onComplete={card.scored ? () => onResolve(false) : undefined} />
          {card.scored && (
            <div className="text-center text-[11px]" style={{ color: '#f3a0a0' }}>
              Λήξη χρόνου = αυτόματη αποτυχία και ποινή.
            </div>
          )}
        </div>
      ) : null}

      {card.scored !== false ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onResolve(true)}
            className="rounded-xl py-4 font-heading text-base sm:text-lg"
            style={{ background: 'linear-gradient(180deg,#1f7a4d,#0f4028)', color: '#eafff2', border: '1px solid rgba(120,255,190,.4)' }}
          >
            ✅ ΕΠΙΤΥΧΙΑ +{card.success || 2}
          </button>
          <button
            onClick={() => onResolve(false)}
            className="rounded-xl py-4 font-heading text-base sm:text-lg"
            style={{ background: 'linear-gradient(180deg,#9b2233,#4a0c17)', color: '#ffecee', border: '1px solid rgba(255,140,150,.4)' }}
          >
            ❌ ΑΠΟΤΥΧΙΑ −{card.fail || 1}
          </button>
        </div>
      ) : (
        <button
          onClick={() => onResolve(null)}
          className="w-full rounded-xl py-4 font-heading text-lg"
          style={{ background: atmo.accent, color: '#150a06' }}
        >
          ΟΛΟΚΛΗΡΩΘΗΚΕ
        </button>
      )}
    </div>
  );
}