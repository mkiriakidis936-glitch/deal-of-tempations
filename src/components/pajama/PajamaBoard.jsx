import React from 'react';
import { PAJAMA_BOARD, PAJAMA_NIGHT_LENGTH } from '@/data/pajamaBoard';
import PajamaBoardSquare from '@/components/pajama/PajamaBoardSquare';

const COLS = 11;

function rowsOf(list) {
  const rows = [];
  for (let i = 0; i < list.length; i += COLS) rows.push(list.slice(i, i + COLS));
  return rows;
}

function Zone({ label, hint, rows, offset, players, positions, currentId, tone }) {
  return (
    <div
      className={`rounded-xl border p-2 space-y-1.5 ${
        tone === 'night'
          ? 'border-indigo-400/40 bg-indigo-950/40'
          : 'border-amber-400/50 bg-amber-950/30'
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className={`font-heading text-[11px] tracking-widest ${tone === 'night' ? 'text-indigo-200' : 'text-amber-200'}`}>
          {label}
        </span>
        <span className="text-[9px] text-pink-300/60">{hint}</span>
      </div>
      {rows.map((row, r) => {
        const rowIndex = offset + r;
        const ltr = rowIndex % 2 === 0;
        return (
          <div key={rowIndex} className={`flex gap-1 ${ltr ? '' : 'flex-row-reverse'}`}>
            {row.map((sq) => (
              <div key={sq.index} className="flex-1 min-w-0">
                <PajamaBoardSquare
                  square={sq}
                  tokens={players.filter((p) => (positions[p.id] || 0) === sq.index)}
                  isCurrent={(positions[currentId] || 0) === sq.index && !!currentId}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function PajamaBoard({ players, pj, currentPlayer, onRoll }) {
  const positions = pj.positions || {};
  const night = PAJAMA_BOARD.slice(0, PAJAMA_NIGHT_LENGTH);
  const morning = PAJAMA_BOARD.slice(PAJAMA_NIGHT_LENGTH);
  const nightRows = rowsOf(night);
  const rolled = pj.lastRoll;

  return (
    <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs text-pink-300">
        <span className="font-heading text-sm text-pink-100">🗺️ ΤΟ ΤΑΜΠΛΟ · 44 ΤΕΤΡΑΓΩΝΑ</span>
        <span className="text-right">
          {rolled
            ? `🎲 ${rolled.name}: ${rolled.d1}+${rolled.d2}=${rolled.dice} → #${rolled.to + 1}`
            : `Σειρά: ${currentPlayer?.name || '—'}`}
        </span>
      </div>

      <div className="text-[10px] text-yellow-200/80">🏁 Το τετράγωνο 44 τερματίζει το ταμπλό — +5 στην παίκτρια που φτάνει πρώτη.</div>

      <div className="overflow-x-auto">
        <div className="min-w-[620px] space-y-2">
          <Zone
            label="🌙 ΝΥΧΤΕΡΙΝΗ ΖΩΝΗ"
            hint="τετράγωνα 1–22"
            rows={nightRows}
            offset={0}
            players={players}
            positions={positions}
            currentId={currentPlayer?.id}
            tone="night"
          />
          <Zone
            label="☀️ ΠΡΩΙΝΗ ΖΩΝΗ"
            hint="τετράγωνα 23–44"
            rows={rowsOf(morning)}
            offset={nightRows.length}
            players={players}
            positions={positions}
            currentId={currentPlayer?.id}
            tone="morning"
          />
        </div>
      </div>

      <div className="rounded-lg border border-pink-500/30 bg-pink-950/40 p-2 space-y-1.5">
        <div className="text-[10px] uppercase tracking-widest text-pink-300">Πορεία παικτριών</div>
        {players.map((p) => {
          const pos = positions[p.id] || 0;
          const inMorning = pos >= PAJAMA_NIGHT_LENGTH;
          const pct = Math.round(((pos + 1) / PAJAMA_BOARD.length) * 100);
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-16 truncate text-[11px] text-pink-100">{p.name}</span>
              <div className="flex-1 h-2 rounded bg-pink-900/60 overflow-hidden">
                <div className={`h-full ${inMorning ? 'bg-amber-400' : 'bg-fuchsia-400'}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-16 text-right text-[10px] text-pink-300">
                #{pos + 1} {inMorning ? '☀️' : '🌙'}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onRoll}
        disabled={!!pj.activeCard}
        className="w-full py-3 rounded-lg font-heading text-lg bg-pink-600 text-white disabled:opacity-40"
      >
        🎲 ΡΙΞΕ ΤΑ ΖΑΡΙΑ
      </button>
    </div>
  );
}