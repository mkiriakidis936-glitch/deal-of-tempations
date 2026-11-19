import React from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import { MARATHON_STAGES } from '@/data/gameConfig';
import { cn } from '@/lib/utils';

export default function MarathonProtocol({ state }) {
  const currentStage = state.marathonStage || 1;
  const stageInfo = MARATHON_STAGES.find((s) => s.stage === currentStage) || MARATHON_STAGES[0];

  return (
    <ComicPanel className="bg-background text-foreground p-3">
      <div className="font-heading text-lg text-primary mb-2 text-center">🏆 MARATHON PROTOCOL</div>
      <div className="flex gap-1 mb-3">
        {MARATHON_STAGES.map((s) => (
          <div
            key={s.stage}
            className={cn(
              'flex-1 text-center text-xs font-bold py-1 rounded border-2 border-primary font-body',
              s.stage === currentStage ? 'bg-primary text-tarot-dark comic-pulse' : s.stage < currentStage ? 'bg-tarot-forest text-foreground' : 'bg-background/30 text-foreground/50'
            )}
          >
            {s.stage}. {s.name}
          </div>
        ))}
      </div>
      <div className="text-center text-sm mb-2">
        <div className="font-heading text-primary">{stageInfo.name}</div>
        <div className="text-xs text-foreground/70 font-body">{stageInfo.desc}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="comic-panel-sm p-2 bg-destructive text-center">
          <div className="font-heading text-sm text-tarot-gold">💖 ALPHA</div>
          <div className="text-lg text-foreground">${state.teamAlpha?.loot?.toLocaleString() || 0}</div>
          <div className="text-xs text-foreground/80">⭐ {state.teamAlpha?.stars || 0}</div>
        </div>
        <div className="comic-panel-sm p-2 bg-tarot-teal text-center">
          <div className="font-heading text-sm text-tarot-gold">💎 BETA</div>
          <div className="text-lg text-foreground">${state.teamBeta?.loot?.toLocaleString() || 0}</div>
          <div className="text-xs text-foreground/80">⭐ {state.teamBeta?.stars || 0}</div>
        </div>
      </div>
    </ComicPanel>
  );
}