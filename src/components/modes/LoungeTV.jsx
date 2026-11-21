import React from 'react';
import GameCard from '@/components/shared/GameCard';
import { LOUNGE_BOARD, SQUARE_TYPES, LOUNGE_PHASES, LOUNGE_FINALE, restraintFor, TICKLE_TOOLS } from '@/data/modes/loungeContent';
import { stars } from '@/components/modes/ActLounge';

const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('el-GR')}€`;

export default function LoungeTV({ state }) {
  const mg = state.mg || {};
  const lg = mg.lounge || {};
  const players = state.players || [];
  const stats = lg.stats || {};
  const pos = lg.pos || {};
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '';
  const cur = players.length ? players[(lg.turn || 0) % players.length] : null;
  const totalLoot = players.reduce((sum, p) => sum + (stats[p.id]?.loot || 0), 0);
  const now = Date.now();
  const phase = LOUNGE_PHASES[lg.phase || 0];

  if (lg.queen || mg.loungeQueen) {
    const queen = nameOf(lg.queen || mg.loungeQueen);
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center text-white">
        <div className="text-sm tracking-[0.5em] text-[#E8C26B]">VIP VAULT CERTIFICATE</div>
        <div className="text-8xl">👑</div>
        <div className="font-display text-6xl text-[#F7E3A8]">{queen}</div>
        <div className="text-2xl">{LOUNGE_FINALE.crown}</div>
        <p className="max-w-3xl text-lg text-white/75">{LOUNGE_FINALE.reward}</p>
      </div>
    );
  }

  const curStats = cur ? (stats[cur.id] || { stars: 1, loot: 0 }) : null;
  const roll = lg.lastRoll && now - lg.lastRoll.at < 5000 ? lg.lastRoll : null;
  const verdict = lg.verdict && now - lg.verdict.at < 9000 ? lg.verdict : null;
  const arrest = lg.interro && lg.interro.idx === 0 && now - Number(lg.interro.at || 0) < 5000 ? lg.interro : null;
  const breaking = verdict
    ? { kicker: 'ΕΤΥΜΗΓΟΡΙΑ', title: verdict.title, sub: `${nameOf(verdict.pid)} — ${verdict.text}`, color: '#E8C26B' }
    : arrest
      ? { kicker: 'BREAKING · ΣΥΛΛΗΨΗ', title: nameOf(arrest.pid), sub: 'Οδηγείται στην Καρέκλα Ανάκρισης', color: '#FF453A' }
      : roll
        ? { kicker: `🎲 ${nameOf(roll.pid)}`, title: String(roll.d), sub: `${SQUARE_TYPES[roll.square]?.icon} ${SQUARE_TYPES[roll.square]?.name} — ${SQUARE_TYPES[roll.square]?.text}`, color: SQUARE_TYPES[roll.square]?.color || '#E8C26B' }
        : null;
  const ticker = (mg.log || []).slice(0, 6).map((entry) => entry.text);
  const clock = new Date(now).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative space-y-4 pb-24 text-white">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3">
        <span className="rounded-md bg-[#FF453A] px-3 py-1 text-sm font-black tracking-[0.2em] text-white">● LIVE</span>
        <span className="font-display text-2xl tracking-[0.08em] text-[#F7E3A8]">PAJAMA HEIST & ARREST</span>
        <span className="text-sm text-white/60">Γύρος {lg.round || 1} · Φάση {(lg.phase || 0) + 1}/4 · {phase?.name}</span>
        <span className="ml-auto font-mono text-2xl">{clock}</span>
        <span className="rounded-md border border-[#E8C26B]/50 px-3 py-1 font-mono text-lg text-[#E8C26B]">LOOT {money(totalLoot)}</span>
      </div>

      {breaking && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 p-10 text-center" style={{ borderTop: `12px solid ${breaking.color}`, borderBottom: `12px solid ${breaking.color}` }}>
          <div className="rounded-md px-4 py-1 text-xl font-black tracking-[0.35em]" style={{ background: breaking.color, color: '#000' }}>{breaking.kicker}</div>
          <div className="mt-6 font-display text-[9rem] leading-none" style={{ color: breaking.color }}>{breaking.title}</div>
          <div className="mt-6 max-w-4xl text-3xl text-white/85">{breaking.sub}</div>
        </div>
      )}

      {lg.alert && now < lg.alert.until && (
        <div className="rounded-2xl border-2 border-[#FF453A] bg-[#2a0b09] p-5 text-center">
          <div className="font-display text-5xl text-[#FF453A]">{lg.alert.title}</div>
          <div className="mt-2 text-2xl">{lg.alert.text}</div>
          <div className="mt-2 font-mono text-4xl">{Math.ceil((lg.alert.until - now) / 1000)}″</div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-2">
        {LOUNGE_BOARD.map((type, i) => {
          const sq = SQUARE_TYPES[type];
          const here = players.filter((p) => (pos[p.id] || 0) === i);
          const last = lg.lastRoll && (pos[lg.lastRoll.pid] || 0) === i && now - lg.lastRoll.at < 8000;
          return (
            <div key={i} className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl text-center" style={{ background: `${sq.color}22`, border: `2px solid ${last ? '#fff' : `${sq.color}88`}` }}>
              <div className="text-3xl">{sq.icon}</div>
              <div className="text-xs opacity-80">{sq.name}</div>
              <div className="mt-1 flex flex-wrap justify-center gap-1">{here.map((p) => <span key={p.id} className="rounded-md px-1.5 text-sm font-bold" style={{ background: p.id === cur?.id ? '#E8C26B' : '#fff', color: '#000' }}>{p.name.slice(0, 3)}</span>)}</div>
            </div>
          );
        })}
      </div>
      {lg.lastRoll && now - lg.lastRoll.at < 15000 && <div className="text-center text-3xl">🎲 {nameOf(lg.lastRoll.pid)} έφερε <b className="text-[#E8C26B]">{lg.lastRoll.d}</b> → {SQUARE_TYPES[lg.lastRoll.square]?.icon} {SQUARE_TYPES[lg.lastRoll.square]?.name}</div>}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-2">
          {[...players].sort((a, b) => (stats[b.id]?.stars || 0) - (stats[a.id]?.stars || 0)).map((p) => {
            const s = stats[p.id] || { stars: 1, loot: 0, footwear: 4 };
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111] px-3 py-2">
                <b className="w-28 truncate text-lg">{p.id === lg.chief ? '👮 ' : ''}{p.name}</b>
                <span className="font-mono text-xl text-[#E8C26B]">{stars(s.stars)}</span>
                <span className="text-lg">{'🩴'.repeat(Math.min(2, s.footwear))}{'🧦'.repeat(Math.max(0, s.footwear - 2))}{s.footwear === 0 ? '🦶' : ''}</span>
                <span className="ml-auto font-mono text-lg">{money(s.loot)}</span>
                {s.cuffs && s.cuffs !== 'none' && <span>⛓️</span>}
                {s.immune && <span>🛡️</span>}
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {lg.card && <GameCard variant="tv" kicker={lg.card.market ? 'Μαύρη Αγορά' : 'Κάρτα Εντάλματος'} corner={nameOf(lg.card.pid)} icon={lg.card.market ? '🕶️' : '📜'} image={lg.card.image} title={lg.card.title} text={lg.card.text} footLeft={lg.card.secs ? `⏱ ${lg.card.secs}″` : ''} />}
          {lg.interro && (
            <div className="rounded-2xl border-2 border-[#FF453A] bg-[#140606] p-6 text-center">
              <div className="text-sm tracking-[0.4em] text-[#FF453A]">ΑΣΤΥΝΟΜΙΑ · ΑΝΑΚΡΙΣΗ {lg.interro.idx + 1}/3</div>
              <div className="mt-2 text-2xl">{nameOf(lg.interro.pid)} — {restraintFor(stats[lg.interro.pid]?.stars).name}</div>
              <div className="mt-4 font-display text-4xl leading-tight">{lg.interro.questions[lg.interro.idx]}</div>
              <div className="mt-3 text-lg opacity-75">Shot or Truth · οι υπόλοιπες ψηφίζουν κρυφά στο κινητό</div>
            </div>
          )}
          {lg.tickle && (
            <div className="rounded-2xl border-2 border-[#FF375F] bg-[#14060a] p-6 text-center">
              <div className="font-display text-4xl text-[#FF375F]">🪶 ΠΑΓΙΔΑ ΓΕΛΙΟΥ</div>
              <div className="mt-2 text-2xl">{nameOf(lg.tickle.pid)} · {lg.tickle.secs}″ · {TICKLE_TOOLS.join(' → ')}</div>
              <div className="mt-2 text-xl opacity-80">Ο Κανόνας της Σιωπής: χωρίς δυνατό γέλιο!</div>
            </div>
          )}
          {lg.verdict && now - lg.verdict.at < 20000 && (
            <div className="rounded-2xl border-2 border-[#E8C26B] p-5 text-center"><div className="font-display text-4xl text-[#E8C26B]">{lg.verdict.title}</div><div className="text-xl">{nameOf(lg.verdict.pid)} — {lg.verdict.text}</div></div>
          )}
          {lg.finale && (
            <div className="rounded-2xl border-2 border-[#E8C26B] bg-[#120f05] p-6 text-center">
              <div className="font-display text-5xl text-[#E8C26B]">👑 {LOUNGE_FINALE.title}</div>
              <div className="mt-3 font-mono text-6xl">{Math.max(0, LOUNGE_FINALE.seconds - Math.floor((now - lg.finale.startedAt) / 1000))}″</div>
              <div className="mt-3 text-xl">Λύσε τον 4ψήφιο γρίφο στο κινητό σου!</div>
              {lg.finale.winner && <div className="mt-3 text-3xl text-[#F7E3A8]">🔓 {nameOf(lg.finale.winner)} έλυσε πρώτη!</div>}
            </div>
          )}
          {!lg.card && !lg.interro && !lg.tickle && !lg.finale && <div className="rounded-2xl border border-white/10 p-6 text-center text-2xl opacity-80">🎲 {cur?.name}: ρίξε το ζάρι από το κινητό σου!</div>}
        </div>
      </div>

      {cur && (
        <div className="fixed bottom-14 left-6 z-[60] flex items-stretch overflow-hidden rounded-xl border border-[#E8C26B]/50 bg-black">
          <div className="bg-[#E8C26B] px-4 py-2 text-sm font-black tracking-[0.25em] text-black">ΣΤΗ ΣΕΙΡΑ</div>
          <div className="px-4 py-2">
            <div className="text-2xl font-bold">{cur.name}</div>
            <div className="text-sm text-white/70">{cur.id === lg.chief ? '👮 Police Chief' : 'Fugitive'} · <span className="text-[#E8C26B]">{stars(curStats.stars)}</span> · {money(curStats.loot)}</div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center gap-4 overflow-hidden border-t border-[#E8C26B]/40 bg-[#0b0b0c] px-4 py-2">
        <span className="shrink-0 rounded bg-[#FF453A] px-2 py-0.5 text-xs font-black tracking-widest">ΤΩΡΑ</span>
        <div className="flex min-w-0 gap-6 whitespace-nowrap text-lg">
          {ticker.length ? ticker.map((text, index) => <span key={index} className={`shrink-0 ${index ? 'text-white/55' : 'text-white'}`}>{text}</span>) : <span className="text-white/55">Η εκπομπή ξεκινά…</span>}
        </div>
      </div>
    </div>
  );
}
