import React, { useState, useEffect, useRef } from 'react';
import ComicButton from '@/components/comic/ComicButton';
import { cn } from '@/lib/utils';

// Double Hogtie: 2 παίκτριες. Αν μία παραδοθεί, η άλλα κερδίζει ασυλία.
// Αν και δύο αντέξουν, -1 ποινή καθεμία.
export default function DoubleHogtie({ playerA, playerB, duration = 60, frozen = false, onResult }) {
  const [remaining, setRemaining] = useState(duration);
  const [gaveUp, setGaveUp] = useState(null);
  const intervalRef = useRef(null);
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    if (!frozen && !gaveUp && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) {
            clearInterval(intervalRef.current);
            onResultRef.current?.({ gaveUp: null, bothSurvived: true });
            return 0;
          }
          return p - 0.1;
        });
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [frozen, gaveUp, remaining <= 0]);

  function handleGiveUp(who) {
    setGaveUp(who);
    clearInterval(intervalRef.current);
    onResultRef.current?.({ gaveUp: who, bothSurvived: false });
  }

  return (
    <div>
      <div className="text-center mb-3">
        <div className="font-heading text-2xl">👯 DOUBLE HOGTIE</div>
        <div className="text-sm text-foreground/70">Αν μία παραδοθεί, η άλλη κερδίζει ασυλία. Αν αντέξουν και οι δύο → -1 ποινή καθεμία.</div>
      </div>
      <div className="text-center font-heading text-4xl mb-3">{Math.ceil(remaining)}″</div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { p: playerA, key: 'A', color: 'bg-tarot-wine/40' },
          { p: playerB, key: 'B', color: 'bg-tarot-teal/30' },
        ].map(({ p, key, color }) => (
          <div key={key} className={cn('comic-panel-sm p-3 text-center', color, gaveUp === key && 'opacity-50')}>
            <div className="font-heading text-lg">{p?.name || `Παίκτρια ${key}`}</div>
            <div className="text-xs mb-3">Ποινή: {p?.penaltyStep || 0}</div>
            {gaveUp === key ? (
              <div className="font-heading text-destructive">ΠΑΡΕΔΟΘΗ</div>
            ) : gaveUp && gaveUp !== key ? (
              <div className="font-heading text-tarot-forest comic-pop">🛡️ ΑΣΥΛΙΑ!</div>
            ) : (
              <ComicButton variant="red" size="sm" onClick={() => handleGiveUp(key)} disabled={frozen || remaining <= 0}>
                🏳️ ΠΑΡΑΔΙΝΟΜΑΙ
              </ComicButton>
            )}
          </div>
        ))}
      </div>
      {frozen && <div className="text-center text-destructive font-bold mt-2 comic-pulse">⏸ ΠΑΥΣΗ</div>}
    </div>
  );
}