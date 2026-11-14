import React from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { timerLeft, useTick } from '@/lib/modeKit';

const PHASES = [
  'Άφιξη',
  'Ημέρα',
  'Απόγευμα',
  'Νύχτα',
  'Πρωινή Φάση',
  'Δεύτερη Ημέρα',
  'Τελικό SHOW',
  'FINALE',
];

export default function ActVilla48({ ctx, onDone }) {
  const { mg, setMg, log, stopped } = ctx;
  const index = Math.min(PHASES.length - 1, Math.max(0, mg.villaPhaseIndex || 0));
  useTick(true, 1000);
  const left = timerLeft(mg.timer);
  const move = (next) => {
    if (stopped) return;
    const value = Math.max(0, Math.min(PHASES.length - 1, next));
    setMg({ villaPhaseIndex: value });
    log('Villa 48h · ' + PHASES[value]);
  };
  return (
    <div className="space-y-3">
      <Panel title="VILLA — 48 ΩΡΕΣ" accent="#FFD700">
        <div className="text-center space-y-2">
          <div className="text-xs opacity-70">ΥΠΟΛΟΙΠΟΣ ΧΡΟΝΟΣ</div>
          <div className="font-display text-4xl text-amber-300 tabular-nums">{Math.floor(left / 3600)}:{String(Math.floor((left % 3600) / 60)).padStart(2,'0')}:{String(Math.ceil(left % 60)).padStart(2,'0')}</div>
          <div className="font-heading text-3xl">{PHASES[index]}</div>
          <div className="text-sm opacity-70">Φάση {index + 1} από {PHASES.length}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PHASES.map((phase, i) => (
            <button key={phase} type="button" onClick={() => move(i)} disabled={stopped} className={`rounded-lg border p-3 text-sm ${i === index ? 'border-amber-300 bg-amber-400/20' : 'border-border bg-background/40'}`}>
              {i + 1}. {phase}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <Btn color="bg-secondary" onClick={() => move(index - 1)} disabled={stopped || index === 0}>Προηγούμενη φάση</Btn>
          {index < PHASES.length - 1
            ? <Btn color="bg-amber-600 text-black" onClick={() => move(index + 1)} disabled={stopped}>Επόμενη φάση</Btn>
            : <Btn color="bg-emerald-700" onClick={onDone} disabled={stopped}>Ολοκλήρωση Villa</Btn>}
        </div>
        <p className="text-xs opacity-70">Το βασικό DEAL μπορεί να πραγματοποιείται μέσα στη Villa, σύμφωνα με τη ροή της παρέας.</p>
      </Panel>
    </div>
  );
}
