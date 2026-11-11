import React from 'react';
import { cn } from '@/lib/utils';
import { MARATHON_BOARD, MARATHON_SQUARE_TYPES } from '@/data/marathonBoard';
import { getPlayerColor } from '@/components/shared/BoardView';

const COLS = 10;
const ROWS = 8;

function buildSnakeRows() {
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) row.push(r * COLS + c);
    if (r % 2 === 1) row.reverse();
    rows.push(row);
  }
  return rows;
}

const SNAKE_ROWS = buildSnakeRows();

export default function MarathonBoardTV({ players = [], large = false }) {
  const textSize = large ? 'text-xs' : 'text-[9px] sm:text-[10px]';
  const iconSize = large ? 'text-2xl' : 'text-lg';
  const markerSize = large ? 'w-4 h-4' : 'w-3 h-3';

  return (
    <div className="space-y-1">
      {SNAKE_ROWS.map((row, ri) => (
        <div key={ri} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {row.map((pos) => {
            const sq = MARATHON_BOARD[pos];
            const typeInfo = MARATHON_SQUARE_TYPES[sq.type] || MARATHON_SQUARE_TYPES.dead;
            const here = players.filter((p) => p.position === pos);
            return (
              <div
                key={pos}
                className={cn(
                  'aspect-square rounded-sm border border-border/40 flex flex-col items-center justify-center p-0.5 relative',
                  typeInfo.color
                )}
                title={sq.name}
              >
                <div className={cn('font-bold text-center leading-tight truncate w-full', textSize)}>
                  {pos + 1}
                </div>
                <div className={iconSize}>{typeInfo.icon}</div>
                <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5">
                  {here.map((p) => (
                    <div
                      key={p.id}
                      className={cn('rounded-full border border-border', markerSize)}
                      style={{ backgroundColor: getPlayerColor(p.id) }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}