import React from 'react';
import { VILLA_SQUARES, SQUARE_TYPES, VILLA_CYCLES } from '@/data/modes/villaContent';
import * as V from '@/lib/villaEngine';
import { rankPlayers, pointsOf } from '@/lib/modeRanking';
import { modeArtUrl, artSectionFor } from '@/components/modes/ModeArt';

// VILLA TAKEOVER — η κεντρική οθόνη: ταμπλό 48 τετραγώνων, τρέχον τετράγωνο, κάρτα, κωδικός και ζωντανή κατάταξη.
export default function VillaTV({ state }) {
  const mg = state.mg || {};
  const v = mg.villa || {};
  const players = state.players || [];
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '—';
  const square = V.squareAt(v.sq || 1);
  const cycle = V.cycleOf(v.sq || 1);
  const type = SQUARE_TYPES[square?.type] || SQUARE_TYPES.flow;
  const alert = (v.alerts || []).find((a) => a.to === 'all' && Date.now() - a.at < 120000);
  const ranking = rankPlayers(players, mg).slice(0, 8);
  const found = V.cluesFound(v);
  const art = modeArtUrl(state.mode, artSectionFor(state) || cycle.id);
  const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white" style={{ background: v.night ? '#02030a' : '#000' }}>
      {art && <img src={art} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: v.night ? 0.08 : 0.18 }} />}
      <div className="relative grid h-screen grid-cols-[1fr_min(28vw,520px)]" style={{ gap: u(1.6), padding: `${u(4.5)} ${u(2.4)} ${u(2)}` }}>
        <div className="flex min-h-0 flex-col" style={{ gap: u(1.2) }}>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-semibold uppercase tracking-[0.3em] text-[#E8C26B]" style={{ fontSize: u(1.1) }}>Villa Takeover · Κύκλος {cycle.no}{v.night ? ' · 🌙 Night Mode' : ''}</div>
              <div className="font-bold leading-none" style={{ fontSize: u(3.2) }}>{cycle.title}</div>
            </div>
            <div className="text-right tabular-nums text-white/60" style={{ fontSize: u(1.3) }}>Τετράγωνο <b className="text-white">{v.sq || 1}</b> / {V.lastSquare(v)}</div>
          </div>
          <div className="grid grid-cols-12" style={{ gap: u(0.4) }}>
            {VILLA_SQUARES.filter((s) => s.no <= V.lastSquare(v)).map((s) => {
              const t = SQUARE_TYPES[s.type];
              const current = s.no === v.sq;
              const past = s.no < (v.sq || 1);
              return (
                <div key={s.no} className="flex items-center justify-center rounded-lg font-bold tabular-nums"
                  style={{ height: u(2.6), fontSize: u(1), background: current ? '#E8C26B' : past ? '#1C1C1E' : `${t.color}26`, color: current ? '#000' : past ? '#636366' : '#fff', boxShadow: current ? '0 0 0 3px #F7E3A8' : 'none' }}>
                  {s.clue !== undefined && !past && !current ? '🔑' : s.no}
                </div>
              );
            })}
          </div>
          {square && (
            <div className="min-h-0 flex-1 rounded-3xl bg-[#1C1C1E]/90" style={{ padding: u(1.8) }}>
              <div className="inline-flex rounded-full font-bold" style={{ background: `${type.color}26`, color: type.color, fontSize: u(1), padding: `${u(0.3)} ${u(1)}` }}>{type.icon} {type.label}</div>
              <div className="font-bold leading-tight" style={{ fontSize: u(2.6), marginTop: u(0.6) }}>#{square.no} · {square.title}</div>
              {v.card ? (
                <div style={{ marginTop: u(1) }}>
                  <div className="font-semibold text-[#E8C26B]" style={{ fontSize: u(1.4) }}>🎴 {v.card.kind === 'truth' ? 'Αλήθεια 18+' : v.card.kind === 'dare' ? 'Θάρρος 18+' : 'Τελεσίγραφο'} για {nameOf(v.card.pid)}</div>
                  <div className="font-semibold" style={{ fontSize: u(2), marginTop: u(0.4) }}>{v.card.title}</div>
                  <div className="text-white/80" style={{ fontSize: u(1.5), marginTop: u(0.4) }}>{v.card.text}</div>
                </div>
              ) : <div className="text-white/80" style={{ fontSize: u(1.6), marginTop: u(0.8) }}>{square.text}</div>}
              {v.vote?.open && <div className="font-semibold text-[#64D2FF]" style={{ fontSize: u(1.4), marginTop: u(1) }}>🗳️ Ψηφίστε από το κινητό · {Object.keys(v.vote.votes || {}).length}/{players.length}</div>}
            </div>
          )}
        </div>
        <aside className="flex min-h-0 flex-col" style={{ gap: u(1.2) }}>
          <div className="rounded-3xl bg-[#1C1C1E]/90" style={{ padding: u(1.4) }}>
            <div className="font-semibold uppercase tracking-[0.2em] text-[#E8C26B]" style={{ fontSize: u(0.9) }}>Ο κωδικός της Villa</div>
            <div className="grid grid-cols-4" style={{ gap: u(0.6), marginTop: u(0.8) }}>
              {[0, 1, 2, 3].map((i) => <div key={i} className="flex items-center justify-center rounded-2xl font-bold" style={{ height: u(4), fontSize: u(2.2), background: i < found ? '#E8C26B' : '#2C2C2E', color: i < found ? '#000' : '#636366' }}>{i < found ? '★' : '?'}</div>)}
            </div>
            {v.winner && <div className="font-semibold text-[#30D158]" style={{ fontSize: u(1.2), marginTop: u(0.8) }}>🔓 Lockdown Override: {nameOf(v.winner)}</div>}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-3xl bg-[#1C1C1E]/90" style={{ padding: u(1.4) }}>
            <div className="font-semibold uppercase tracking-[0.2em] text-[#E8C26B]" style={{ fontSize: u(0.9) }}>Ζωντανή κατάταξη</div>
            <ol style={{ marginTop: u(0.6) }}>
              {ranking.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between border-b border-white/10 last:border-0" style={{ fontSize: u(1.35), padding: `${u(0.45)} 0` }}>
                  <span><span className="inline-block text-white/45" style={{ width: u(2) }}>{i + 1}</span>{i === 0 ? '👑 ' : ''}{p.name}</span>
                  <span className="font-bold tabular-nums text-[#E8C26B]">{pointsOf(mg, p.id)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="text-white/50" style={{ fontSize: u(0.9) }}>{VILLA_CYCLES.filter((c) => !c.extension || v.extended).map((c) => `${c.no}. ${c.title}`).join(' · ')}</div>
        </aside>
      </div>
      {alert && (
        <div className="absolute inset-x-0 top-0 flex justify-center" style={{ paddingTop: u(1) }} role="status">
          <div className="rounded-full bg-[#E8C26B] font-bold text-black" style={{ fontSize: u(1.3), padding: `${u(0.6)} ${u(2)}` }}>🔔 {alert.title} — {alert.text}</div>
        </div>
      )}
    </div>
  );
}
