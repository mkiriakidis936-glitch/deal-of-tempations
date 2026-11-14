import React from 'react';
import { BOARD, SQUARE_TYPES } from '@/data/gameConfig';
import { getPlayerColor } from '@/components/shared/BoardView';
import { cn } from '@/lib/utils';

export default function MonopolyBoard({ players = [], large = false, board = BOARD }) {
  const size = 12;
  const total = board.length;

  function getPos(i) {
    const bottom = size;
    const right = size - 1;
    const top = size - 1;
    const left = size - 2;
    if (i < bottom) return { row: size - 1, col: i };
    if (i < bottom + right) return { row: size - 2 - (i - bottom), col: size - 1 };
    if (i < bottom + right + top) return { row: 0, col: size - 2 - (i - bottom - right) };
    return { row: i - bottom - right - top + 1, col: 0 };
  }

  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  board.forEach((sq, i) => {
    const { row, col } = getPos(i);
    grid[row][col] = { ...sq, index: i };
  });

  const playersByPos = {};
  players.forEach((p) => {
    const pos = p.position % total;
    if (!playersByPos[pos]) playersByPos[pos] = [];
    playersByPos[pos].push(p);
  });

  const textSize = large ? 'text-xs' : 'text-[9px] sm:text-[10px]';
  const iconSize = large ? 'text-2xl' : 'text-lg';
  const markerSize = large ? 'w-4 h-4' : 'w-3 h-3';
  const markerMaxW = large ? 'max-w-[52px]' : 'max-w-[40px]';

  return (
    <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {grid.map((row, ri) =>
        row.map((cell, ci) => {
          if (!cell) return <div key={`${ri}-${ci}`} className="aspect-square bg-foreground/5 rounded-sm" />;
          const st = SQUARE_TYPES[cell.type] || SQUARE_TYPES.street;
          const here = playersByPos[cell.index] || [];
          return (
            <div
              key={`${ri}-${ci}`}
              className={cn('aspect-square rounded-sm border border-border/40 flex flex-col items-center justify-center p-0.5 relative', st.color)}
              title={cell.name}
            >
              <div className={cn('font-bold text-center leading-tight truncate w-full', textSize)}>{cell.name}</div>
              <div className={iconSize}>{st.icon}</div>
              <div className={cn('absolute -top-1 -right-1 flex flex-wrap gap-0.5', markerMaxW)}>
                {here.map((p) => (
                  <div key={p.id} className={cn('rounded-full border border-border', markerSize)} style={{ backgroundColor: getPlayerColor(p.id) }} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}