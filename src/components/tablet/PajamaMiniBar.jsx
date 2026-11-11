import React from 'react';

export default function PajamaMiniBar({ paused, onQR, onTogglePause, onEnd }) {
  return (
    <div className="fixed bottom-3 right-3 z-[95] flex flex-col gap-1.5 items-end">
      <button
        onClick={onQR}
        className="px-3 py-2 rounded-xl font-heading text-xs bg-slate-900/90 border border-pink-400/60 text-pink-100"
      >
        📷 QR
      </button>
      <button
        onClick={onTogglePause}
        className={`px-3 py-2 rounded-xl font-heading text-xs border ${
          paused
            ? 'bg-emerald-600 border-emerald-300 text-white'
            : 'bg-amber-500 border-amber-300 text-slate-900'
        }`}
      >
        {paused ? '▶ ΣΥΝΕΧΕΙΑ' : '⏸ ΠΑΥΣΗ'}
      </button>
      <button
        onClick={onEnd}
        className="px-3 py-2 rounded-xl font-heading text-xs bg-rose-900 border border-rose-400 text-rose-100"
      >
        ⏹ ΕΞΟΔΟΣ
      </button>
    </div>
  );
}