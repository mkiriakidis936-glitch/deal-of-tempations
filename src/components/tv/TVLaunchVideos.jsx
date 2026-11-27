import React, { useEffect, useRef, useState } from 'react';

export default function TVLaunchVideos({ sessionCode, welcomeSrc, countdownSrc, countdownStartedAt, openingSrcs = [] }) {
  const opening = [welcomeSrc, ...openingSrcs].filter(Boolean);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState('idle');
  const [countdownPlayedFor, setCountdownPlayedFor] = useState(null);
  const [pendingCountdown, setPendingCountdown] = useState(false);
  const [welcomeCompletedFor, setWelcomeCompletedFor] = useState(null);

  useEffect(() => {
    if (!sessionCode) return;
    setActive(opening.length ? 'welcome' : 'idle');
    setStep(0);
    setCountdownPlayedFor(null);
    setPendingCountdown(false);
    setWelcomeCompletedFor(null);
  }, [sessionCode, welcomeSrc, opening.length]);

  useEffect(() => {
    if (!countdownStartedAt || !countdownSrc || countdownPlayedFor === countdownStartedAt) return;
    setCountdownPlayedFor(countdownStartedAt);
    if (opening.length && welcomeCompletedFor !== sessionCode) setPendingCountdown(true);
    else setActive('countdown');
  }, [countdownStartedAt, countdownSrc, welcomeSrc, countdownPlayedFor, welcomeCompletedFor, sessionCode]);

  const finish = () => {
    if (active === 'welcome') {
      if (step + 1 < opening.length) { setStep(step + 1); return; }
      setWelcomeCompletedFor(sessionCode);
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

  const src = active === 'welcome' ? opening[step] : active === 'countdown' ? countdownSrc : '';
  const videoRef = useRef(null);
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Ξεκινά με ήχο· αν ο browser το μπλοκάρει, παίζει σε σίγαση. Αν δεν ξεκινήσει σε 12″, κλείνει μόνο του για να μην κολλήσει η TV.
  useEffect(() => {
    const video = videoRef.current;
    if (!src || !video) return undefined;
    let started = false;
    const onPlaying = () => { started = true; };
    video.addEventListener('playing', onPlaying);
    video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
    const guard = setTimeout(() => { if (!started) finishRef.current(); }, 12000);
    return () => { clearTimeout(guard); video.removeEventListener('playing', onPlaying); };
  }, [src, active, step]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black" onClick={finish}>
      <video
        key={active + step + src}
        ref={videoRef}
        src={src}
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
