import React, { useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { PEDI_GLAM_CARDS } from '@/data/modes/pediGlamContent';
import { pick, useLocalCountdown } from '@/lib/modeKit';

export default function ActPediGlam({ ctx, onDone }) {
  const { players, mg, setMg, log, stopped } = ctx;
  const [active, setActive] = useState(null);
  const [remainingDeck, setRemainingDeck] = useState(PEDI_GLAM_CARDS.map((c) => c.id));
  const [playerId, setPlayerId] = useState(players[0]?.id || '');
  const tokens = mg.glamTokens || {};
  const left = useLocalCountdown(90 * 60, true, () => log('Ολοκληρώθηκαν τα 90 λεπτά του Pedi-Glam.'));
  const draw = () => {
    if (stopped || !remainingDeck.length) return;
    const pool = PEDI_GLAM_CARDS.filter((c) => remainingDeck.includes(c.id));
    const card = pick(pool);
    setActive(card);
    setRemainingDeck((ids) => ids.filter((id) => id !== card.id));
    setMg({ pediGlamUsed: 20 - remainingDeck.length + 1 });
    log('Pedi-Glam: ' + card.title);
  };
  const resolve = (success) => {
    if (!active || !playerId) return;
    const gain = success ? (active.reward || 0) : 0;
    if (gain) {
      const next = { ...tokens, [playerId]: (tokens[playerId] || 0) + gain };
      setMg({ glamTokens: next });
    }
    log((success ? 'Ολοκληρώθηκε: ' : 'Παραλείφθηκε: ') + active.title + (gain ? ' · +' + gain + ' Glam Tokens' : ''));
    setActive(null);
  };
  return (
    <div className="space-y-3">
      <Panel title="💅 Pajama Pedi-Glam — Sensory & Pamper Edition" accent="#FF2A85">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Διάρκεια: 90 λεπτά</span>
          <b className="font-display text-2xl text-primary">{Math.floor(left / 60)}:{String(Math.ceil(left % 60)).padStart(2,'0')}</b>
          <span>{PEDI_GLAM_CARDS.length - remainingDeck.length}/20 κάρτες</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="rounded bg-background border border-border p-2 text-sm">
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Btn color="bg-fuchsia-700" onClick={draw} disabled={!!active || !remainingDeck.length || stopped}>Τράβηξε κάρτα</Btn>
          <Btn color="bg-secondary" onClick={() => { setRemainingDeck(PEDI_GLAM_CARDS.map((c) => c.id)); setActive(null); setMg({ pediGlamUsed: 0 }); }} disabled={stopped}>Επαναφορά deck</Btn>
        </div>
        {active && (
          <div className="rounded-xl border border-primary/50 bg-background/70 p-4 space-y-3">
            <div className="text-xs opacity-70">Κάρτα για: {players.find((p) => p.id === playerId)?.name || '—'}</div>
            <div className="font-heading text-2xl">{active.title}</div>
            <p className="font-body text-base">{active.text}</p>
            <div className="flex gap-2">
              <Btn color="bg-emerald-700" onClick={() => resolve(true)} disabled={stopped}>Ολοκληρώθηκε</Btn>
              <Btn color="bg-secondary" onClick={() => resolve(false)} disabled={stopped}>Παράλειψη</Btn>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="Glam Tokens">
        {players.map((p) => <div key={p.id} className="flex justify-between border-b border-border/30 py-1 text-sm"><b>{p.name}</b><span>{tokens[p.id] || 0} 🪙</span></div>)}
        {!remainingDeck.length && <div className="text-sm text-primary">Ολοκληρώθηκαν και οι 20 κάρτες.</div>}
      </Panel>
      <div className="text-center"><Btn color="bg-emerald-700" onClick={onDone}>Ολοκλήρωση Mode 1</Btn></div>
    </div>
  );
}
