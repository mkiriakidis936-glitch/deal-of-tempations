import React, { useState, useEffect, useRef } from 'react';
import ComicButton from '@/components/comic/ComicButton';

// EP-05: Ice & Brush Gauntlet — rotating tool indicator on bare soles
const TOOLS = [
  { icon: '🧊', name: 'Παγάκι', color: 'bg-tarot-teal/60' },
  { icon: '🖌️', name: 'Βούρτσα', color: 'bg-tarot-sienna' },
  { icon: '🤚', name: 'Δάχτυλα', color: 'bg-tarot-wine/60' },
  { icon: '🪶', name: 'Φτερό', color: 'bg-tarot-royal/60' },
];

export default function ToolGauntlet({ duration, ultra = false, frozen = false, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [activeTool, setActiveTool] = useState(0);
  const [pulls, setPulls] = useState(0);
  const intervalRef = useRef(null);
  const cycleRef = useRef(null);

  useEffect(() => {
    if (!frozen && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((p) => {
          if (p <= 0.1) { clearInterval(intervalRef.current); clearInterval(cycleRef.current); onComplete?.({ pulls }); return 0; }
          return p - 0.1;
        });
      }, 100);
      cycleRef.current = setInterval(() => {
        setActiveTool((t) => (t + 1) % TOOLS.length);
      }, 10000);
    } else { clearInterval(intervalRef.current); clearInterval(cycleRef.current); }
    return () => { clearInterval(intervalRef.current); clearInterval(cycleRef.current); };
  }, [frozen]);

  function handlePull() {
    setPulls((p) => p + 1);
    if (ultra) setRemaining(0); // ULTRA: μηδενίζεται ο χρόνος
  }

  const tool = TOOLS[activeTool];

  return (
    <div className="text-center space-y-3">
      <div className="font-heading text-5xl text-foreground">{Math.ceil(remaining)}″</div>
      <div className="text-xs font-bold text-foreground/60">🦶 Γυμνά πέλματα — Εκ περιτροπής εργαλεία</div>
      <div className={`comic-panel-sm p-4 ${tool.color} comic-pop`} key={activeTool}>
        <div className="text-5xl">{tool.icon}</div>
        <div className="font-heading text-xl">{tool.name}</div>
      </div>
      <div className="flex gap-2 justify-center">
        {TOOLS.map((t, i) => (
          <div key={i} className={`w-3 h-3 rounded-full border border-border ${i === activeTool ? 'bg-destructive' : 'bg-card'}`} />
        ))}
      </div>
      <div className="text-sm font-bold">🦶 Πόδι τραβήχτηκε: {pulls} {ultra ? '→ χρόνος μηδενίστηκε!' : '(+1 ποινή)'}</div>
      <ComicButton variant="red" size="sm" onClick={handlePull} disabled={frozen}>
        🦶 ΤΡΑΒΗΞΕ ΠΟΔΙ
      </ComicButton>
    </div>
  );
}