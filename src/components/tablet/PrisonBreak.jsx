import React, { useState } from 'react';
import ComicButton from '@/components/comic/ComicButton';
import { rollDice } from '@/lib/gameLogic';

export default function PrisonBreak({ player, onComplete }) {
  const [rolls, setRolls] = useState([]);
  const [done, setDone] = useState(null);
  const [rolling, setRolling] = useState(false);
  const maxAttempts = 3;
  const attempts = rolls.length;

  function handleRoll() {
    setRolling(true);
    setTimeout(() => {
      const dice = rollDice();
      const newRolls = [...rolls, dice];
      setRolls(newRolls);
      setRolling(false);
      if (dice >= 5) {
        setDone('escaped');
        setTimeout(() => onComplete(true), 1200);
      } else if (newRolls.length >= maxAttempts) {
        setDone('failed');
        setTimeout(() => onComplete(false), 1200);
      }
    }, 600);
  }

  return (
    <div className="text-center">
      <div className="ds-eyebrow text-primary/85">Απόπειρα διαφυγής</div>
      <h2 className="ds-title mt-2 text-2xl">Απόδραση</h2>
      <p className="ds-lede mx-auto mt-2 mb-5 max-w-sm text-sm">
        {player?.name}: 3 προσπάθειες. Χρειάζεται 5+ στο ζάρι για απόδραση.
        Επιτυχία → -1 ποινή · Αποτυχία → +1 ποινή.
      </p>
      <div className="mb-5 flex justify-center gap-2.5">
        {Array.from({ length: maxAttempts }).map((_, i) => {
          const spent = rolls[i] !== undefined;
          return (
            <div
              key={i}
              className={`flex h-16 w-16 items-center justify-center rounded-sm border ds-value text-3xl transition-colors duration-300 ease-lux ${
                spent ? 'border-primary/35 bg-primary/[0.08] text-primary' : 'border-primary/12 bg-surface-1/60 text-foreground/25'
              }`}
            >
              {rolling && i === rolls.length ? '🎲' : rolls[i] || '—'}
            </div>
          );
        })}
      </div>
      {done === 'escaped' && <div className="ds-eyebrow mb-4 text-primary comic-pop">🎉 Απέδρασε</div>}
      {done === 'failed' && <div className="ds-eyebrow mb-4 text-destructive comic-pulse">⛓️ Απέτυχε · +1 Ποινή</div>}
      {!done && (
        <ComicButton variant="dark" size="lg" onClick={handleRoll} disabled={rolling || attempts >= maxAttempts}>
          {rolling ? '🎲 ...' : `🎲 Ρίξε Ζάρι · ${attempts}/${maxAttempts}`}
        </ComicButton>
      )}
    </div>
  );
}