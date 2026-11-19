import React, { useEffect, useState } from 'react';

export default function ShowModeTV({ state }) {
  const showMode = state.showMode;
  const [transitionVisible, setTransitionVisible] = useState(false);

  // Auto-hide transition after 4 seconds (TV-side, no state change needed)
  useEffect(() => {
    if (showMode?.transition?.active) {
      setTransitionVisible(true);
      const timer = setTimeout(() => setTransitionVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showMode?.transition?.timestamp]);

  if (!showMode) return null;

  const transition = showMode.transition;
  const reveal = showMode.reveal;

  if (transition?.active && transitionVisible) {
    return (
      <div className="fixed inset-0 z-[65] flex flex-col items-center justify-center bg-background animate-fade-up">
        <div className="cinv-sealglow absolute" style={{ width: 600, height: 600 }} />
        <div className="relative text-6xl opacity-70">{transition.icon || '🎬'}</div>
        <div className="ds-eyebrow relative mt-6 text-primary/70">Πράξη</div>
        <h1 className="ds-title relative mt-4 max-w-3xl px-4 text-center text-5xl sm:text-6xl">
          {transition.actName}
        </h1>
        <div className="relative mt-4 font-body text-xl italic text-foreground/55">{transition.subtitle}</div>
        <div className="relative mt-10 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1 w-8 rounded-full bg-primary/30"
              style={{ animation: `comic-pulse 3.2s ease-in-out ${i * 0.3}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (reveal?.active) {
    const isBuildup = reveal.phase === 'buildup';
    return (
      <div className="fixed inset-0 z-[65] flex flex-col items-center justify-center bg-background">
        {isBuildup ? (
          <div className="text-center animate-fade-up">
            <div className="ds-eyebrow text-primary/70">{reveal.title}</div>
            <div className="mt-8 text-5xl tracking-[0.4em] text-primary/40">···</div>
            <div className="ds-lede mt-8 text-sm italic">Η αποκάλυψη πλησιάζει</div>
          </div>
        ) : (
          <div className="text-center animate-fade-up">
            <div className="ds-eyebrow text-primary/70">{reveal.title}</div>
            <div className="ds-rule mx-auto mt-6 w-28" />
            {reveal.content && (
              <div className="ds-title mt-8 max-w-3xl px-4 text-5xl">
                {reveal.content}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}