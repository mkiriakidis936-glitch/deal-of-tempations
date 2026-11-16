import React, { useEffect, useState } from 'react';

export default function TVLaunchVideos({ sessionCode, welcomeSrc, countdownSrc, countdownStartedAt }) {
  const [active, setActive] = useState('idle');
  const [welcomedSession, setWelcomedSession] = useState('');
  const [countdownPlayedFor, setCountdownPlayedFor] = useState(null);
  const [pendingCountdown, setPendingCountdown] = useState(false);

  useEffect(() => {
    if (!sessionCode) return;
    if (welcomeSrc && welcomedSession !== sessionCode) setActive('welcome');
    else setActive('idle');
  }, [sessionCode, welcomeSrc, welcomedSession]);

  useEffect(() => {
    if (!countdownStartedAt || !countdownSrc || countdownPlayedFor === countdownStartedAt) return;
    setCountdownPlayedFor(countdownStartedAt);
    const welcomeMustPlay = Boolean(welcomeSrc && welcomedSession !== sessionCode);
    if (welcomeMustPlay) setPendingCountdown(true);
    else setActive('countdown');
  }, [countdownStartedAt, countdownSrc, welcomeSrc, welcomedSession, sessionCode, countdownPlayedFor]);

  const finish = () => {
    if (active === 'welcome') {
      setWelcomedSession(sessionCode);
      if (pendingCountdown && countdownSrc) {
        setPendingCountdown(false);
        setActive('countdown');
      } else {
        setActive('idle');
      }
      return;
    }
    if (active === 'countdown') setActive('idle');
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
