import React, { useState, useEffect, useRef } from 'react';
import ComicButton from '@/components/comic/ComicButton';

// EP-09: Spread-Eagle Floor — fake TikTok live with viewer count
export default function SpreadEagleLive({ duration, ultra = false, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [viewers, setViewers] = useState(1337);
  const [hearts, setHearts] = useState(0);
  const [paused, setPaused] = useState(false);
  const [moves, setMoves] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!frozen && remaining > 0 && !paused) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) { clearInterval(intervalRef.current); onComplete?.({ moves }); return 0; }
          return p - 0.1;
        });
      }, 100);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [frozen, paused]);

  useEffect(() => {
    const iv = setInterval(() => {
      setViewers((v) => v + Math.floor(Math.random() * 7) - 2);
      setHearts((h) => h + Math.floor(Math.random() * 15));
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  function handleMove() {
    setMoves((m) => m + 1);
    setPaused(true);
    setTimeout(() => setPaused(false), ultra ? 15000 : 5000);
  }

  return (
    <div className="text-center space-y-3">
      <div className="comic-panel-sm p-3 bg-background text-foreground">
        <div className="flex items-center justify-between text-xs">
          <span className="bg-destructive px-2 py-0.5 rounded-full font-bold comic-pulse">● LIVE</span>
          <span>👁 {viewers.toLocaleString()}</span>
          <span>❤️ {hearts.toLocaleString()}</span>
        </div>
        <div className="font-heading text-3xl text-primary mt-2">@temptation_live</div>
        <div className="text-xs text-foreground/60">Spread-Eagle Challenge 🦅</div>
      </div>
      <div className={`font-heading text-5xl ${paused ? 'text-destructive comic-pulse' : 'text-foreground'}`}>
        {Math.ceil(remaining)}″
      </div>
      {paused && <div className="font-bold text-destructive comic-pulse">⏸ LIVE PAUSED — {ultra ? '15' : '5'}″</div>}
      <div className="text-sm font-bold">Κινήσεις: {moves}</div>
      <ComicButton variant="red" size="sm" onClick={handleMove} disabled={frozen}>
        ❌ ΚΙΝΗΘΗΚΕ (+{ultra ? 2 : 1})
      </ComicButton>
    </div>
  );
}