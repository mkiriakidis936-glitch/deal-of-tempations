import React, { useState } from 'react';
import { BOARD, SQUARE_TYPES } from '@/data/gameConfig';
import { getSquareChallenge } from '@/data/squareChallenges';
import { WARRANT_CARDS, GLITCH_CARDS, BLACK_MARKET_OPTIONS, STREET_TRUTHS, STREET_DARES } from '@/data/gameContent';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';

const FROM = 1;
const TO = 24;

function poolFor(type) {
  if (type === 'warrant') return WARRANT_CARDS.map((c) => ({ name: `${c.icon || ''} ${c.name}`.trim(), text: c.desc }));
  if (type === 'glitch') return GLITCH_CARDS.map((c) => ({ name: `${c.icon || ''} ${c.name}`.trim(), text: c.desc }));
  if (type === 'blackmarket') return BLACK_MARKET_OPTIONS.map((c) => ({ name: `${c.icon || ''} ${c.name}`, text: `${c.cost} — ${c.desc}` }));
  if (type === 'street') {
    return [
      ...STREET_TRUTHS.map((c) => ({ name: `💬 ${c.name}`, text: c.text })),
      ...STREET_DARES.map((c) => ({ name: `🔥 ${c.name}`, text: c.text })),
    ];
  }
  return [];
}

function SquareRow({ square }) {
  const [open, setOpen] = useState(false);
  const meta = SQUARE_TYPES[square.type] || SQUARE_TYPES.street;
  const fixed = getSquareChallenge(square.position);
  const pool = poolFor(square.type);

  return (
    <ComicPanel variant="sm" className={fixed ? 'border-primary' : undefined}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-lg text-primary">#{square.position}</span>
            <span className="font-heading text-base">{square.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border border-border bg-secondary">
              {meta.icon} {meta.label}
            </span>
            {fixed && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                {fixed.type === 'truth' ? '💬 Μόνιμη Αλήθεια' : '🔥 Μόνιμη Τόλμη'}
              </span>
            )}
          </div>
          <div className="text-xs text-foreground/70 mt-1">{meta.desc}</div>
        </div>
        {pool.length > 0 && (
          <ComicButton variant="white" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? '✕' : `📚 ${pool.length}`}
          </ComicButton>
        )}
      </div>

      {fixed ? (
        <div className="mt-2 rounded-md border border-border bg-background/60 p-2">
          <div className="font-heading text-sm text-primary">{fixed.title}</div>
          <div className="text-sm text-foreground/90">{fixed.text}</div>
          {fixed.duration ? <div className="text-xs text-foreground/60 mt-1">⏱️ {fixed.duration}″</div> : null}
        </div>
      ) : square.type === 'street' ? (
        <div className="text-xs text-foreground/60 mt-2">
          Τυχαία κλήρωση: {STREET_TRUTHS.length} Αλήθειες + {STREET_DARES.length} Τόλμες
        </div>
      ) : null}

      {open && (
        <div className="mt-2 space-y-1 max-h-72 overflow-y-auto pr-1">
          {pool.map((item, i) => (
            <div key={i} className="text-xs border-b border-border/40 pb-1">
              <span className="font-bold text-primary">{item.name}</span>
              <div className="text-foreground/80">{item.text}</div>
            </div>
          ))}
        </div>
      )}
    </ComicPanel>
  );
}

export default function AdminBoardSquares() {
  const squares = BOARD.filter((sq) => sq.position >= FROM && sq.position <= TO);
  const counts = squares.reduce((acc, sq) => ({ ...acc, [sq.type]: (acc[sq.type] || 0) + 1 }), {});
  const fixedCount = squares.filter((sq) => getSquareChallenge(sq.position)).length;

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-secondary">
        <div className="font-heading text-xl text-primary">🗺️ ΤΑΜΠΛΟ — ΚΟΥΤΙΑ {FROM} ΕΩΣ {TO}</div>
        <div className="flex flex-wrap gap-2 mt-2 text-xs font-bold">
          {Object.entries(counts).map(([type, n]) => (
            <span key={type} className="px-2 py-1 rounded border border-border bg-card">
              {SQUARE_TYPES[type]?.icon} {SQUARE_TYPES[type]?.label}: {n}
            </span>
          ))}
          <span className="px-2 py-1 rounded border border-primary bg-card text-primary">📌 Μόνιμες προκλήσεις: {fixedCount}</span>
        </div>
      </ComicPanel>

      <div className="grid gap-2 md:grid-cols-2">
        {squares.map((sq) => <SquareRow key={sq.position} square={sq} />)}
      </div>
    </div>
  );
}