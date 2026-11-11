import React, { useState } from 'react';
import PajamaBindingStatus from '@/components/pajama/PajamaBindingStatus';
import PajamaBoard from '@/components/pajama/PajamaBoard';
import PajamaSaboteur from '@/components/pajama/PajamaSaboteur';
import PajamaStage from '@/components/pajama/PajamaStage';
import PajamaStageHeader from '@/components/pajama/PajamaStageHeader';
import PajamaCardStage from '@/components/pajama/PajamaCardStage';
import PajamaPlaybill from '@/components/pajama/PajamaPlaybill';
import { getAtmosphere } from '@/data/pajamaAtmosphere';

export default function PajamaDashboard({ players, pj, act, categories, currentPlayer, onRoll, onResolve, onUnbind, onSabotage, onCompleteOrder }) {
  const [showSab, setShowSab] = useState(false);
  const card = pj.activeCard;
  const cat = card ? (categories || []).find((c) => c.id === card.categoryId) : null;
  const atmo = getAtmosphere(pj.actIndex);

  return (
    <PajamaStage atmo={atmo}>
      <div className="mx-auto w-full max-w-6xl space-y-3 px-4 pb-28 pt-4">
        <PajamaStageHeader
          act={act}
          atmo={atmo}
          round={pj.actRound || 1}
          totalRounds={act?.rounds}
          currentPlayer={currentPlayer}
        />

        {pj.lastResult && (
          <div
            className="rounded-lg px-3 py-2 text-center text-sm font-bold"
            style={
              pj.lastResult.delta >= 0
                ? { background: 'rgba(16,90,60,.5)', color: '#c9ffe1', border: '1px solid rgba(120,255,190,.35)' }
                : { background: 'rgba(120,20,40,.5)', color: '#ffd9df', border: '1px solid rgba(255,140,150,.35)' }
            }
          >
            {pj.lastResult.name}: {pj.lastResult.delta > 0 ? `+${pj.lastResult.delta}` : pj.lastResult.delta} πόντοι
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-[1fr_270px]">
          <div className="space-y-3">
            <PajamaBindingStatus bindings={pj.bindings} players={players} onUnbind={onUnbind} />

            {pj.swaps?.length > 0 && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(0,0,0,.35)', border: `1px solid ${atmo.border}`, color: atmo.dim }}>
                👟 {pj.swaps.map((s) => `${s.playerName} ⇄ ${s.targetName}`).join(' · ')}
              </div>
            )}

            {!card ? (
              <div
                className="rounded-2xl p-3"
                style={{
                  background: 'rgba(0,0,0,.38)',
                  border: `1px solid ${atmo.border}`,
                  boxShadow: `0 24px 60px rgba(0,0,0,.7), inset 0 0 0 1px ${atmo.accentSoft}`,
                }}
              >
                <PajamaBoard players={players} pj={pj} currentPlayer={currentPlayer} onRoll={onRoll} />
              </div>
            ) : (
              <PajamaCardStage card={card} cat={cat} atmo={atmo} onResolve={onResolve} />
            )}
          </div>

          <div className="space-y-2">
            <PajamaPlaybill players={players} pj={pj} atmo={atmo} />

            <button
              onClick={() => setShowSab(true)}
              className="w-full rounded-lg py-2.5 font-heading text-sm"
              style={{ background: 'rgba(60,10,60,.55)', border: '1px solid rgba(230,120,255,.45)', color: '#f4d6ff' }}
            >
              😈 SECRET SABOTEUR — κρυφό σαμποτάζ κάλτσας
            </button>

            {pj.sabotages?.length > 0 && (
              <div className="rounded-lg px-3 py-2 text-center text-xs" style={{ background: 'rgba(60,10,60,.3)', border: '1px solid rgba(230,120,255,.25)', color: '#e9c8f5' }}>
                🧦 {pj.sabotages.length} σαμποτάζ μέχρι τώρα
              </div>
            )}
          </div>
        </div>
      </div>

      {showSab && (
        <PajamaSaboteur
          players={players}
          pj={pj}
          onSabotage={onSabotage}
          onCompleteOrder={onCompleteOrder}
          onClose={() => setShowSab(false)}
        />
      )}
    </PajamaStage>
  );
}