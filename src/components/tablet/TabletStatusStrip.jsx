import React from 'react';
import { calculateMostWanted, getWantedLevel } from '@/lib/gameLogic';

export default function TabletStatusStrip({ state }) {
  const mostWanted = state.players?.length ? calculateMostWanted(state.players) : null;
  const wantedLevel = mostWanted ? getWantedLevel(mostWanted) : 0;
  const stageNames = ['Setup', 'Περιπολία', 'Ανάκριση', 'Φινάλε'];
  const stageName = stageNames[state.stage] || '—';
  const currentPlayer = state.players?.[state.currentPlayerIndex];

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-primary/25 bg-surface-1/90 px-4 py-1.5 shadow-raised backdrop-blur whitespace-nowrap">
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
      {state.testMode && (
        <span className="ds-label rounded-full border border-primary/40 px-2 py-0.5 text-primary">ΔΟΚΙΜΗ</span>
      )}
    </div>
  );
}