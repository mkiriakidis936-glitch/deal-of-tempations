import React, { useEffect, useState } from 'react';

export default function TVLaunchVideos({ sessionCode, welcomeSrc, countdownSrc, introStartedAt, onCountdownComplete }) {
  const [active, setActive] = useState('idle');
  const [welcomedSession, setWelcomedSession] = useState('');
  const [countdownPlayedFor, setCountdownPlayedFor] = useState(null);

  useEffect(() => {
    if (!sessionCode) return;
    if (welcomeSrc && welcomedSession !== sessionCode) setActive('welcome');
    else setActive('idle');
  }, [sessionCode, welcomeSrc, welcomedSession]);

  useEffect(() => {
    if (!introStartedAt || !countdownSrc || countdownPlayedFor === introStartedAt) return;
    setCountdownPlayedFor(introStartedAt);
    setActive('countdown');
  }, [introStartedAt, countdownSrc, countdownPlayedFor]);

  const finish = () => {
    if (active === 'welcome') setWelcomedSession(sessionCode);
    if (active === 'countdown') onCountdownComplete?.();
    setActive('idle');
  };

  const src = active === 'welcome' ? welcomeSrc : active === 'countdown' ? countdownSrc : '';
  if (!src) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black" onClick={finish}>
      <video
        key={active + src}
        src={src}
        autoPlay
        playsInline
        controls
        preload="auto"
        className="h-full w-full object-contain"
        onEnded={finish}
        onError={finish}
        onClick={(event) => event.stopPropagation()}
      />
      <button
        type="button"
        onClick={finish}
        className="absolute right-5 top-5 rounded-full border border-white/30 bg-black/70 px-4 py-2 text-sm font-bold text-white"
      >
        Παράλειψη
      </button>
    </div>
  );
}
