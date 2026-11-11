import React from 'react';
import MonopolyBoard from '@/components/tv/MonopolyBoard';
import MarathonBoardTV from '@/components/tv/MarathonBoardTV';

// Memoized board panel για TV — δεν ξαναζωγραφίζεται αν δεν άλλαξαν θέσεις παικτριών.
function TVBoardPanel({ mode, players, large }) {
  const isMarathon = mode === 'marathon';
  return (
    <div className={`comic-panel bg-card p-4 ${large ? 'max-w-5xl' : 'max-w-3xl'} w-full`}>
      <div className="font-heading text-2xl text-primary mb-2 text-center">
        {isMarathon ? '🗺️ ΨΗΦΙΑΚΟ ΦΙΔΑΚΙ — 80 ΚΟΥΤΙΑ' : '🗺️ ΧΑΡΤΗΣ 44 ΚΟΥΤΙΩΝ'}
      </div>
      <div className="flex justify-center">
        {isMarathon ? (
          <MarathonBoardTV players={players} large={large} />
        ) : (
          <MonopolyBoard players={players} large={large} />
        )}
      </div>
    </div>
  );
}

function layoutKey(players) {
  return (players || []).map((p) => `${p.id}:${p.position}`).join('|');
}

export default React.memo(
  TVBoardPanel,
  (a, b) => a.mode === b.mode && a.large === b.large && layoutKey(a.players) === layoutKey(b.players)
);