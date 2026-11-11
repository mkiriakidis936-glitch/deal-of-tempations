import React, { useState, useEffect, useRef } from 'react';
import ComicButton from '@/components/comic/ComicButton';

// EP-01: T-Pose Wall Restraint — GM taps tickle zones, player must stay still
const ZONES = [
  { id: 'sides', icon: '🤚', label: 'ΠΛΕΥΡΑ', color: 'bg-primary' },
  { id: 'armpits', icon: '✋', label: 'ΜΑΣΧΑΛΕΣ', color: 'bg-tarot-wine/60' },
  { id: 'soles', icon: '🦶', label: 'ΠΑΤΟΥΣΕΣ', color: 'bg-tarot-teal' },
];

export default function TPoseRestraint({ duration, ultra = false, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [activeZone, setActiveZone] = useState(null);
  const [moves, setMoves] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!frozen && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) { clearInterval(intervalRef.current); onComplete?.({ moves }); return 0; }
          return p - 0.1;
        });
      }, 100);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [frozen]);

  function triggerZone(zoneId) {
    setActiveZone(zoneId);
    setTimeout(() => setActiveZone(null), 600);
  }

  function triggerAll() {
    setActiveZone('all');
    setTimeout(() => setActiveZone(null), 800);
  }

  function handleMove() {
    setMoves((m) => m + 1);
  }

  const pct = (remaining / duration) * 100;
  const activeZones = ultra ? ZONES : ZONES.slice(0, 2);

  return (
    <div className="text-center space-y-3">
      <div className="font-heading text-5xl text-foreground">{Math.ceil(remaining)}″</div>
      <div className="w-full h-3 bg-background/10 rounded-full border-2 border-border overflow-hidden">
        <div className="h-full bg-destructive transition-all" style={{ width: `${pct}%` }} />
      </div>

      {ultra && (
        <div className="inline-block bg-background text-destructive px-2 py-0.5 rounded text-xs font-bold">
          🙈 BLINDFOLD + 3 ΖΩΝΕΣ ΤΑΥΤΟΧΡΟΝΑ
        </div>
      )}

      {/* Tickle zone buttons */}
      <div className={`grid gap-2 ${ultra ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {activeZones.map((z) => (
          <button
            key={z.id}
            onClick={() => triggerZone(z.id)}
            disabled={frozen}
            className={`comic-panel-sm p-3 ${z.color} ${activeZone === z.id || activeZone === 'all' ? 'comic-pulse ring-2 ring-primary' : ''} disabled:opacity-50`}
          >
            <div className="text-2xl">{z.icon}</div>
            <div className="text-xs font-bold">{z.label}</div>
          </button>
        ))}
      </div>

      {ultra && (
        <ComicButton variant="dark" size="sm" onClick={triggerAll} disabled={frozen}>
          ⚡ ΟΛΕΣ ΟΙ ΖΩΝΕΣ! (ULTRA)
        </ComicButton>
      )}

      <div className="text-sm font-bold">🚨 Κινήσεις: {moves}</div>
      <ComicButton variant="red" size="sm" onClick={handleMove} disabled={frozen}>
        ❌ ΚΙΝΗΘΗΚΕ (+{ultra ? 2 : 1} ποινή)
      </ComicButton>
      <div className="text-xs text-foreground/60">
        {ultra
          ? 'ULTRA: Blindfold + 3 ζώνες ταυτόχρονα. Κάθε κίνηση = +2 ποινές.'
          : 'Παρέα γαργαλάει πλευρά & μασχάλες. Κάθε κίνηση = +1 ποινή.'}
      </div>
    </div>
  );
}