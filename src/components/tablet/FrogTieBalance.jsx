import React, { useState, useEffect, useRef } from 'react';
import ComicButton from '@/components/comic/ComicButton';

// EP-06: Standing Frog-Tie Balance — fall resets timer, ULTRA adds tickle penalty
export default function FrogTieBalance({ duration, ultra = false, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [falls, setFalls] = useState(0);
  const [ticklePenalty, setTicklePenalty] = useState(0);
  const [showFallFlash, setShowFallFlash] = useState(false);
  const intervalRef = useRef(null);
  const isPenaltyActive = ticklePenalty > 0;

  useEffect(() => {
    if (!frozen && !isPenaltyActive && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) { clearInterval(intervalRef.current); onComplete?.({ falls }); return 0; }
          return p - 0.1;
        });
      }, 100);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [frozen, isPenaltyActive]);

  function handleFall() {
    setFalls((f) => f + 1);
    setRemaining(duration);
    setShowFallFlash(true);
    setTimeout(() => setShowFallFlash(false), 800);
    if (ultra) {
      setTicklePenalty(30);
    }
  }

  // ULTRA: tickle penalty countdown on the floor
  useEffect(() => {
    if (!isPenaltyActive) return;
    const iv = setInterval(() => {
      setTicklePenalty((p) => {
        if (p <= 0.1) { clearInterval(iv); return 0; }
        return p - 0.1;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [isPenaltyActive]);

  const pct = (remaining / duration) * 100;

  return (
    <div className="text-center space-y-3">
      {ticklePenalty > 0 ? (
        <>
          <div className="font-heading text-4xl text-destructive comic-pulse">😂 TICKLE ΠΟΙΝΗ!</div>
          <div className="font-heading text-6xl text-destructive">{Math.ceil(ticklePenalty)}″</div>
          <div className="text-sm font-bold">Γαργάλημα στο πάτωμα πριν ξαναρχίσει</div>
          <div className="w-full h-3 bg-background/10 rounded-full border-2 border-border overflow-hidden">
            <div className="h-full bg-destructive transition-all" style={{ width: `${(ticklePenalty / 30) * 100}%` }} />
          </div>
        </>
      ) : (
        <>
          <div className={`font-heading text-5xl ${showFallFlash ? 'text-destructive comic-pulse' : 'text-foreground'}`}>
            {Math.ceil(remaining)}″
          </div>
          <div className="w-full h-3 bg-background/10 rounded-full border-2 border-border overflow-hidden">
            <div className={`h-full ${showFallFlash ? 'bg-destructive' : 'bg-primary'} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          {ultra && (
            <div className="inline-block bg-background text-destructive px-2 py-0.5 rounded text-xs font-bold">
              ⚖️ ΒΑΡΙΔΙΑ + 🙈 BLINDFOLD
            </div>
          )}
          <div className="text-sm font-bold">🤸 Πτώσεις: {falls}</div>
          <ComicButton variant="red" size="sm" onClick={handleFall} disabled={frozen}>
            😖 ΕΠΕΣΕ (+{ultra ? 2 : 1} ποινή{ultra ? ' + 30″ tickle' : ''})
          </ComicButton>
          <div className="text-xs text-foreground/60">
            {ultra
              ? 'ULTRA: Βαρίδια + Blindfold. Πτώση = +2 ποινές ΚΑΙ 30″ γαργάλημα στο πάτωμα πριν ξαναρχίσει.'
              : 'Βαθος squat, αστράγαλοι δεμένοι. Πτώση = +1 ποινή και ξανά από την αρχή.'}
          </div>
        </>
      )}
    </div>
  );
}