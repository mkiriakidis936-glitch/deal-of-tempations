import React, { useState } from 'react';
import GameCard from '@/components/shared/GameCard';
import { SQUARE_TYPES, LOUNGE_BOARD, restraintFor, LOUNGE_FINALE } from '@/data/modes/loungeContent';
import { stars } from '@/components/modes/ActLounge';

const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('el-GR')}€`;

export default function LoungeMobile({ state, me, sendAction, updateState }) {
  const mg = state.mg || {};
  const lg = mg.lounge || {};
  const players = state.players || [];
  const s = lg.stats?.[me.id] || { stars: 1, loot: 0, footwear: 4, cuffs: 'none' };
  const cur = players.length ? players[(lg.turn || 0) % players.length] : null;
  const myTurn = cur?.id === me.id;
  const pending = !!(lg.card || lg.interro || lg.tickle || lg.finale);
  const [code, setCode] = useState('');
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '';
  const it = lg.interro;
  const voteKey = it ? `${it.id}:${it.idx}` : '';
  const myVote = String(state.loungeVotes?.[me.id] || '');
  const voted = voteKey && myVote.startsWith(`${voteKey}:`);
  const now = Date.now();

  if (lg.queen || mg.loungeQueen) {
    const queen = lg.queen || mg.loungeQueen;
    return (
      <div className="rounded-2xl border border-[#E8C26B] p-5 text-center">
        <div className="text-5xl">👑</div>
        <div className="font-heading text-2xl text-[#E8C26B]">{queen === me.id ? 'Είσαι η Ultimate Pajama Police Queen!' : `${nameOf(queen)} είναι η βασίλισσα!`}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-[#121214] p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xl text-[#E8C26B]">{stars(s.stars)}</span>
          <span className="font-mono text-lg">{money(s.loot)}</span>
        </div>
        <div className="mt-1 text-sm">{'🩴'.repeat(Math.min(2, s.footwear))}{'🧦'.repeat(Math.max(0, s.footwear - 2))}{s.footwear === 0 ? ' 🦶 Barefoot Target' : ''}{s.immune ? ' · 🛡️ ασυλία' : ''}{s.cuffs !== 'none' ? ' · ⛓️ χειροπέδες' : ''}</div>
        <div className="mt-1 text-xs opacity-70">{lg.chief === me.id ? '👮 Είσαι ο Αστυνόμος αυτού του γύρου — φοράς το κλειδί!' : `Fugitive · Αστυνόμος: ${nameOf(lg.chief)}`}</div>
        <div className="mt-1 text-xs opacity-60">Δέσιμο επιπέδου: {restraintFor(s.stars).name} · Θέση: {SQUARE_TYPES[LOUNGE_BOARD[lg.pos?.[me.id] || 0]]?.name}</div>
      </div>

      {lg.alert && now < lg.alert.until && <div className="rounded-2xl border-2 border-[#FF453A] p-3 text-center"><b className="text-[#FF453A]">{lg.alert.title}</b><div className="text-sm">{lg.alert.text}</div></div>}

      {myTurn && !pending && (
        <button type="button" disabled={!!mg.playerAction} onClick={() => sendAction('lounge_roll')} className="w-full rounded-2xl bg-[#E8C26B] py-6 text-2xl font-black text-black disabled:opacity-40">🎲 ΡΙΞΕ ΖΑΡΙ</button>
      )}
      {!myTurn && !pending && <div className="text-center text-sm opacity-70">Σειρά: {cur?.name}</div>}
      {lg.lastRoll && now - lg.lastRoll.at < 10000 && <div className="text-center text-sm">🎲 {nameOf(lg.lastRoll.pid)} έφερε {lg.lastRoll.d} → {SQUARE_TYPES[lg.lastRoll.square]?.icon} {SQUARE_TYPES[lg.lastRoll.square]?.name}</div>}

      {lg.card && lg.card.pid === me.id && <GameCard variant="compact" kicker={lg.card.market ? 'Μαύρη Αγορά' : 'Κάρτα Εντάλματος'} icon={lg.card.market ? '🕶️' : '📜'} image={lg.card.image} title={lg.card.title} text={lg.card.text} footLeft={lg.card.secs ? `⏱ ${lg.card.secs}″` : ''} />}

      {lg.mission && lg.mission.pid === me.id && now < lg.mission.until && (
        <div className="space-y-2">
          <GameCard variant="compact" kicker="Μυστική αποστολή" corner="Μόνο για σένα" icon="🩴" title={lg.mission.title} text={lg.mission.text} footLeft={`${Math.ceil((lg.mission.until - now) / 1000)}″`} />
          <button type="button" disabled={!!mg.playerAction} onClick={() => sendAction('lounge_mission_done')} className="w-full rounded-xl bg-emerald-700 py-3 font-bold disabled:opacity-40">ΤΑ ΚΑΤΑΦΕΡΑ</button>
        </div>
      )}

      {it && (
        <div className="rounded-2xl border-2 border-[#FF453A] bg-[#140606] p-3 space-y-2 text-center">
          <div className="text-xs tracking-widest text-[#FF453A]">ΑΝΑΚΡΙΣΗ · {nameOf(it.pid)} · {it.idx + 1}/3</div>
          <div className="font-heading text-lg">{it.questions[it.idx]}</div>
          {it.pid === me.id
            ? <div className="text-sm">Απάντα δυνατά ή πιες 1 σφηνάκι. Οι άλλες ψηφίζουν.</div>
            : voted
              ? <div className="text-sm">Η ψήφος σου καταχωρήθηκε κρυφά ✓</div>
              : (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => updateState({ loungeVotes: { [me.id]: `${voteKey}:truth` } })} className="rounded-xl bg-emerald-700 py-3 font-bold">ΑΛΗΘΕΙΑ</button>
                  <button type="button" onClick={() => updateState({ loungeVotes: { [me.id]: `${voteKey}:lie` } })} className="rounded-xl bg-red-800 py-3 font-bold">ΨΕΜΑ</button>
                </div>
              )}
        </div>
      )}

      {lg.tickle && <div className="rounded-2xl border-2 border-[#FF375F] p-3 text-center">{lg.tickle.pid === me.id ? '🪶 Decibel Trap: μη γελάσεις δυνατά!' : `🪶 Decibel Trap για ${nameOf(lg.tickle.pid)}`}</div>}

      {lg.finale && (
        <div className="rounded-2xl border-2 border-[#E8C26B] bg-[#120f05] p-3 space-y-2">
          <div className="text-center font-heading text-xl text-[#E8C26B]">👑 {LOUNGE_FINALE.title}</div>
          {(lg.finale.riddle || []).map((r) => <div key={r} className="text-sm">• {r}</div>)}
          {lg.finale.winner
            ? <div className="text-center font-bold">{lg.finale.winner === me.id ? '🔓 Το έλυσες πρώτη! Φόρεσε τις σαγιονάρες σου και πάτα LOCKDOWN COMPLETE!' : `🔓 ${nameOf(lg.finale.winner)} το έλυσε πρώτη`}</div>
            : (
              <div className="flex gap-2">
                <input inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="____" className="min-w-0 flex-1 rounded-xl border border-[#E8C26B]/50 bg-black px-3 py-3 text-center font-mono text-2xl tracking-[0.5em]" />
                <button type="button" disabled={code.length !== 4 || !!mg.playerAction} onClick={() => { sendAction('lounge_code', { code }); setCode(''); }} className="rounded-xl bg-[#E8C26B] px-4 font-bold text-black disabled:opacity-40">ΞΕΚΛΕΙΔΩΜΑ</button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
