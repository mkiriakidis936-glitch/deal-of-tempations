import React, { useState, useMemo } from 'react';
import ComicButton from '@/components/comic/ComicButton';
import Timer from '@/components/comic/Timer';
import { VAULT_TRIAL_PROMPTS } from '@/data/gameContent';
import { shuffle } from 'lodash';

export default function VaultTrialChallenge({ trial, state, onResult }) {
  const prompts = useMemo(() => {
    if (trial.type === 'sequence') return Array.from({ length: trial.target }, () => shuffle(VAULT_TRIAL_PROMPTS.moves)[0]);
    return shuffle(VAULT_TRIAL_PROMPTS[trial.id] || []);
  }, [trial.id]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [memorizing, setMemorizing] = useState(trial.type === 'sequence');

  if (trial.type === 'endurance') {
    return (
      <div className="text-center space-y-3">
        <Timer duration={trial.duration} running={true} frozen={state.stopActive} onComplete={() => onResult(true)} label="ΑΝΤΟΧΗ" size="lg" />
        <ComicButton variant="red" size="lg" onClick={() => onResult(false)}>😖 ΚΙΝΗΘΗΚΕ / ΑΠΕΤΥΧΕ</ComicButton>
      </div>
    );
  }

  if (memorizing) {
    return (
      <div className="text-center space-y-3">
        <Timer duration={10} running={true} frozen={state.stopActive} onComplete={() => setMemorizing(false)} label="ΑΠΟΜΝΗΜΟΝΕΥΣΗ" size="md" />
        <div className="flex flex-wrap justify-center gap-2">
          {prompts.map((m, i) => <span key={i} className="comic-panel-sm px-2 py-1 bg-primary/20 font-bold text-sm">{i + 1}. {m}</span>)}
        </div>
      </div>
    );
  }

  function mark(ok) {
    const c = correct + (ok ? 1 : 0);
    setCorrect(c);
    if (c >= trial.target) return onResult(true);
    if (trial.type === 'sequence' && !ok) return onResult(false);
    if (idx + 1 >= prompts.length) return onResult(false);
    setIdx(idx + 1);
  }

  const p = prompts[idx];
  return (
    <div className="text-center space-y-3">
      <Timer duration={trial.duration} running={true} frozen={state.stopActive} onComplete={() => onResult(false)} label={`ΣΩΣΤΕΣ ${correct}/${trial.target}`} size="md" />
      <div className="comic-panel-sm p-4 bg-secondary">
        <div className="text-xs font-bold mb-1">{trial.type === 'sequence' ? `ΚΙΝΗΣΗ ${idx + 1}` : 'GM ΜΟΝΟ:'}</div>
        <div className="font-heading text-2xl">{typeof p === 'object' ? p.q : trial.type === 'sequence' ? '???' : p}</div>
        {typeof p === 'object' && <div className="text-sm mt-1">Απάντηση: <b>{p.a}</b></div>}
        {trial.type === 'sequence' && <div className="text-sm mt-1">Σωστή: <b>{p}</b></div>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ComicButton variant="green" onClick={() => mark(true)}>✅ ΣΩΣΤΟ</ComicButton>
        <ComicButton variant="red" onClick={() => mark(false)}>❌ ΛΑΘΟΣ</ComicButton>
      </div>
    </div>
  );
}