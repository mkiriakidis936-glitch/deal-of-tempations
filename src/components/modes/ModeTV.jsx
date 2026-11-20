import React, { useEffect } from 'react';
import GameCard from '@/components/shared/GameCard';
import { MODE_THEMES, modeMeta, ACT_META } from '@/data/modes/modeRegistry';
import { EXT_END, EXT_ZONES, zoneOf, squareType, ROUTES } from '@/data/modes/extendedContent';
import { EXIT_CODE, syncExitCode } from '@/data/modes/lockdownContent';
import { consentPending } from '@/lib/consent';
import { ConsentTV } from '@/components/modes/ConsentCheckIn';
import { fmt, timerLeft, useTick, setGameStopActive } from '@/lib/modeKit';

// Τηλεόραση (/tv) για τα 4 νέα modes. Δεν δείχνει ποτέ κρυφές κάρτες, ερωτήσεις ψιθύρων ή μυστικές αποστολές.
export default function ModeTV({ state }) {
  const mg = state.mg || {};
  syncExitCode(mg);
  const meta = modeMeta(state.mode);
  const theme = MODE_THEMES[state.mode];
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
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4" style={{ color: '#fff' }}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 text-4xl sm:text-6xl"><span>{meta.icon}</span><span className="mode-large-title">{meta.name}</span></div>
          <div className="text-lg opacity-70">{ACT_META[act]?.title}</div>
        </div>
        {mg.timer && <div className={`font-display text-6xl sm:text-8xl tabular-nums ${left < 60 || surge ? 'comic-pulse' : ''}`} style={{ color: left < 60 || surge ? '#FF453A' : theme.accent2 }}>{fmt(left)}</div>}
      </div>

      {mg.stop && <div className="rounded-xl p-6 text-center font-display text-5xl" style={{ background: '#5A1410' }}>⏸ ΣΤΟΠ — έλεγχος ότι όλες είναι ΟΚ</div>}
      {surge && <div className="rounded-xl p-6 text-center font-display text-4xl animate-pulse" style={{ background: '#7A1A15' }}>MIDNIGHT PENALTY SURGE · +5′</div>}
      {mg.finishedAll && <div className="rounded-xl p-6 text-center font-display text-5xl" style={{ background: '#120F05', border: '2px solid #E8C26B', color: '#E8C26B' }}>🏆 {ranking[0]?.name} ΝΙΚΗΤΡΙΑ!</div>}

      {act === 'lockdown' && (
        <div className="rounded-xl p-6 text-center space-y-3" style={{ background: '#000', border: '2px solid #FF453A' }}>
          <div className="text-xl opacity-70">{{ init: 'Αναμονή Lockdown…', l1: 'Level 1 · The Hostage Sacrifice', l2: 'Level 2 · The 18+ Sensory Cipher', l3: 'Level 3 · Midnight Sock Heist', exit: 'EXIT CODE', won: '🎆 ΑΠΟΔΡΑΣΗ — VIP VAULT UNLOCKED', lost: '💀 LOCKDOWN FAILED' }[ld.stage || 'init']}</div>
          <div className="flex justify-center gap-4">
            {EXIT_CODE.split('').map((d, i) => (
              <div key={i} className="w-20 h-28 flex items-center justify-center font-display text-6xl rounded-lg" style={{ border: `3px solid ${(ld.revealed || [])[i] ? '#E8C26B' : '#FF453A'}`, color: '#E8C26B' }}>{(ld.revealed || [])[i] ? d : '🔒'}</div>
            ))}
          </div>
        </div>
      )}

      {act === 'villa' && <div className="rounded-xl p-8 text-center text-4xl" style={{ background: '#120F05', border: '2px solid #E8C26B' }}>🏡 VILLA — 48 ΩΡΕΣ<div className="text-xl opacity-80 mt-3">{['Άφιξη','Ημέρα','Απόγευμα','Νύχτα','Πρωινή Φάση','Δεύτερη Ημέρα','Τελικό SHOW','FINALE'][mg.villaPhaseIndex || 0]}</div><div className="text-sm opacity-60 mt-2">Φάση {(mg.villaPhaseIndex || 0) + 1}/8</div></div>}
      {act === 'pedi_glam' && <div className="rounded-xl p-8 text-center text-3xl" style={{ background: '#0B0B0C', border: '2px solid #F0B85A' }}>💅 Pajama Pedi-Glam<div className="text-lg opacity-70 mt-2">Sensory & Pamper Edition · {mg.pediGlamUsed || 0}/20 κάρτες ολοκληρωμένες</div></div>}
      {act === 'board' && <TVBoard mg={mg} players={players} />}
      {act === 'midnight' && <div className="rounded-xl p-8 text-center text-3xl" style={{ background: '#0b0418', border: '2px solid #E8C26B' }}>🌙 Midnight ASMR & Tickle Vault<div className="text-lg opacity-70 mt-2">Φώτα χαμηλά. Οι ερωτήσεις ψιθυρίζονται — δεν φαίνονται εδώ.</div></div>}
      {act === 'morning' && (
        <div className="rounded-xl p-8 text-center text-3xl" style={{ background: '#120F05', border: '2px solid #E8C26B' }}>
          {mg.vaultUnlocked ? '👑 VIP VAULT UNLOCKED — The Ultimate Pajama Queens' : `☕ The Coffee Code is Hidden · ψήγματα ${(mg.morningFound || []).length}/4`}
        </div>
      )}
      {act === 'beach' && (
        <div className="space-y-3">
          <div className="text-2xl opacity-80">{({ checkin: '🩴 Check-in', dance: '🎶 Dance & Freeze', wheel: '🎡 Τροχός Ποινών', truth: '🥃 Shot & Truth', finale: '👑 The Last Queen Standing' })[bb.phase || 'checkin']}</div>
          {bb.freeze && <div className="rounded-xl p-6 text-center font-display text-4xl comic-pulse" style={{ background: '#141416', border: '3px solid #F0B85A' }}>📯 {bb.freeze.cmd}</div>}
          {bb.wheel && <GameCard variant="tv" kicker="Τροχός ποινών" corner={players.find((p) => p.id === bb.wheel.pid)?.name} icon="🎡" image={bb.wheel.card.image} accent="#F0B85A" title={bb.wheel.card.title} text={bb.wheel.card.text} footLeft={bb.wheel.card.secs ? `⏱ ${bb.wheel.card.secs}″` : ''} />}
          {bb.queen && <div className="rounded-xl p-6 text-center font-display text-5xl" style={{ color: '#E8C26B', background: '#120F05' }}>👑 BEACH QUEEN: {players.find((p) => p.id === bb.queen)?.name}</div>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ranking.map((p, i) => (
          <div key={p.id} className="rounded-lg p-3" style={{ background: '#ffffff0d', border: `1px solid ${i === 0 ? theme.accent2 : '#ffffff22'}` }}>
            <div className="font-heading text-xl truncate">{p.name}</div>
            <div className="text-sm opacity-80">
              {act === 'beach' ? `🥃 ${(bb.drinks || {})[p.id] || 0} · 🩴 ${(bb.flops || {})[p.id] === false ? '✗' : '✓'}` : `🪙 ${(mg.tokens || {})[p.id] || 0}`} · ⭐ {(mg.scores || {})[p.id] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
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
      {mg.branch && <div className="rounded-xl p-4 text-center text-2xl" style={{ background: '#120F05', border: '2px solid #E8C26B' }}>🔀 {players.find((p) => p.id === mg.branch)?.name} διαλέγει: {Object.values(ROUTES).map((r) => r.icon + ' ' + r.name).join('  ή  ')}</div>}
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
