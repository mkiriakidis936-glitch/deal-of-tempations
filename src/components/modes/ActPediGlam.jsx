import React, { useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { PEDI_GLAM_CARDS } from '@/data/modes/pediGlamContent';
import { pick, timerLeft, useTick } from '@/lib/modeKit';

export default function ActPediGlam({ ctx, onDone }) {
  const { players, mg, setMg, log, stopped } = ctx;
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id || '');
  const [shareWithId, setShareWithId] = useState('');
  const active = mg.pediGlamActiveCard || null;
  const playerId = mg.pediGlamActivePlayerId || selectedPlayerId;
  const usedIds = mg.pediGlamUsedIds || [];
  const remainingDeck = PEDI_GLAM_CARDS.filter((card) => !usedIds.includes(card.id));
  const tokens = mg.glamTokens || {};
  useTick(true, 1000);
  const left = timerLeft(mg.timer);

  const draw = () => {
    if (stopped || active || !remainingDeck.length) return;
    const card = pick(remainingDeck);
    const nextUsed = [...usedIds, card.id];
    setMg({
      pediGlamUsedIds: nextUsed,
      pediGlamUsed: nextUsed.length,
      pediGlamActiveCard: card,
      pediGlamActivePlayerId: selectedPlayerId,
    });
    log('Pedi-Glam: ' + card.title);
  };

  const resolve = (success, special = null) => {
    if (!active || !playerId || stopped) return;
    const nextTokens = { ...tokens };
    const gain = active.id === 'pg01'
      ? (special === 'painted' ? 1 : 0)
      : active.sharedReward ? 0
      : success ? (active.conditionalReward || active.reward || 0) : 0;
    if (gain) nextTokens[playerId] = (nextTokens[playerId] || 0) + gain;
    if (active.sharedReward && success && shareWithId && shareWithId !== playerId) {
      nextTokens[playerId] = (nextTokens[playerId] || 0) + 1;
      nextTokens[shareWithId] = (nextTokens[shareWithId] || 0) + 1;
    }
    const patch = {
      glamTokens: nextTokens,
      pediGlamActiveCard: null,
      pediGlamActivePlayerId: null,
    };
    if (success && active.immunity) patch.glamImmunity = { ...(mg.glamImmunity || {}), [playerId]: true };
    if (success && active.ribbonTurns) patch.satinRibbonTurns = { ...(mg.satinRibbonTurns || {}), [playerId]: active.ribbonTurns };
    if (success && active.sockSwap && shareWithId) patch.sockSwap = { playerId, targetId: shareWithId, active: true };
    setMg(patch);
    log((success ? 'Ολοκληρώθηκε: ' : 'Παραλείφθηκε: ') + active.title + (gain ? ' · +' + gain + ' Glam Token' : ''));
    setShareWithId('');
  };

  return (
    <div className="space-y-3">
      <Panel title="💅 Pajama Pedi-Glam — Sensory & Pamper Edition" accent="#FF2A85">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Διάρκεια: 90 λεπτά</span>
          <b className="font-display text-2xl text-primary">{Math.floor(left / 60)}:{String(Math.ceil(left % 60)).padStart(2,'0')}</b>
          <span>{usedIds.length}/20 κάρτες</span>
        </div>
        {!active && (
          <div className="flex flex-wrap gap-2">
            <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} className="rounded bg-background border border-border p-2 text-sm">
              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Btn color="bg-fuchsia-700" onClick={draw} disabled={!remainingDeck.length || stopped}>Τράβηξε κάρτα</Btn>
            <Btn color="bg-secondary" onClick={() => setMg({ pediGlamUsedIds: [], pediGlamUsed: 0, pediGlamActiveCard: null, pediGlamActivePlayerId: null })} disabled={stopped}>Επαναφορά deck</Btn>
          </div>
        )}
        {active && (
          <div className="rounded-xl border border-primary/50 bg-background/70 p-4 space-y-3">
            <div className="text-xs opacity-70">Κάρτα για: {players.find((p) => p.id === playerId)?.name || '—'}</div>
            <div className="font-heading text-2xl">{active.title}</div>
            <p className="font-body text-base">{active.text}</p>
            {active.sharedReward && (
              <select value={shareWithId} onChange={(e) => setShareWithId(e.target.value)} className="w-full rounded bg-background border border-border p-2 text-sm">
                <option value="">Επίλεξε συμπαίκτρια για το κοινό bonus</option>
                {players.filter((p) => p.id !== playerId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {active.sockSwap && (
              <select value={shareWithId} onChange={(e) => setShareWithId(e.target.value)} className="w-full rounded bg-background border border-border p-2 text-sm">
                <option value="">Επίλεξε συμπαίκτρια για ανταλλαγή</option>
                {players.filter((p) => p.id !== playerId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <div className="flex flex-wrap gap-2">
              {active.id === 'pg01' ? (
                <>
                  <Btn color="bg-emerald-700" onClick={() => resolve(true, 'painted')} disabled={stopped}>Βαμμένα νύχια · +1 Token</Btn>
                  <Btn color="bg-secondary" onClick={() => resolve(true, 'massage')} disabled={stopped}>Μασάζ 30″ · 0 Token</Btn>
                </>
              ) : (
                <>
                  <Btn color="bg-emerald-700" onClick={() => resolve(true)} disabled={stopped || ((active.sharedReward || active.sockSwap) && !shareWithId)}>Ολοκληρώθηκε</Btn>
                  <Btn color="bg-secondary" onClick={() => resolve(false)} disabled={stopped}>Παράλειψη</Btn>
                </>
              )}
            </div>
          </div>
        )}
      </Panel>
      <Panel title="Glam Tokens">
        {players.map((p) => <div key={p.id} className="flex justify-between border-b border-border/30 py-1 text-sm"><b>{p.name}</b><span>{tokens[p.id] || 0} 🪙</span></div>)}
        {!remainingDeck.length && <div className="text-sm text-primary">Ολοκληρώθηκαν και οι 20 κάρτες.</div>}
      </Panel>
      <div className="text-center"><Btn color="bg-emerald-700" onClick={onDone} disabled={stopped}>Ολοκλήρωση Mode 1</Btn></div>
    </div>
  );
}
