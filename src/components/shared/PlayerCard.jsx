import React from 'react';
import { cn } from '@/lib/utils';
import { getPenaltyLadder, FOOTWEAR_LEVELS, TOENAIL_PERKS, HIDDEN_ROLES } from '@/data/gameConfig';
import { getPlayerColor } from '@/components/shared/BoardView';

export default function PlayerCard({ player, isCurrent = false, showRole = false, compact = false }) {
  if (!player) return null;
  const footwear = FOOTWEAR_LEVELS.find((f) => f.level === player.footwearLevel) || FOOTWEAR_LEVELS[2];
  const perk = TOENAIL_PERKS.find((p) => p.id === player.toenailPerk);
  const role = HIDDEN_ROLES.find((r) => r.id === player.role);
  const ladder = getPenaltyLadder(player.footwearLevel);
  const currentPenalty = ladder[player.penaltyStep - 1];

  return (
    <div
      className={cn(
        'rounded-md border p-2.5 flex flex-col gap-2 transition-colors duration-300 ease-lux',
        isCurrent
          ? 'border-primary/45 bg-primary/[0.07]'
          : 'border-primary/12 bg-surface-2/70',
        compact && 'text-xs gap-1.5'
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'rounded-full ring-1 ring-white/15 flex items-center justify-center font-ui font-medium text-white shrink-0',
            compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
          )}
          style={{ backgroundColor: getPlayerColor(player.id) }}
        >
          {player.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn('font-heading truncate text-foreground', compact ? 'text-sm' : 'text-base')}>
            {player.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 ds-label">
            <span className="tracking-normal text-xs">{footwear.icon}</span>
            {perk && <span className="tracking-normal" title={perk.desc}>{perk.icon}</span>}
            {player.isChief && <span className="text-primary">Αστυνόμος</span>}
            {player.team && (
              <span className={player.team === 'alpha' ? 'text-primary/80' : 'text-foreground/55'}>
                {player.team === 'alpha' ? 'ALPHA' : 'BETA'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {ladder.map((step, i) => (
          <div
            key={step.step}
            className={cn(
              'h-[3px] flex-1 rounded-full',
              i < player.penaltyStep ? 'bg-destructive/85' : 'bg-primary/12',
              i === player.penaltyStep - 1 && 'bg-primary'
            )}
            title={step.label}
          />
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-2 ds-label">
        <span className={cn('ds-value text-[11px]', player.penaltyStep >= ladder.length ? 'text-destructive' : 'text-foreground/80')}>
          {player.penaltyStep > 0 ? `${player.penaltyStep}/${ladder.length} ${currentPenalty?.icon || ''}` : 'ΕΛΕΥΘΕΡΗ'}
        </span>
        <span className="ds-value text-[11px] text-foreground/55">🎟️ {player.tokens}</span>
        <span className="ds-value text-[11px] text-foreground/55">🔮 {player.karma || 0}</span>
        {player.bounty > 0 && <span className="ds-value text-[11px] text-primary">${player.bounty.toLocaleString()}</span>}
      </div>

      {showRole && role && (
        <div className="rounded-sm border border-primary/20 bg-primary/[0.06] px-2 py-1 ds-label text-primary">
          {role.icon} {role.name}
        </div>
      )}
    </div>
  );
}