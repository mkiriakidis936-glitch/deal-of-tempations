import React from 'react';
import PajamaTimer from '@/components/pajama/PajamaTimer';
import GameCard from '@/components/shared/GameCard';

export default function PajamaCardStage({ card, cat, atmo, onResolve }) {
  return (
    <div className="space-y-4">
      <GameCard
        kicker={cat?.name || 'Pajama'}
        corner={card.scored === false ? 'Χωρίς σκορ' : null}
        icon={cat?.icon || '🩴'}
        image={card.image}
        accent={atmo.accent}
        title={card.title}
        text={card.text}
        footLeft={card.timer ? `⏱ ${card.timer}″` : ''}
        footRight={card.scored === false ? null : `+${card.success ?? 2} / −${card.fail ?? 1}`}
      />

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