import { useState } from 'react';
import ComicButton from '@/components/comic/ComicButton';
import { WHEEL_BINDING_MATERIALS, WHEEL_TICKLE_TOOLS } from '@/data/gameConfig';

const SEG_COLORS = ['#c9a227', '#5C0A1E', '#2D5A3D', '#1B4B5A'];

export default function WheelOfMisfortune({ onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('binding');
  const items = mode === 'binding' ? WHEEL_BINDING_MATERIALS : WHEEL_TICKLE_TOOLS;

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const winnerIdx = Math.floor(Math.random() * items.length);
    const segmentAngle = 360 / items.length;
    const targetAngle = 360 * 5 + (360 - winnerIdx * segmentAngle - segmentAngle / 2);
    setRotation(prev => prev + targetAngle);
    setTimeout(() => {
      setSpinning(false);
      setResult(items[winnerIdx]);
      onResult?.(items[winnerIdx]);
    }, 3100);
  }

  return (
    <div className="comic-panel-sm p-4 bg-card text-center">
      <div className="font-heading text-xl mb-2 text-primary">🎡 WHEEL OF MISFORTUNE</div>
      <div className="flex gap-2 justify-center mb-3">
        <button
          onClick={() => { setMode('binding'); setResult(null); }}
          className={`comic-boom font-heading px-2 py-1 text-xs ${mode === 'binding' ? 'bg-tarot-royal text-foreground' : 'bg-secondary text-foreground'}`}
        >
          🪢 ΔΕΣΙΜΟ
        </button>
        <button
          onClick={() => { setMode('tickle'); setResult(null); }}
          className={`comic-boom font-heading px-2 py-1 text-xs ${mode === 'tickle' ? 'bg-tarot-wine text-foreground' : 'bg-secondary text-foreground'}`}
        >
          🪶 ΓΑΡΓΑΛΗΜΑ
        </button>
      </div>
      <div className="relative w-44 h-44 mx-auto mb-3">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-2xl z-10 text-primary">▼</div>
        <div
          className="w-full h-full rounded-full border-4 border-border"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none',
            background: `conic-gradient(${items.map((item, i) => {
              const angle = 360 / items.length;
              return `${SEG_COLORS[i % 4]} ${i * angle}deg ${(i + 1) * angle}deg`;
            }).join(', ')})`,
          }}
        >
          {items.map((item, i) => {
            const angle = (360 / items.length) * i + (360 / items.length) / 2;
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 text-[10px] font-bold text-foreground"
                style={{ transform: `rotate(${angle}deg) translateX(36px)` }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
      <ComicButton variant="yellow" onClick={spin} disabled={spinning}>
        {spinning ? '🌀 ΠΕΡΙΜΕΝΕ...' : '🎯 ΚΛΑΡΩΣΕ!'}
      </ComicButton>
      {result && (
        <div className="mt-3 comic-panel-sm p-2 bg-primary/20 comic-pop">
          <div className="font-heading text-lg text-primary">→ {result} ←</div>
        </div>
      )}
    </div>
  );
}