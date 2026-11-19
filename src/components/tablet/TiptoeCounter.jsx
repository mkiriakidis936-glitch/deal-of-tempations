import React, { useState, useEffect, useRef } from 'react';
import ComicButton from '@/components/comic/ComicButton';

// EP-02: Suspended Tiptoe Toe-Tie — heel touch adds tickle time
export default function TiptoeCounter({ duration, ultra = false, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [heelTouches, setHeelTouches] = useState(0);
  const [flash, setFlash] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!frozen && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) { clearInterval(intervalRef.current); onComplete?.({ heelTouches }); return 0; }
          return p - 0.1;
        });
      }, 100);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [frozen]);

  function handleHeel() {
    const add = ultra ? 15 : 10;
    setRemaining((p) => p + add);
    setHeelTouches((h) => h + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }

  const pct = (remaining / duration) * 100;

  return (
    <div className="text-center space-y-3">
      <div className={`font-heading text-6xl ${flash ? 'text-destructive comic-pulse' : 'text-foreground'}`}>
        {Math.ceil(remaining)}″
      </div>
      <div className="w-full h-3 bg-background/10 rounded-full border-2 border-border overflow-hidden">
        <div className={`h-full ${flash ? 'bg-destructive' : 'bg-primary'} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="text-sm font-bold">🦶 Φτέρνες που ακούμπησαν: {heelTouches}</div>
      <ComicButton variant="red" size="sm" onClick={handleHeel} disabled={frozen}>
        🦶 ΑΚΟΥΜΠΗΣΕ ΦΤΕΡΝΑ (+{ultra ? 15 : 10}″)
      </ComicButton>
      <div className="text-xs text-foreground/60">
        {ultra ? 'ULTRA: +15″ και 2 φίλες γαργαλάνε ταυτόχρονα' : '+10″ γαργαλήματος στις πατούσες'}
      </div>
    </div>
  );
}