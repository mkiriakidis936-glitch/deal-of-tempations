import React, { useState, useEffect, useRef } from 'react';
import ComicButton from '@/components/comic/ComicButton';
import { cn } from '@/lib/utils';

// Tiptoe Suspense: στάση στις μύτες. Αν ακουμπήσει φτέρνα, +10″ γαργαλήματος.
export default function TiptoeSuspense({ duration = 30, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [penaltyTime, setPenaltyTime] = useState(0);
  const [heelsTouched, setHeelsTouched] = useState(0);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!frozen && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) {
            clearInterval(intervalRef.current);
            onCompleteRef.current?.({ heelsTouched, penaltyTime });
            return 0;
          }
          return p - 0.1;
        });
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [frozen, remaining <= 0]);

  function handleHeels() {
    setHeelsTouched((h) => h + 1);
    setPenaltyTime((t) => t + 10);
    setRemaining((r) => r + 10);
  }

  const pct = duration > 0 ? Math.min(100, (remaining / (duration + penaltyTime)) * 100) : 0;

  return (
    <div className="text-center">
      <div className="font-heading text-2xl mb-2">🩰 TIPTOE SUSPENSE</div>
      <div className="text-sm mb-3 text-foreground/70">Στάση στις μύτες! Αν ακουμπήσουν φτέρνες → +10″ γαργαλήματος.</div>
      <div className={cn('font-heading text-6xl mb-2', remaining <= 10 ? 'text-destructive comic-pulse' : 'text-foreground')}>
        {Math.ceil(remaining)}″
      </div>
      <div className="w-full h-4 bg-background/10 rounded-full overflow-hidden border-2 border-border mb-3">
        <div className={cn('h-full transition-all', remaining <= 10 ? 'bg-destructive' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-sm font-bold mb-3">
        Φτέρνες ακούμπησαν: {heelsTouched}× | Μπόνους χρόνος: +{penaltyTime}″
      </div>
      <ComicButton variant="red" size="lg" onClick={handleHeels} disabled={frozen || remaining <= 0}>
        🦶 ΦΤΕΡΝΕΣ ΑΚΟΥΜΠΗΣΑΝ (+10″)
      </ComicButton>
      {frozen && <div className="text-destructive font-bold mt-2 comic-pulse">⏸ ΠΑΥΣΗ</div>}
    </div>
  );
}