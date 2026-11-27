import React from 'react';
import { SQUARE_TYPES, VILLA_RINGS, STRIP_STEPS, KIND_LABEL, COPS_GAME, VILLA_PUNISH_WHEEL, VILLA_TWISTS } from '@/data/modes/villaContent';
import * as V from '@/lib/villaEngine';
import { rankPlayers, pointsOf } from '@/lib/modeRanking';
import { modeArtUrl, artSectionFor } from '@/components/modes/ModeArt';
import { useTick } from '@/lib/modeKit';

// VILLA TAKEOVER — κεντρική οθόνη: φάση, ταμπλό 3 κύκλων, Round Strip, τρέχον τετράγωνο/κάρτα, κωδικός, κατάταξη, μηνύματα οθόνης.
export default function VillaTV({ state }) {
  useTick(true, 1000);
  const mg = state.mg || {};
  const v = mg.villa || {};
  const players = state.players || [];
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '—';
  if (!mg.villa) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-center text-white"><div><div className="text-[5vw] font-bold">🏝️ VILLA TAKEOVER 48/72</div><div className="text-[2vw] text-white/60">Η βίλα ετοιμάζεται να κλειδώσει…</div></div></div>;
  }
  const no = v.sq || 1;
  const square = V.squareAt(no, v);
  const phase = V.phaseOf(no, v);
  const type = SQUARE_TYPES[square?.type] || SQUARE_TYPES.flow;
  const ring = VILLA_RINGS[square?.ring] || VILLA_RINGS.outer;
  const now = Date.now();
  const alert = (v.alerts || []).find((a) => a.to === 'all' && now - a.at < 120000);
  const ranking = rankPlayers(players, mg).slice(0, 8);
  const found = V.cluesFound(v);
  const art = modeArtUrl(state.mode, artSectionFor(state) || phase.media, state);
  const statue = V.statueActive(v, now) ? Math.ceil((v.statue.until - now) / 1000) : 0;
  const command = V.commandActive(v, now) ? v.command : null;
  const morning = square?.morning ? (v.morningSummary || V.morningReveal(v)) : null;
  const surge = v.surge && now - v.surge < 20000;
  const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;
  const cardKind = v.card ? (v.card.deckLabel || KIND_LABEL[v.card.kind]) : '';
  const wheel = v.wheel && square?.wheel ? VILLA_PUNISH_WHEEL.find((w) => w.id === v.wheel) : null;
  const twist = v.twist && square?.twist ? VILLA_TWISTS.find((t) => t.id === v.twist) : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white" style={{ background: v.night ? '#02030a' : '#000' }}>
      {art && <img src={art} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: v.night ? 0.08 : 0.18 }} />}
      <div className="relative grid h-screen grid-cols-[1fr_min(28vw,520px)]" style={{ gap: u(1.6), padding: `${u(4.5)} ${u(2.4)} ${u(2)}` }}>
        <div className="flex min-h-0 flex-col" style={{ gap: u(1.1) }}>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-semibold uppercase tracking-[0.3em] text-[#E8C26B]" style={{ fontSize: u(1.05) }}>Villa Takeover {V.hoursOf(v)}h · {phase.zone}{v.night ? ' · 🌙 Night Mode' : ''}</div>
              <div className="font-bold leading-none" style={{ fontSize: u(3) }}>{phase.title}</div>
            </div>
            <div className="text-right tabular-nums text-white/60" style={{ fontSize: u(1.3) }}>Τετράγωνο <b className="text-white">{no}</b> / {V.lastSquare(v)}</div>
          </div>
          <div className="grid grid-cols-12" style={{ gap: u(0.35) }}>
            {V.boardOf(v).map((s) => {
              const current = s.no === no;
              const past = s.no < no;
              return (
                <div key={s.no} className="flex items-center justify-center rounded-lg font-bold tabular-nums"
                  style={{ height: u(V.hoursOf(v) === 72 ? 2 : 2.6), fontSize: u(0.95), background: current ? '#E8C26B' : past ? '#1C1C1E' : `${VILLA_RINGS[s.ring].color}2e`, color: current ? '#000' : past ? '#636366' : '#fff', boxShadow: current ? '0 0 0 3px #F7E3A8' : 'none' }}>
                  {s.clue !== undefined && !past && !current ? '🔑' : s.no}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-4" style={{ gap: u(0.5) }}>
            {STRIP_STEPS.map((s) => (
              <div key={s.step} className="rounded-xl text-center font-semibold" style={{ padding: u(0.5), fontSize: u(0.95), background: (v.strip || 0) >= s.step ? '#E8C26B' : '#1C1C1E', color: (v.strip || 0) >= s.step ? '#000' : '#8E8E93' }}>👟 {s.step}. {s.item}</div>
            ))}
          </div>
          {square && (
            <div className="min-h-0 flex-1 overflow-hidden rounded-3xl bg-[#1C1C1E]/90" style={{ padding: u(1.6) }}>
              <div className="flex flex-wrap" style={{ gap: u(0.6) }}>
                <span className="inline-flex rounded-full font-bold" style={{ background: `${type.color}26`, color: type.color, fontSize: u(1), padding: `${u(0.3)} ${u(1)}` }}>{type.icon} {type.label}</span>
                <span className="inline-flex rounded-full font-bold" style={{ background: `${ring.color}26`, color: ring.color, fontSize: u(1), padding: `${u(0.3)} ${u(1)}` }}>{ring.title} · {ring.subtitle}</span>
              </div>
              <div className="font-bold leading-tight" style={{ fontSize: u(2.4), marginTop: u(0.6) }}>#{square.no} · {square.title}</div>
              {v.card ? (
                <div style={{ marginTop: u(0.8) }}>
                  <div className="font-semibold text-[#E8C26B]" style={{ fontSize: u(1.35) }}>🎴 {cardKind}{v.card.pid ? ` για ${nameOf(v.card.pid)}` : ''}{v.card.secs ? ` · ⏱ ${v.card.secs}″` : ''}</div>
                  {v.card.image && <img src={v.card.image} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full rounded-2xl object-cover" style={{ marginTop: u(0.6), maxHeight: u(13) }} />}
                  <div className="font-semibold" style={{ fontSize: u(1.9), marginTop: u(0.4) }}>{v.card.no ? `#${v.card.no} — ` : ''}{v.card.title}</div>
                  <div className="text-white/80" style={{ fontSize: u(1.4), marginTop: u(0.4) }}>{v.card.text}</div>
                </div>
              ) : <div className="text-white/80" style={{ fontSize: u(1.55), marginTop: u(0.8) }}>{square.action === 'strip' ? STRIP_STEPS[square.step - 1].tv : square.text}</div>}
              {wheel && <div className="font-semibold text-[#FF9F0A]" style={{ fontSize: u(1.4), marginTop: u(0.8) }}>🎡 {wheel.title} — <span className="font-normal text-white/80">{wheel.text}</span></div>}
              {twist && <div className="font-semibold text-[#BF5AF2]" style={{ fontSize: u(1.4), marginTop: u(0.8) }}>🌀 {twist.tv}</div>}
              {v.cops && square?.cops && <div style={{ fontSize: u(1.3), marginTop: u(0.8) }}><b className="text-[#FF453A]">🚨 {COPS_GAME.phases[v.cops.phase].title}</b> · 👮‍♀️ {v.cops.cops.map(nameOf).join(', ')} · 🚔 {v.cops.caught.map(nameOf).join(', ') || '—'}</div>}
              {morning && <div style={{ fontSize: u(1.4), marginTop: u(0.8) }}>☀️ Χωρίς κάλτσες: <b>{morning.victims.map(nameOf).join(', ') || 'καμία'}</b> · 🧦 Πρώτη σε Sock Loot: <b className="text-[#E8C26B]">{morning.top ? nameOf(morning.top) : '—'}</b></div>}
              {v.vote?.open && <div className="font-semibold text-[#64D2FF]" style={{ fontSize: u(1.35), marginTop: u(0.8) }}>🗳️ {v.vote.q} · Ψηφίστε από το κινητό · {Object.keys(v.vote.votes || {}).length}/{players.length}</div>}
              {command && <div className="font-semibold text-[#FF453A]" style={{ fontSize: u(1.35), marginTop: u(0.8) }}>🟥 ΑΠΟΛΥΤΗ ΔΙΑΤΑΓΗ · Διοικητής: {nameOf(command.pid)} · {command.title}</div>}
            </div>
          )}
        </div>
        <aside className="flex min-h-0 flex-col" style={{ gap: u(1.1) }}>
          <div className="rounded-3xl bg-[#1C1C1E]/90" style={{ padding: u(1.3) }}>
            <div className="font-semibold uppercase tracking-[0.2em] text-[#E8C26B]" style={{ fontSize: u(0.9) }}>Ο τετραψήφιος κωδικός</div>
            <div className="grid grid-cols-4" style={{ gap: u(0.6), marginTop: u(0.7) }}>
              {[0, 1, 2, 3].map((i) => <div key={i} className="flex items-center justify-center rounded-2xl font-bold" style={{ height: u(3.6), fontSize: u(2), background: i < found ? '#E8C26B' : '#2C2C2E', color: i < found ? '#000' : '#636366' }}>{i < found ? '★' : '?'}</div>)}
            </div>
            {v.winner && <div className="font-semibold text-[#30D158]" style={{ fontSize: u(1.15), marginTop: u(0.7) }}>🔓 Lockdown Override: {nameOf(v.winner)}</div>}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-3xl bg-[#1C1C1E]/90" style={{ padding: u(1.3) }}>
            <div className="font-semibold uppercase tracking-[0.2em] text-[#E8C26B]" style={{ fontSize: u(0.9) }}>{v.revealed ? 'Μεγάλη Αποκάλυψη' : 'Ζωντανή κατάταξη'}</div>
            <ol style={{ marginTop: u(0.5) }}>
              {ranking.map((p, i) => {
                const role = v.revealed ? V.roleOf(v.roles?.[p.id]) : null;
                return (
                  <li key={p.id} className="flex items-center justify-between border-b border-white/10 last:border-0" style={{ fontSize: u(1.25), padding: `${u(0.4)} 0` }}>
                    <span><span className="inline-block text-white/45" style={{ width: u(2) }}>{i + 1}</span>{i === 0 ? '👑 ' : ''}{p.name}{v.revealed ? <span className="text-white/55"> · {role ? `${role.icon} ${role.name}` : 'Villa Guest'}</span> : ''}</span>
                    <span className="font-bold tabular-nums text-[#E8C26B]">{pointsOf(mg, p.id)}</span>
                  </li>
                );
              })}
            </ol>
            {v.revealed && (v.alliances || []).length > 0 && <div className="text-white/70" style={{ fontSize: u(1), marginTop: u(0.6) }}>🤝 {v.alliances.map((a) => `${a.broken ? '💔 ' : ''}${a.type ? `${a.type}: ` : ''}${a.members.map(nameOf).join(' + ')}`).join(' · ')}</div>}
          </div>
          <div className="text-white/50" style={{ fontSize: u(0.85) }}>{Object.values(VILLA_RINGS).map((r) => `${r.no}. ${r.title} (${r.subtitle})`).join(' · ')}</div>
        </aside>
      </div>
      {alert && !statue && (
        <div className="absolute inset-x-0 top-0 flex justify-center" style={{ paddingTop: u(1) }} role="status">
          <div className="max-w-[90vw] rounded-full bg-[#E8C26B] font-bold text-black" style={{ fontSize: u(1.2), padding: `${u(0.6)} ${u(2)}` }}>🔔 {alert.title} — {alert.text}</div>
        </div>
      )}
      {statue > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-center" role="alert">
          <div className="font-black tracking-[0.2em]" style={{ fontSize: u(9) }}>🗿 ΑΓΑΛΜΑ</div>
          <div className="text-white/75" style={{ fontSize: u(1.8) }}>Παγώστε όλοι στη στάση που βρίσκεστε.</div>
          <div className="font-bold tabular-nums text-[#E8C26B]" style={{ fontSize: u(7) }}>{statue}</div>
        </div>
      )}
      {surge && !statue && (
        <div className="absolute inset-x-0 bottom-0 bg-[#FF453A] text-center font-black" style={{ fontSize: u(2.2), padding: u(1) }} role="alert">🚨 ALARM / PENALTY SURGE — λάθος κωδικός</div>
      )}
    </div>
  );
}
