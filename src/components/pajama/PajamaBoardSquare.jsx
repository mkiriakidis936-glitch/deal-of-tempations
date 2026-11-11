import React from 'react';
import { SQUARE_META } from '@/data/pajamaBoard';

const STYLES = {
  pink: 'bg-pink-500/25 border-pink-400/50',
  purple: 'bg-purple-500/25 border-purple-400/50',
  neon: 'bg-fuchsia-500/35 border-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.5)]',
  yellow: 'bg-amber-400/25 border-amber-300/70',
  amber: 'bg-amber-600/30 border-amber-300/60',
  gold: 'bg-yellow-300/80 border-yellow-100 shadow-[0_0_14px_rgba(250,204,21,0.8)]',
};

export default function PajamaBoardSquare({ square, tokens, isCurrent }) {
  const meta = SQUARE_META[square.type] || SQUARE_META.nails;

  return (
    <div
      className={`relative aspect-square rounded-md border flex items-center justify-center ${
        STYLES[meta.color] || STYLES.pink
      } ${isCurrent ? 'ring-2 ring-pink-200' : ''}`}
      title={`${square.index + 1} · ${meta.label}`}
    >
      <span className="absolute top-0 left-1 text-[8px] text-pink-100/60">{square.index + 1}</span>
      <span className="text-sm leading-none">{meta.icon}</span>
      {tokens.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
          {tokens.map((t) => (
            <span key={t.id} className="text-[8px] font-bold bg-pink-100 text-pink-950 rounded px-0.5 leading-tight">
              {t.name.slice(0, 1)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}