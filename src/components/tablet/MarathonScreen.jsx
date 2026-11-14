import React, { useState } from 'react';
import MarathonInfiltration from '@/components/tablet/MarathonInfiltration';
import MarathonVault from '@/components/tablet/MarathonVault';
import MarathonRaids from '@/components/tablet/MarathonRaids';
import MarathonLockdown from '@/components/tablet/MarathonLockdown';

export default function MarathonScreen({ state, updateState, onEnd }) {
  const stage = state.marathonStage || 1;
  let screen = null;
  if (stage === 1) screen = <MarathonInfiltration state={state} updateState={updateState} onAdvance={() => updateState({ marathonStage: 2 })} />;
  else if (stage === 2) screen = <MarathonVault state={state} updateState={updateState} onAdvance={() => updateState({ marathonStage: 3 })} />;
  else if (stage === 3) screen = <MarathonRaids state={state} updateState={updateState} onAdvance={() => updateState({ marathonStage: 4 })} />;
  else if (stage === 4) screen = <MarathonLockdown state={state} updateState={updateState} onEnd={onEnd} />;
  return (
    <div className="space-y-3">
      {screen}
      <DirectorScorePanel state={state} updateState={updateState} stage={stage} />
    </div>
  );
}

function DirectorScorePanel({ state, updateState, stage }) {
  const [amount, setAmount] = useState('5000');
  const value = Math.max(0, Number(amount) || 0);
  const alpha = state.teamAlpha || { loot: 0, stars: 0 };
  const beta = state.teamBeta || { loot: 0, stars: 0 };
  const winner = alpha.loot > beta.loot ? 'Team Alpha' : beta.loot > alpha.loot ? 'Team Beta' : alpha.stars < beta.stars ? 'Team Alpha' : beta.stars < alpha.stars ? 'Team Beta' : 'Ισοπαλία';
  const change = (team, field, delta) => {
    const current = team === 'alpha' ? alpha : beta;
    updateState({
      [team === 'alpha' ? 'teamAlpha' : 'teamBeta']: {
        ...current,
        [field]: Math.max(0, (Number(current[field]) || 0) + delta),
      },
    });
  };
  return (
    <section className="rounded-xl border border-amber-400/50 bg-black/70 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-heading text-lg text-amber-300">DIRECTOR CONTROL · MEGA MARATHON</div>
        <div className="text-sm">Στάδιο {stage}/4</div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        Μεταβολή Loot
        <input type="number" min="0" step="500" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-28 rounded bg-background border border-border px-2 py-1 text-foreground" />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        {[['alpha','Team Alpha',alpha],['beta','Team Beta',beta]].map(([key,label,team]) => (
          <div key={key} className="rounded-lg border border-border/60 p-3 space-y-2">
            <b>{label}</b>
            <div className="text-lg tabular-nums">$ {Number(team.loot || 0).toLocaleString()} · ⭐ {team.stars || 0}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => change(key,'loot',value)} className="rounded bg-emerald-800 px-3 py-2 text-sm" disabled={!value}>+ Loot</button>
              <button type="button" onClick={() => change(key,'loot',-value)} className="rounded bg-red-900 px-3 py-2 text-sm" disabled={!value || !team.loot}>− Loot</button>
              <button type="button" onClick={() => change(key,'stars',1)} className="rounded bg-amber-800 px-3 py-2 text-sm">+ Star</button>
              <button type="button" onClick={() => change(key,'stars',-1)} className="rounded bg-secondary px-3 py-2 text-sm" disabled={!team.stars}>− Star</button>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-amber-950/40 p-3 text-center">
        <div className="text-xs opacity-70">ΑΠΟΤΕΛΕΣΜΑ ΜΕ ΒΑΣΗ LOOT ΚΑΙ, ΣΕ ΙΣΟΠΑΛΙΑ, ΤΑ ΛΙΓΟΤΕΡΑ WANTED STARS</div>
        <div className="font-heading text-xl text-amber-300">{winner}</div>
      </div>
    </section>
  );
}
