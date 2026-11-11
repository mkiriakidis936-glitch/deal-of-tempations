import React, { useState, useEffect, useRef } from 'react';
import DecibelMeter from '@/components/comic/DecibelMeter';
import { cn } from '@/lib/utils';

// Curse of Silence: απόλυτη ησυχία. Αν βγάλει ήχο → +10″ γαργαλήματος.
export default function CurseOfSilence({ duration = 45, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [penaltyTime, setPenaltyTime] = useState(0);
  const [violations, setViolations] = useState(0);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!frozen && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) {
            clearInterval(intervalRef.current);
            onCompleteRef.current?.({ violations, penaltyTime });
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

  function handleThreshold() {
    setViolations((v) => v + 1);
    setPenaltyTime((t) => t + 10);
    setRemaining((r) => r + 10);
  }

  return (
    <div className="text-center">
      <div className="font-heading text-2xl mb-1">🤫 CURSE OF SILENCE</div>
      <div className="text-sm mb-3 text-foreground/70">Απόλυτη ησυχία! Αν βγάλεις ήχο → +10″ γαργαλήματος στις πατούσες.</div>
      <div className={cn('font-heading text-6xl mb-2', remaining <= 10 ? 'text-destructive comic-pulse' : 'text-foreground')}>
        {Math.ceil(remaining)}″
      </div>
      <div className="w-full h-4 bg-background/10 rounded-full overflow-hidden border-2 border-border mb-3">
        <div className={cn('h-full transition-all', remaining <= 10 ? 'bg-destructive' : 'bg-tarot-royal')} style={{ width: `${Math.min(100, (remaining / (duration + penaltyTime)) * 100)}%` }} />
      </div>
      <div className="text-sm font-bold mb-3">Παραβάσεις: {violations}× | Μπόνους: +{penaltyTime}″</div>
      <DecibelMeter label="SILENCE METER — Αν ακουστεί ήχος → +10″" size="md" onThreshold={handleThreshold} />
      {frozen && <div className="text-destructive font-bold mt-2 comic-pulse">⏸ ΠΑΥΣΗ</div>}
    </div>
  );
}