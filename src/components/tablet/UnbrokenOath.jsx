import React, { useState, useEffect, useRef } from 'react';
import ComicButton from '@/components/comic/ComicButton';

// EP-10: The Unbroken Oath — hold glass without spilling, success = -1 penalty
export default function UnbrokenOath({ duration, ultra = false, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [spills, setSpills] = useState(0);
  const [flash, setFlash] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!frozen && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) { clearInterval(intervalRef.current); onComplete?.({ spills, survived: true }); return 0; }
          return p - 0.1;
        });
      }, 100);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [frozen]);

  function handleSpill() {
    setSpills((s) => s + 1);
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }

  return (
    <div className="text-center space-y-3">
      <div className={`text-6xl ${flash ? 'comic-pulse' : ''}`}>🥂</div>
      <div className="font-heading text-5xl text-foreground">{Math.ceil(remaining)}″</div>
      <div className="w-full h-4 bg-background/10 rounded-full border-2 border-border overflow-hidden">
        <div className={`h-full ${spills > 0 ? 'bg-destructive' : 'bg-tarot-teal'} transition-all`} style={{ width: `${Math.max(0, 100 - spills * 20)}%` }} />
      </div>
      <div className="text-sm font-bold">💧 Σταγόνες που χύθηκαν: {spills}</div>
      <ComicButton variant="red" size="sm" onClick={handleSpill} disabled={frozen}>
        💧 ΧΥΘΗΚΕ ΣΤΑΓΟΝΑ (+{ultra ? 2 : 1})
      </ComicButton>
      <div className="text-xs text-tarot-forest font-bold">
        ✅ Αν αντέξει: {ultra ? -2 : -1} ποινή
      </div>
    </div>
  );
}