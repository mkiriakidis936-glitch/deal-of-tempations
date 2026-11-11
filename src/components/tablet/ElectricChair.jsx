import React, { useState } from 'react';
import ComicButton from '@/components/comic/ComicButton';

// EP-08: The Tickle Electric Chair — buttons trigger tickle spots
const SPOTS = [
  { id: 'left', icon: '🦶', label: 'LEFT FOOT', color: 'bg-tarot-teal/60' },
  { id: 'right', icon: '🦶', label: 'RIGHT FOOT', color: 'bg-tarot-forest' },
  { id: 'axilla', icon: '🤚', label: 'AXILLA', color: 'bg-tarot-wine/60' },
];

export default function ElectricChair({ duration, ultra = false, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [active, setActive] = useState(null);
  const [moves, setMoves] = useState(0);

  React.useEffect(() => {
    if (!frozen && remaining > 0) {
      const iv = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) { clearInterval(iv); onComplete?.({ moves }); return 0; }
          return p - 0.1;
        });
      }, 100);
      return () => clearInterval(iv);
    }
  }, [frozen]);

  function trigger(spotId) {
    setActive(spotId);
    setTimeout(() => setActive(null), 500);
  }

  function triggerAll() {
    setActive('all');
    setTimeout(() => setActive(null), 800);
  }

  return (
    <div className="text-center space-y-3">
      <div className="font-heading text-5xl text-foreground">{Math.ceil(remaining)}″</div>
      <div className="text-xs font-bold text-foreground/60">⚡ Κουμπιά στο /play — Η παρέα γαργαλάει</div>
      <div className="grid grid-cols-3 gap-2">
        {SPOTS.map((s) => (
          <button
            key={s.id}
            onClick={() => trigger(s.id)}
            disabled={frozen}
            className={`comic-panel-sm p-3 ${s.color} ${active === s.id || active === 'all' ? 'comic-pulse ring-2 ring-primary' : ''} disabled:opacity-50`}
          >
            <div className="text-3xl">{s.icon}</div>
            <div className="text-xs font-bold">{s.label}</div>
          </button>
        ))}
      </div>
      {ultra && (
        <ComicButton variant="dark" size="sm" onClick={triggerAll} disabled={frozen}>
          ⚡ ALL THREE! (ULTRA)
        </ComicButton>
      )}
      <div className="text-sm font-bold">Κινήσεις: {moves}</div>
      <ComicButton variant="red" size="sm" onClick={() => setMoves((m) => m + 1)} disabled={frozen}>
        ❌ ΚΙΝΗΘΗΚΕ (+{ultra ? 2 : 1})
      </ComicButton>
    </div>
  );
}