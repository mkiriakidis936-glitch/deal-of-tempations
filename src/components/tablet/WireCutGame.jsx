import React, { useState } from 'react';
import ComicButton from '@/components/comic/ComicButton';
import { cn } from '@/lib/utils';

const WIRES = [
  { id: 'blue', color: 'bg-tarot-teal', label: 'Μπλε', order: 1 },
  { id: 'red', color: 'bg-destructive', label: 'Κόκκινο', order: 2 },
  { id: 'green', color: 'bg-tarot-forest', label: 'Πράσινο', order: 3 },
];

// Σωστή σειρά: Μπλε(1) → Κόκκινο(2) → Πράσινο(3)
export default function WireCutGame({ onComplete }) {
  const [cut, setCut] = useState([]);
  const [failed, setFailed] = useState(false);
  const [won, setWon] = useState(false);
  const nextOrder = cut.length + 1;

  function handleCut(wire) {
    if (failed || won) return;
    if (wire.order !== nextOrder) {
      setFailed(true);
      setTimeout(() => onComplete(false), 1200);
      return;
    }
    const newCut = [...cut, wire.id];
    setCut(newCut);
    if (newCut.length === 3) {
      setWon(true);
      setTimeout(() => onComplete(true), 1000);
    }
  }

  return (
    <div className="text-center">
      <div className="font-heading text-xl mb-2">✂️ ΑΠΟΚΟΨΕ ΚΑΛΩΔΙΑ ΣΕ ΣΕΙΡΑ</div>
      <div className="text-sm mb-4 text-foreground/70">Σωστή σειρά: Μπλε → Κόκκινο → Πράσινο</div>
      <div className="flex justify-center gap-4 mb-4">
        {WIRES.map((w) => {
          const isCut = cut.includes(w.id);
          return (
            <button
              key={w.id}
              onClick={() => handleCut(w)}
              disabled={isCut || failed || won}
              className={cn(
                'w-16 h-40 rounded-lg border-[3px] border-border transition-all relative',
                w.color,
                isCut && 'opacity-30',
                !isCut && !failed && !won && 'hover:scale-105 cursor-pointer',
                failed && !isCut && 'opacity-50'
              )}
            >
              {isCut && <span className="absolute inset-0 flex items-center justify-center text-4xl">✂️</span>}
            </button>
          );
        })}
      </div>
      <div className="font-heading text-lg">
        {won && <span className="text-tarot-forest comic-pop">✅ ΑΠΟΚΟΠΗΚΕ ΑΣΦΑΛΩΣ!</span>}
        {failed && <span className="text-destructive comic-pulse">💥 ΛΑΘΟΣ ΚΑΛΩΔΙΟ! ΕΚΡΗΞΗ!</span>}
        {!won && !failed && <span className="text-foreground/60">Επόμενο: {nextOrder === 1 ? 'Μπλε' : nextOrder === 2 ? 'Κόκκινο' : 'Πράσινο'}</span>}
      </div>
      {(won || failed) && (
        <div className="mt-3">
          <ComicButton variant={won ? 'green' : 'red'} size="sm" onClick={() => onComplete(won)}>
            {won ? '✅ ΣΥΝΕΧΕΙΑ' : '💥 ΣΥΝΕΧΕΙΑ'}
          </ComicButton>
        </div>
      )}
    </div>
  );
}