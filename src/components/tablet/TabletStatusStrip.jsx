import React from 'react';
import { calculateMostWanted, getWantedLevel } from '@/lib/gameLogic';

export default function TabletStatusStrip({ state }) {
  const mostWanted = state.players?.length ? calculateMostWanted(state.players) : null;
  const wantedLevel = mostWanted ? getWantedLevel(mostWanted) : 0;
  const stageNames = ['Setup', 'Περιπολία', 'Ανάκριση', 'Φινάλε'];
  const stageName = stageNames[state.stage] || '—';
  const currentPlayer = state.players?.[state.currentPlayerIndex];

  return (
    <div className="fixed top-3 max-sm:left-3 max-sm:right-[108px] z-40 flex items-center gap-2 overflow-x-auto rounded-full border border-primary/25 bg-surface-1/90 px-3 py-2 shadow-raised backdrop-blur whitespace-nowrap [scrollbar-width:none] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:gap-3 sm:px-4 sm:py-1.5">
      <span className="ds-label text-primary/85">{stageName}</span>
      <span className="h-3 w-px bg-primary/25" />
      <span className="ds-value text-xs">
        <span className="text-muted-foreground">ΚΑΤΑΖΗΤΗΣΗ </span>{wantedLevel}/5
      </span>
      {state.round > 0 && (
        <>
          <span className="h-3 w-px bg-primary/25" />
          <span className="ds-value text-xs">
            <span className="text-muted-foreground">ΓΥΡΟΣ </span>{state.round}
          </span>
        </>
      )}
      {currentPlayer && (
        <>
          <span className="h-3 w-px bg-primary/25" />
          <span className="ds-value text-xs">{currentPlayer.name}</span>
        </>
      )}
    </div>
  );
}