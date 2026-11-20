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

export default function MarathonBoardView({ players = [], compact = false, highlightPosition }) {
  return (
    <div className="space-y-1">
      {SNAKE_ROWS.map((row, ri) => (
        <div key={ri} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {row.map((pos) => {
            const sq = MARATHON_BOARD[pos];
            const typeInfo = MARATHON_SQUARE_TYPES[sq.type] || MARATHON_SQUARE_TYPES.dead;
            const here = players.filter((p) => p.position === pos);
            const isHighlight = highlightPosition === pos;
            return (
              <div
                key={pos}
                className={cn(
                  'aspect-square border-2 rounded-md relative flex flex-col items-center justify-center',
                  typeInfo.color,
                  isHighlight && 'ring-2 ring-primary comic-pulse',
                  sq.position === 0 && 'ring-1 ring-tarot-forest',
                  sq.position === 79 && 'ring-2 ring-primary'
                )}
              >
                <span className="absolute top-0 left-0.5 text-[7px] sm:text-[9px] font-bold text-foreground/60">
                  {pos + 1}
                </span>
                <span className={cn(compact ? 'text-xs' : 'text-sm sm:text-lg')}>
                  {typeInfo.icon}
                </span>
                {here.length > 0 && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex flex-wrap gap-0.5 justify-center">
                    {here.map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          'rounded-full border border-border flex items-center justify-center text-[7px] font-bold text-white',
                          compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
                        )}
                        style={{ backgroundColor: getPlayerColor(p.id) }}
                        title={p.name}
                      >
                        {p.name?.charAt(0)?.toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}