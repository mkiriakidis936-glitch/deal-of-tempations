import React from 'react';

export default function Extra4MobileCard({ state }) {
  const params = new URLSearchParams(window.location.search);
  const terminalCode = params.get('terminal');
  const playerId = params.get('player');
  const activityId = params.get('activity');
  const terminal = terminalCode ? state?.extra4?.cards?.terminals?.[terminalCode] : null;
  const activity = terminal?.active && terminal.playerId === playerId && terminal.activityId === activityId && activityId && state?.extra4?.activity?.active?.id === activityId
    ? state.extra4.activity.active
    : null;
  const card = state?.extra4?.cards?.activeCard;
  const activeActivity = state?.extra4?.activity?.active?.status === 'active' ? state.extra4.activity.active : null;
  const shownActivity = activity || activeActivity;
  if (!card && !shownActivity) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-3 right-3 z-[75] mx-auto max-w-md space-y-2">
      {shownActivity && <div className="rounded-xl border-2 border-primary bg-black/95 p-4 text-center shadow-2xl"><div className="text-[10px] tracking-widest text-primary">{activity ? 'ACTIVITY TERMINAL' : 'ACTIVE ACTIVITY'}</div><div className="mt-1 font-heading text-lg text-primary">{shownActivity.label}</div><div className="mt-1 text-xs text-white/70">{shownActivity.category}</div></div>}
      {card && <div className="rounded-xl border-2 border-primary bg-black/95 p-4 text-center shadow-2xl"><div className="text-3xl">{card.icon || '🎴'}</div><div className="mt-1 font-heading text-lg text-primary">{card.name}</div><div className="mt-2 text-sm text-white">{card.desc || card.text || ''}</div></div>}
    </div>
  );
}
