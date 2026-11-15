import React, { useEffect, useState } from 'react';

export default function Extra4TVOverlay({ state }) {
  const extra4 = state?.extra4 || {};
  const status = extra4.control?.status;
  const card = extra4.cards?.activeCard;
  const activity = extra4.activity?.active?.status === 'active' ? extra4.activity.active : null;
  const feed = extra4.liveFeed;
  const scene = extra4.scenes?.current;
  const [replay, setReplay] = useState(false);
  useEffect(() => {
    if (!extra4.scenes?.replayAt) return undefined;
    setReplay(true);
    const timeout = setTimeout(() => setReplay(false), 1800);
    return () => clearTimeout(timeout);
  }, [extra4.scenes?.replayAt]);

  return <>
    {status === 'emergency' && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-red-950/95 p-6 text-center">
        <div className="max-w-3xl space-y-4">
          <div className="font-heading text-5xl sm:text-7xl text-white">EMERGENCY STOP</div>
          <div className="font-heading text-2xl text-red-200">Η ΕΚΠΟΜΠΗ ΔΙΑΚΟΠΗΚΕ</div>
          <div className="text-base text-white/80">Αναμονή απόφασης Director στο Master Control Room.</div>
        </div>
      </div>
    )}
    {scene && status !== 'emergency' && <div className="fixed top-4 left-1/2 z-[88] -translate-x-1/2 rounded-lg border border-primary/50 bg-black/85 px-4 py-2 text-center text-xs text-primary">SCENE · {scene}{replay ? ' · REPLAY' : ''}</div>}
    {feed?.status === 'requested' && status !== 'emergency' && (
      <div className="fixed top-20 left-1/2 z-[95] -translate-x-1/2 rounded-xl border border-primary/60 bg-black/90 px-5 py-3 text-center text-sm text-primary">
        ISOLATION CHAMBER · ΑΝΑΜΟΝΗ ΣΥΝΑΙΝΕΣΗΣ
      </div>
    )}
    {activity && status !== 'emergency' && <div className="fixed bottom-4 left-1/2 z-[87] -translate-x-1/2 rounded-xl border border-primary/60 bg-black/90 px-5 py-3 text-center text-sm text-primary">ACTIVITY · {activity.label}{activity.result ? ` · ${activity.result.toUpperCase()}` : ''}</div>}
    {card && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-5">
        <div className="w-full max-w-3xl rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-2xl">
          <div className="text-5xl">{card.icon || '🎴'}</div>
          <div className="mt-3 font-heading text-3xl text-primary">{card.name}</div>
          <div className="mt-4 text-xl text-foreground">{card.desc || card.text || ''}</div>
        </div>
      </div>
    )}
  </>;
}
