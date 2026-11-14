import React from 'react';
import { cn } from '@/lib/utils';
import { CLASSIC_BOARD, SQUARE_TYPES } from '@/data/gameConfig';

const PLAYER_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#a855f7',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1',
];

export function getPlayerColor(playerId) {
  const idx = parseInt(playerId?.replace('p', '')) || 0;
  return PLAYER_COLORS[idx % PLAYER_COLORS.length];
}

export default function BoardView({ players = [], onSquareClick, compact = false }) {
  return (
    <div className={cn('grid gap-1', compact ? 'grid-cols-6 sm:grid-cols-11' : 'grid-cols-6 sm:grid-cols-11')}>
      {CLASSIC_BOARD.map((sq) => {
        const typeInfo = SQUARE_TYPES[sq.type] || SQUARE_TYPES.street;
        const here = players.filter((p) => p.position === sq.position);
        return (
          <button
            key={sq.position}
            onClick={onSquareClick ? () => onSquareClick(sq) : undefined}
            className={cn(
              'aspect-square border rounded-sm relative flex flex-col items-center justify-center transition-colors duration-300 ease-lux',
              typeInfo.color,
              sq.position === 0 && 'border-primary/40',
              !sq.position && 'border-primary/12',
              onSquareClick && 'cursor-pointer hover:border-primary/45'
            )}
          >
            <span className="ds-value absolute left-1 top-0.5 text-[7px] leading-none text-foreground/45 sm:text-[9px]">
              {sq.position}
            </span>
            <span className={cn('text-sm sm:text-lg', compact && 'text-xs')}>
              {typeInfo.icon}
            </span>
            {here.length > 0 && (
              <div className="absolute bottom-0.5 left-0 right-0 flex flex-wrap gap-0.5 justify-center">
                {here.map((p) => (
                  <div
                    key={p.id}
                    className={cn('rounded-full ring-1 ring-white/20 flex items-center justify-center font-ui text-[7px] font-medium text-white', compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5')}
                    style={{ backgroundColor: getPlayerColor(p.id) }}
                    title={p.name}
                  >
                    {p.name?.charAt(0)?.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}