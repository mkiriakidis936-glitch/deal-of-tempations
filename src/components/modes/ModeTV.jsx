import React, { useEffect } from 'react';
import GameCard from '@/components/shared/GameCard';
import { modeMeta, ACT_META } from '@/data/modes/modeRegistry';
import { EXT_END, EXT_ZONES, zoneOf, squareType, ROUTES } from '@/data/modes/extendedContent';
import { EXIT_CODE, syncExitCode } from '@/data/modes/lockdownContent';
import { consentPending } from '@/lib/consent';
import { ConsentTV } from '@/components/modes/ConsentCheckIn';
import LoungeTV from '@/components/modes/LoungeTV';
import { fmt, timerLeft, useTick, setGameStopActive } from '@/lib/modeKit';
import { TvScreen, TvLeaderboard } from '@/design/ui';

// Τηλεόραση (/tv) για τα 4 νέα modes. Δεν δείχνει ποτέ κρυφές κάρτες, ερωτήσεις ψιθύρων ή μυστικές αποστολές.
export default function ModeTV({ state }) {
  const mg = state.mg || {};
  syncExitCode(mg);
  const meta = modeMeta(state.mode);
    const players = state.players || [];
  const act = meta.acts[Math.min(mg.actIndex || 0, meta.acts.length - 1)];
  useEffect(() => { setGameStopActive(!!(mg.stop || state.stopActive)); }, [mg.stop, state.stopActive]);
  useTick(true, 1000);
  const left = timerLeft(mg.timer);
  const ld = mg.ld || {};
  const bb = mg.bb || {};
  const surge = ld.surge && !ld.surgeDone;
  const total = (p) => ((mg.scores || {})[p.id] || 0) + ((mg.tokens || {})[p.id] || 0);
  const ranking = [...players].sort((a, b) => total(b) - total(a));

  if (consentPending(mg)) return <ConsentTV state={state} />;

  return (
    <TvScreen className="mx-auto max-w-[min(96vw,2600px)] p-4">
      {act !== 'lounge' && (
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="ui-tv-eyebrow ui-tv-eyebrow--gold">{ACT_META[act]?.title}</div>
            <div className="ui-tv-title">{meta.icon} {meta.name}</div>
          </div>
          {mg.timer && <div className={`ui-tv-num ui-timer ${left < 60 || surge ? 'ui-timer--danger' : ''}`} style={{ fontSize: 'calc(var(--tv-unit) * 6)' }}>{fmt(left)}</div>}
        </div>
      )}

      {mg.stop && <div className="ui-card ui-card--danger text-center"><div className="ui-tv-title ui-tv-title--red">⏸ Όλα σταμάτησαν</div><div className="ui-tv-text mt-2">Αναμονή για ομόφωνη συναίνεση πριν τη συνέχεια.</div></div>}
      {act === 'lounge' && <LoungeTV state={state} />}
      {surge && <div className="ui-card ui-card--danger text-center text-4xl">MIDNIGHT PENALTY SURGE · +5′</div>}
      {mg.finishedAll && <div className="ui-card ui-card--gold text-center text-5xl">🏆 {ranking[0]?.name} ΝΙΚΗΤΡΙΑ!</div>}

      {act === 'lockdown' && (
        <div className="ui-card ui-card--danger text-center space-y-3">
          <div className="text-xl opacity-70">{{ init: 'Αναμονή Lockdown…', l1: 'Level 1 · The Hostage Sacrifice', l2: 'Level 2 · The 18+ Sensory Cipher', l3: 'Level 3 · Midnight Sock Heist', exit: 'EXIT CODE', won: '🎆 ΑΠΟΔΡΑΣΗ — VIP VAULT UNLOCKED', lost: '💀 LOCKDOWN FAILED' }[ld.stage || 'init']}</div>
          <div className="flex justify-center gap-4">
            {EXIT_CODE.split('').map((d, i) => (
              <div key={i} className="w-20 h-28 flex items-center justify-center font-display text-6xl rounded-lg" style={{ border: `3px solid ${(ld.revealed || [])[i] ? '#E8C26B' : '#FF453A'}`, color: '#E8C26B' }}>{(ld.revealed || [])[i] ? d : '🔒'}</div>
            ))}
          </div>
        </div>
      )}

      {act === 'villa' && <div className="ui-card ui-card--gold text-center text-4xl">🏡 VILLA — 48 ΩΡΕΣ<div className="text-xl opacity-80 mt-3">{['Άφιξη','Ημέρα','Απόγευμα','Νύχτα','Πρωινή Φάση','Δεύτερη Ημέρα','Τελικό SHOW','FINALE'][mg.villaPhaseIndex || 0]}</div><div className="text-sm opacity-60 mt-2">Φάση {(mg.villaPhaseIndex || 0) + 1}/8</div></div>}
      {act === 'pedi_glam' && <div className="ui-card ui-card--gold text-center text-3xl">💅 Pajama Pedi-Glam<div className="text-lg opacity-70 mt-2">Sensory & Pamper Edition · {mg.pediGlamUsed || 0}/20 κάρτες ολοκληρωμένες</div></div>}
      {act === 'board' && <TVBoard mg={mg} players={players} />}
      {act === 'midnight' && <div className="ui-card ui-card--gold text-center text-3xl">🌙 Midnight ASMR & Tickle Vault<div className="text-lg opacity-70 mt-2">Φώτα χαμηλά. Οι ερωτήσεις ψιθυρίζονται — δεν φαίνονται εδώ.</div></div>}
      {act === 'morning' && (
        <div className="ui-card ui-card--gold text-center text-3xl">
          {mg.vaultUnlocked ? '👑 VIP VAULT UNLOCKED — The Ultimate Pajama Queens' : `☕ The Coffee Code is Hidden · ψήγματα ${(mg.morningFound || []).length}/4`}
        </div>
      )}
      {act === 'beach' && (
        <div className="space-y-3">
          <div className="text-2xl opacity-80">{({ checkin: '🩴 Check-in', dance: '🎶 Dance & Freeze', wheel: '🎡 Τροχός Ποινών', truth: '🥃 Shot & Truth', finale: '👑 The Last Queen Standing' })[bb.phase || 'checkin']}</div>
          {bb.freeze && <div className="ui-card ui-card--gold text-center text-4xl">📯 {bb.freeze.cmd}</div>}
          {bb.wheel && <GameCard variant="tv" kicker="Τροχός ποινών" corner={players.find((p) => p.id === bb.wheel.pid)?.name} icon="🎡" image={bb.wheel.card.image} accent="#F0B85A" title={bb.wheel.card.title} text={bb.wheel.card.text} footLeft={bb.wheel.card.secs ? `⏱ ${bb.wheel.card.secs}″` : ''} />}
          {bb.queen && <div className="ui-card ui-card--gold text-center text-5xl">👑 BEACH QUEEN: {players.find((p) => p.id === bb.queen)?.name}</div>}
        </div>
      )}

      {act !== 'lounge' && (
        <TvLeaderboard rows={ranking.map((p) => ({
          id: p.id,
          name: p.name,
          extra: <span className="ui-tv-muted">{act === 'beach' ? `🥃 ${(bb.drinks || {})[p.id] || 0} · 🩴 ${(bb.flops || {})[p.id] === false ? '✗' : '✓'}` : `🪙 ${(mg.tokens || {})[p.id] || 0}`}</span>,
          value: `⭐ ${(mg.scores || {})[p.id] || 0}`,
        }))} />
      )}
    </TvScreen>
  );
}

function TVBoard({ mg, players }) {
  const pos = mg.pos || {};
  const cur = players[(mg.turn || 0) % Math.max(1, players.length)];
  return (
    <div className="space-y-3">
      <div className="text-2xl">Σειρά: <b>{cur?.name}</b>{mg.lastRoll ? ` · 🎲 ${mg.lastRoll.d}` : ''}</div>
      <div className="grid grid-cols-12 gap-1.5">
        {Array.from({ length: EXT_END + 1 }, (_, i) => {
          const z = zoneOf(i);
          const here = players.filter((p) => (pos[p.id] || 0) === i);
          return (
            <div key={i} className="aspect-square rounded flex flex-col items-center justify-center text-lg" style={{ background: `${z.color}22`, border: `1px solid ${z.color}${here.length ? 'ff' : '55'}` }}>
              <span className="opacity-60 text-sm">{({ start: '🚩', card: '🎴', rest: '🛋️', branch: '🔀', portal: '🚪', finish: '👑' })[squareType(i)]}</span>
              <span className="flex">{here.map((p) => <b key={p.id} className="px-0.5 text-sm" style={{ background: p.id === cur?.id ? '#E8C26B' : '#fff', color: '#000' }}>{p.name[0]}</b>)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 text-sm opacity-80">{EXT_ZONES.map((z) => <span key={z.id}><i className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: z.color }} />{z.name}</span>)}</div>
      {mg.branch && <div className="ui-card ui-card--gold text-center text-2xl">🔀 {players.find((p) => p.id === mg.branch)?.name} διαλέγει: {Object.values(ROUTES).map((r) => r.icon + ' ' + r.name).join('  ή  ')}</div>}
      {mg.card && (
        <GameCard
          variant="tv"
          kicker={ROUTES[mg.card.route].name}
          corner={players.find((p) => p.id === mg.card.playerId)?.name}
          icon={ROUTES[mg.card.route].icon}
          image={mg.card.image}
          accent={ROUTES[mg.card.route].color}
          title={mg.card.title}
          text={mg.card.text}
          footLeft={mg.card.secs ? `⏱ ${mg.card.secs}″` : ''}
          footRight={`+${mg.card.reward || (mg.card.free ? 1 : ROUTES[mg.card.route].reward)} 🪙`}
        />
      )}
    </div>
  );
}
