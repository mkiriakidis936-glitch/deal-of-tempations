import React, { useEffect, useState } from 'react';
import { getRemaining } from '@/lib/syncTimer';

// Overlay τηλεόρασης για το 8άρι blitz — χρονόμετρο με όλες τις παίκτριες ή εντολές ανά παίκτρια.
// Το ίδιο component χρησιμοποιείται και ως preview στο Admin (embedded).
export default function BlitzOverlay({ blitz, embedded = false }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!blitz?.running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [blitz?.running, blitz?.endsAt]);

  if (!blitz?.active) return null;

  const duration = blitz.duration || 8;
  const remaining = getRemaining(blitz, now);
  const expired = remaining <= 0;
  const commandsMode = blitz.mode === 'commands';
  const entries = blitz.entries || [];
  const progress = Math.max(0, Math.min(100, (remaining / duration) * 100));
  const wrap = embedded ? 'absolute inset-0' : 'fixed inset-0 z-[85]';

  return (
    <div
      className={`${wrap} bg-background/98 text-foreground flex flex-col items-center justify-center overflow-hidden px-6 py-4`}
      style={{ background: 'radial-gradient(circle at 50% 35%, rgba(120,10,30,0.55), rgba(10,2,6,0.98) 70%)' }}
    >
      <div className="font-heading tracking-[0.35em] text-sm text-tarot-gold">
        {commandsMode ? '⚡ ΕΝΤΟΛΕΣ · 8 ΔΕΥΤΕΡΟΛΕΠΤΑ' : '⚡ 8 ΔΕΥΤΕΡΟΛΕΠΤΑ · ΟΛΕΣ ΜΑΖΙ'}
      </div>

      <div className="flex items-center justify-center gap-6 my-1">
        <div
          className={`font-heading text-[7rem] leading-none tabular-nums ${
            expired ? 'text-destructive comic-pulse' : 'text-primary'
          }`}
          style={{ textShadow: '0 0 45px rgba(201,162,39,0.45)' }}
        >
          {remaining}
        </div>
        {expired && (
          <div className="font-heading text-3xl text-destructive comic-text-stroke">ΤΕΛΟΣ ΧΡΟΝΟΥ!</div>
        )}
      </div>

      <div className="w-full max-w-3xl h-2 rounded-full bg-secondary overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-100 ${expired ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {commandsMode ? (
        <div
          className="w-full max-w-6xl grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${entries.length > 4 ? 3 : 2}, minmax(0, 1fr))`,
          }}
        >
          {entries.map((e, i) => (
            <div key={e.id || i} className="comic-panel-sm bg-tarot-wine/80 border-tarot-gold/60 px-3 py-2">
              <div className="font-heading text-lg text-tarot-gold">
                {i + 1}. {e.name}
              </div>
              <div className="text-sm text-foreground/70 font-body">
                <span className="font-bold text-primary">ΚΑΝΕΙ:</span> {e.doing}
              </div>
              <div className="text-base text-foreground font-body">
                <span className="font-bold text-destructive">ΠΡΕΠΕΙ:</span> {e.must}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-5xl">
          <div className="text-center font-heading text-xs tracking-[0.3em] text-foreground/60 mb-2">
            ΟΛΕΣ ΟΙ ΠΑΙΚΤΡΙΕΣ
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {entries.map((e, i) => (
              <div
                key={e.id || i}
                className={`comic-panel-sm px-4 py-2 font-heading text-xl ${
                  expired ? 'bg-destructive text-foreground' : 'bg-tarot-wine text-tarot-gold'
                }`}
              >
                {e.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {blitz.label && (
        <div className="mt-3 font-heading text-sm text-foreground/60 tracking-widest">{blitz.label}</div>
      )}
    </div>
  );
}