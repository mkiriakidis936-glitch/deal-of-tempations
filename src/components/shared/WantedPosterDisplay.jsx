import React from 'react';
import { getPlayerColor } from '@/components/shared/BoardView';

export default function WantedPosterDisplay({ player, state }) {
  if (!player) return null;
  const crimes = (state?.history || [])
    .filter((e) => e.player === player.name || e.target === player.name)
    .slice(0, 4)
    .map((e) => e.type || e.detail || 'Αδίκημα')
    .map((t) => String(t).replace(/_/g, ' '));

  return (
    <div className="bg-tarot-parchment border-4 border-border p-4 font-body" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 2px, transparent 2px)', backgroundSize: '14px 14px' }}>
      <div className="text-center border-b-4 border-border pb-2 mb-3">
        <div className="font-heading text-4xl tracking-wider" style={{ WebkitTextStroke: '2px #5C0A1E', color: '#c9a227' }}>
          ΚΑΤΑΖΗΤΕΙΤΑΙ
        </div>
        <div className="text-xs font-bold mt-1 text-tarot-dark font-body">ΝΕΚΡΗ Ή ΓΑΡΓΑΛΗΣΤΗ</div>
      </div>
      <div className="flex justify-center mb-3">
        <div
          className="w-24 h-24 rounded-full border-4 border-border flex items-center justify-center font-heading text-5xl text-white"
          style={{ backgroundColor: getPlayerColor(player.id) }}
        >
          {player.name?.charAt(0)?.toUpperCase()}
        </div>
      </div>
      <div className="text-center mb-3">
        <div className="font-heading text-2xl text-tarot-dark">{player.name?.toUpperCase()}</div>
        <div className="text-sm font-bold text-tarot-dark font-body">Επικήρυξη: ${(player.bounty || 0).toLocaleString()}</div>
      </div>
      {crimes.length > 0 && (
        <div className="border-t-2 border-border pt-2">
          <div className="text-xs font-bold uppercase mb-1 text-tarot-dark font-body">Κατηγορίες:</div>
          <ul className="text-xs space-y-0.5 text-tarot-dark font-body">
            {crimes.map((c, i) => (
              <li key={i} className="flex items-start gap-1">
                <span>•</span><span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="text-center mt-3 text-xs font-bold border-t-2 border-border pt-2 text-tarot-dark font-body">
        Ποινή: {player.penaltyStep || 0}/7 · Footwear: {player.footwearLevel ?? '—'}
      </div>
    </div>
  );
}