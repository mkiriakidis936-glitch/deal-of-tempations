import { playShowVideo } from '@/components/tv/TVShowVideos';
import React, { useEffect, useRef } from 'react';
import { tvStingers } from '@/lib/tvStingers';
import { tallyVotes } from '@/lib/boardEngine';
import { tvSfx } from '@/lib/modeKit';
import GameCard from '@/components/shared/GameCard';
import { SQUARE_TYPES, LOUNGE_FINALE, restraintFor, TICKLE_TOOLS } from '@/data/modes/loungeContent';
import { stars, rulesForGame } from '@/components/modes/ActLounge';
import { TvScreen, TvBar, TvLeaderboard } from '@/design/ui';
import GameDurationClock from '@/components/shared/GameDurationClock';
import { GoldenBand, VoteBar, DossierCard, OnAirTakeover, WeatherTakeover, CeremonyTakeover, newsTicker } from '@/components/modes/ShowTV';

const PARAMS = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const IS_PREVIEW = PARAMS.get('preview') === '1';
// Πολλές οθόνες: /tv?code=…&view=scores (κατάταξη) ή view=board (ταμπλό). Χωρίς view = κύρια οθόνη.
export const TV_VIEW = ['scores', 'board'].includes(PARAMS.get('view')) ? PARAMS.get('view') : 'main';

// Παίζει τα τηλεοπτικά stingers όταν αλλάζει κάτι στο ταμπλό (όχι στο πρώτο άνοιγμα, όχι σε προεπισκόπηση, όχι σε ΣΤΟΠ).
export function useTvStingers(lounge, { muted = false } = {}) {
  const prev = useRef(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = lounge || {};
    if (!before || muted || IS_PREVIEW || TV_VIEW !== 'main') return;
    const events = tvStingers(before, lounge || {});
    events.forEach((name, i) => setTimeout(() => tvSfx[name]?.(), i * 120));
    const STINGER = { arrest: 'stinger_arrest', loot: 'stinger_loot', alert: 'stinger_raid', truth: 'stinger_verdict', lie: 'stinger_verdict' };
    const video = events.map((name) => STINGER[name]).find(Boolean);
    if (video) playShowVideo(video);
  }, [lounge, muted]);
}

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
  useTvStingers(lg, { muted: !!(mg.tvSfxOff || state.stopActive || mg.stop) });
  const RULES = rulesForGame(state.mode, lg);
  const phase = RULES.phases[Math.min(lg.phase || 0, RULES.phases.length - 1)];

  if ((lg.queen || mg.loungeQueen) && !lg.ceremony) {
    const queen = nameOf(lg.queen || mg.loungeQueen);
    return (
      <TvScreen className="min-h-[70vh] items-center justify-center text-center">
        <div className="ui-tv-eyebrow ui-tv-eyebrow--gold">VIP Vault Certificate</div>
        <div className="text-8xl">👑</div>
        <div className="ui-tv-title ui-tv-title--xl ui-tv-title--gold">{queen}</div>
        <div className="ui-tv-text">{LOUNGE_FINALE.crown}</div>
        <p className="ui-tv-muted max-w-4xl">{LOUNGE_FINALE.reward}</p>
      </TvScreen>
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
  const ticker = [...newsTicker(lg, nameOf), ...(mg.log || []).slice(0, 6).map((entry) => entry.text)].slice(0, 8);
  const clock = new Date(now).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });

  return (
    <TvScreen className="relative pb-10" style={TV_VIEW === 'scores' ? { '--tv-unit': 'clamp(12px, 1.1vw, 42px)' } : undefined}>
      <TvBar
        title={(RULES.title || 'PAJAMA HEIST & ARREST').toUpperCase()}
        meta={`Γύρος ${lg.round || 1} · Φάση ${(lg.phase || 0) + 1}/${RULES.phases.length} · ${phase?.name || ''}`}
        right={<><GameDurationClock state={state} inline /><span className="ui-tv-num ui-tv-text">{clock}</span><span className="ui-tv-pill">ΛΕΙΑ {money(totalLoot)}</span></>}
      />

      <GoldenBand lg={lg} now={now} />
      <OnAirTakeover lg={lg} now={now} />
      <WeatherTakeover lg={lg} players={players} now={now} startedAt={state.gameStartedAt} />
      <CeremonyTakeover lg={lg} />
      {breaking && (
        <div className="ui-tv-takeover" style={{ borderTop: `12px solid ${breaking.color}`, borderBottom: `12px solid ${breaking.color}` }}>
          <div className="ui-tv-live" style={{ background: breaking.color, color: '#000' }}>{breaking.kicker}</div>
          <div className="ui-tv-title" style={{ fontSize: 'calc(var(--tv-unit) * 10)', color: breaking.color }}>{breaking.title}</div>
          <div className="ui-tv-text max-w-5xl">{breaking.sub}</div>
        </div>
      )}

      {lg.alert && now < lg.alert.until && (
        <div className="ui-card ui-card--danger text-center">
          <div className="ui-tv-title ui-tv-title--red">{lg.alert.title}</div>
          <div className="ui-tv-text mt-2">{lg.alert.text}</div>
          <div className="ui-tv-num ui-tv-title mt-2">{Math.ceil((lg.alert.until - now) / 1000)}″</div>
        </div>
      )}

      {TV_VIEW !== 'scores' && <div className="grid grid-cols-7 gap-2">
        {RULES.board.map((type, i) => {
          const sq = SQUARE_TYPES[type];
          const here = players.filter((p) => (pos[p.id] || 0) === i);
          const last = lg.lastRoll && (pos[lg.lastRoll.pid] || 0) === i && now - lg.lastRoll.at < 8000;
          return (
            <div key={i} className="flex flex-col items-center justify-center rounded-xl text-center" style={{ height: TV_VIEW === 'board' ? '21vh' : '10.5vh', background: `${sq.color}22`, border: `2px solid ${last ? '#fff' : `${sq.color}88`}` }}>
              <div style={{ fontSize: 'calc(var(--tv-unit) * 2)' }}>{sq.icon}</div>
              <div className="ui-tv-muted" style={{ fontSize: 'calc(var(--tv-unit) * 0.95)' }}>{sq.name}</div>
              <div className="mt-1 flex flex-wrap justify-center gap-1">{here.map((p) => <span key={p.id} className="rounded-md px-1.5 text-sm font-bold" style={{ background: p.id === cur?.id ? '#E8C26B' : '#fff', color: '#000' }}>{p.name.slice(0, 3)}</span>)}</div>
            </div>
          );
        })}
      </div>}
      {TV_VIEW === 'board' && cur && <div className="text-center ui-tv-title">🎲 Στη σειρά: <span className="ui-tv-title--gold">{cur.name}</span></div>}
      {lg.lastRoll && now - lg.lastRoll.at < 15000 && <div className="text-center ui-tv-text">🎲 {nameOf(lg.lastRoll.pid)} έφερε <b className="text-[#E8C26B]">{lg.lastRoll.d}</b> → {SQUARE_TYPES[lg.lastRoll.square]?.icon} {SQUARE_TYPES[lg.lastRoll.square]?.name}</div>}

      {TV_VIEW !== 'board' && <div className={`grid gap-4 ${TV_VIEW === 'scores' ? 'grid-cols-1' : 'grid-cols-[1fr_1.1fr]'}`}>
        <div className="space-y-3">
        {cur && (
          <div className="flex items-stretch overflow-hidden rounded-2xl border border-[#E8C26B]/50 bg-black">
            <div className="flex items-center px-4 ui-tv-eyebrow" style={{ background: 'var(--ui-gold)', color: '#000' }}>Στη σειρά</div>
            <div className="px-5 py-2">
              <div className="ui-tv-text font-bold">{cur.name}</div>
              <div className="ui-tv-muted">{cur.id === lg.chief ? '👮 Αστυνόμος' : 'Φυγάς'} · <span style={{ color: 'var(--ui-gold)' }}>{stars(curStats.stars)}</span> · {money(curStats.loot)}</div>
            </div>
          </div>
        )}
        <TvLeaderboard rows={[...players].sort((a, b) => (stats[b.id]?.stars || 0) - (stats[a.id]?.stars || 0)).map((p) => {
          const s = stats[p.id] || { stars: 1, loot: 0, footwear: 4 };
          return {
            id: p.id,
            name: `${p.id === lg.chief ? '👮 ' : ''}${p.name}`,
            extra: <span className="flex items-center gap-3"><span style={{ color: 'var(--ui-gold)' }}>{stars(s.stars)}</span><span>{'🩴'.repeat(Math.min(2, s.footwear))}{'🧦'.repeat(Math.max(0, s.footwear - 2))}{s.footwear === 0 ? '🦶' : ''}</span>{s.cuffs && s.cuffs !== 'none' && <span>⛓️</span>}{s.immune && <span>🛡️</span>}</span>,
            value: money(s.loot),
          };
        })} />
        </div>

        <div className="space-y-3">
          <DossierCard lg={lg} nameOf={nameOf} now={now} />
          {lg.card && <GameCard variant="tv" kicker={lg.card.market ? 'Μαύρη Αγορά' : 'Κάρτα Εντάλματος'} corner={nameOf(lg.card.pid)} icon={lg.card.market ? '🕶️' : '📜'} image={lg.card.image} title={lg.card.title} text={lg.card.text} footLeft={lg.card.secs ? `⏱ ${lg.card.secs}″` : ''} />}
          {lg.interro && (
            <div className="ui-card ui-card--danger space-y-3 text-center">
              <div className="ui-tv-eyebrow ui-tv-eyebrow--red">Αστυνομία · Ανάκριση {lg.interro.idx + 1}/3</div>
              <div className="ui-tv-text">{nameOf(lg.interro.pid)} — {restraintFor(stats[lg.interro.pid]?.stars).name}</div>
              <div className="ui-tv-title">{lg.interro.questions[lg.interro.idx]}</div>
              <div className="ui-tv-muted">Shot or Truth · οι υπόλοιπες ψηφίζουν κρυφά στο κινητό</div>
              <VoteBar tally={state.loungeTally?.[`${lg.interro.id}:${lg.interro.idx}`] || tallyVotes(state.loungeVotes, `${lg.interro.id}:${lg.interro.idx}`)} />
            </div>
          )}
          {lg.tickle && (
            <div className="ui-card ui-card--danger space-y-2 text-center">
              <div className="ui-tv-title ui-tv-title--red">🪶 Παγίδα Γέλιου</div>
              <div className="ui-tv-text">{nameOf(lg.tickle.pid)} · {lg.tickle.secs}″ · {TICKLE_TOOLS.join(' → ')}</div>
              <div className="ui-tv-muted">Ο Κανόνας της Σιωπής: χωρίς δυνατό γέλιο!</div>
            </div>
          )}
          {lg.verdict && now - lg.verdict.at < 20000 && (
            <div className="ui-card ui-card--gold text-center"><div className="ui-tv-title ui-tv-title--gold">{lg.verdict.title}</div><div className="ui-tv-text mt-2">{nameOf(lg.verdict.pid)} — {lg.verdict.text}</div></div>
          )}
          {lg.finale && (
            <div className="ui-card ui-card--gold space-y-3 text-center">
              <div className="ui-tv-title ui-tv-title--gold">👑 {LOUNGE_FINALE.title}</div>
              <div className="ui-tv-num ui-tv-title--xl ui-tv-title">{Math.max(0, LOUNGE_FINALE.seconds - Math.floor((now - lg.finale.startedAt) / 1000))}″</div>
              <div className="ui-tv-text">Λύσε τον 4ψήφιο γρίφο στο κινητό σου!</div>
              {lg.finale.winner && <div className="ui-tv-title ui-tv-title--gold">🔓 {nameOf(lg.finale.winner)} έλυσε πρώτη!</div>}
            </div>
          )}
          {!lg.card && !lg.interro && !lg.tickle && !lg.finale && <div className="ui-card text-center ui-tv-text">🎲 <b>{cur?.name}</b>: ρίξε το ζάρι από το κινητό σου!</div>}
        </div>
      </div>}

      <div className="ui-tv-ticker">
        <span className="ui-tv-live shrink-0">ΤΩΡΑ</span>
        <div className="flex min-w-0 gap-6 whitespace-nowrap">
          {ticker.length ? ticker.map((text, index) => <span key={index} className={`shrink-0 ${index ? 'text-white/55' : 'text-white'}`}>{text}</span>) : <span className="text-white/55">Η εκπομπή ξεκινά…</span>}
        </div>
      </div>
    </TvScreen>
  );
}
