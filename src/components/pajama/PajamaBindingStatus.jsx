import React from 'react';

export default function PajamaBindingStatus({ bindings, players, onUnbind }) {
  const entries = Object.entries(bindings || {});
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-pink-500/40 bg-pink-950/60 p-2">
      <div className="font-heading text-xs text-pink-200 mb-1">⛓️ ΔΕΣΙΜΑΤΑ ΣΕ ΙΣΧΥ</div>
      <div className="space-y-1">
        {entries.map(([id, b]) => {
          const player = (players || []).find((p) => p.id === id);
          return (
            <div key={id} className="flex items-center justify-between gap-2 text-xs">
              <span>
                <b className="text-pink-100">{player?.name || '—'}</b> · {b.label}
                {b.untilRound ? ` · μέχρι τέλος γύρου ${b.untilRound}` : ''}
              </span>
              {onUnbind && (
                <button
                  onClick={() => onUnbind(id)}
                  className="px-2 py-0.5 rounded bg-pink-800 text-pink-100 font-heading text-[10px]"
                >
                  ΑΠΟΔΕΣΜΟΣ
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}