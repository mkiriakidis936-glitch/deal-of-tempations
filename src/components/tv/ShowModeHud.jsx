import React from 'react';
import { Ticker, Podiums, MarqueeSign } from '@/components/modes/ShowKit';
import { GAME_MODES } from '@/data/gameConfig';
import * as E from '@/lib/campaignEngine';

// 12.0.0 · Game show σε ΟΛΑ τα modes της TV.
// 1) Μπάρα ειδήσεων στο κάτω μέρος (όχι στην Ταινία/Lounge/Villa, που έχουν δική τους).
// 2) «2η οθόνη» (/tv?code=…&view=scores): μεγάλη οθόνη με podium, όπου υπάρχουν πόντοι.
// Μόνο εμφάνιση· διαβάζει την κατάσταση, δεν αλλάζει τίποτα.

const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;
export const TV_VIEW_PARAM = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null;

// Κατάταξη με πόντους: Ταινία (cg) ή νέα modes (mg.scores + tokens). Αλλιώς null (π.χ. Classic με κάρμα).
export function showRanking(state = {}) {
  const players = (state.players || []).filter((p) => !p.bot);
  const mg = state.mg || {};
  if (mg.cg) return E.ranking(mg.cg, players, { final: mg.cg.status === 'finale' }).map((p) => ({ ...p, stats: p.stats }));
  if (mg.scores && Object.keys(mg.scores).length) {
    const total = (id) => (mg.scores[id] || 0) + ((mg.tokens || {})[id] || 0);
    return [...players].sort((a, b) => total(b.id) - total(a.id)).map((p) => ({ id: p.id, name: p.name, score: total(p.id), stats: { tokens: (mg.tokens || {})[p.id] || 0 } }));
  }
  return null;
}

export function ShowScoresScreen({ state }) {
  const rank = showRanking(state);
  const players = state.players || [];
  const name = GAME_MODES.find((m) => m.id === state.mode)?.name || 'Deal of Temptation';
  return (
    <div className="show-stage fixed inset-0 z-[60] flex flex-col text-white">
      <div className="flex justify-center" style={{ padding: `${u(2.4)} ${u(2)} 0` }}><MarqueeSign kicker="Live · κατάταξη" title={name} u={u} /></div>
      <div className="flex flex-1 items-end justify-center" style={{ padding: `${u(4)} ${u(3)} ${u(2)}` }}>
        <div className="w-full" style={{ maxWidth: u(120) }}>{rank?.length ? <Podiums rank={rank} players={players} u={(n) => u(n * 1.6)} /> : <div className="show-kicker text-center" style={{ fontSize: u(1.4) }}>Η κατάταξη εμφανίζεται μόλις μπουν πόντοι.</div>}</div>
      </div>
      <Ticker u={u} items={tickerItems(state, rank)} />
    </div>
  );
}

function tickerItems(state, rank) {
  const mg = state.mg || {};
  const name = GAME_MODES.find((m) => m.id === state.mode)?.name;
  const wantedPlayer = (state.players || []).filter((p) => !p.bot).sort((a, b) => (b.bounty || 0) - (a.bounty || 0))[0];
  return [
    name && `🎬 ${name} · LIVE`,
    rank?.[0] && rank[0].score > 0 && `👑 ΣΤΗΝ ΚΟΡΥΦΗ: ${rank[0].name} με ${rank[0].score}`,
    wantedPlayer?.bounty > 0 && `🎯 ΚΑΤΑΖΗΤΟΥΜΕΝΗ: ${wantedPlayer.name}`,
    (mg.stop || state.stopActive) && '⏸ ΣΤΟΠ — όλα σε παύση',
    'PASS και ΣΤΟΠ ισχύουν πάντα',
  ];
}

export default function ShowModeHud({ state }) {
  const mg = state?.mg || {};
  if (!state || state.stage === 0) return null;
  if (TV_VIEW_PARAM === 'scores' && !mg.lounge) return <ShowScoresScreen state={state} />;
  if (mg.cg || mg.lounge || mg.villa) return null; // έχουν δική τους μπάρα/κατάταξη
  return <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[50]"><Ticker u={u} items={tickerItems(state, showRanking(state))} /></div>;
}
