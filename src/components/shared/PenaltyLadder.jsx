import React from 'react';
import { cn } from '@/lib/utils';
import { getPenaltyLadder, FOOTWEAR_LEVELS } from '@/data/gameConfig';

export default function PenaltyLadder({ player }) {
  if (!player) return null;
  const ladder = getPenaltyLadder(player.footwearLevel);
  const footwear = FOOTWEAR_LEVELS.find((f) => f.level === player.footwearLevel);

  return (
    <div className="rounded-md border border-primary/12 bg-surface-2/70 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-primary/10 pb-2">
        <span className="ds-eyebrow text-primary/85">Σκάλα Ποινών</span>
        <span className="ds-label text-foreground/55">
          {footwear?.icon} {footwear?.steps} βήματα
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {ladder.map((step, i) => {
          const done = i < player.penaltyStep;
          const current = i === player.penaltyStep - 1;
          return (
            <div
              key={step.step}
              className={cn(
                'flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 transition-colors duration-300 ease-lux',
                done && 'bg-destructive/[0.10]',
                current && 'bg-primary/[0.10] ring-1 ring-primary/30',
                !done && !current && 'bg-transparent'
              )}
            >
              <span className="text-sm">{step.icon}</span>
              <span className={cn('flex-1 font-body text-[0.95rem] text-foreground/85', done && 'line-through opacity-55')}>
                <span className="ds-value mr-1 text-[11px] text-foreground/45">{step.step}</span>
                {step.label}
              </span>
              {done && <span className="text-[10px] text-destructive/80">✓</span>}
              {current && <span className="ds-label text-primary">Τώρα</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}