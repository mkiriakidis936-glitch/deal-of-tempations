import React, { useState } from 'react';
import GameCard from '@/components/shared/GameCard';
import { SQUARE_TYPES, restraintFor, LOUNGE_FINALE } from '@/data/modes/loungeContent';
import { stars, rulesForGame } from '@/components/modes/ActLounge';
import { Card, Button, ButtonRow, Stats, Badge, Input } from '@/design/ui';
import ShowMobile from '@/components/modes/ShowMobile';

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
  const board = rulesForGame(state.mode, lg).board;
  const footwear = `${'🩴'.repeat(Math.min(2, s.footwear))}${'🧦'.repeat(Math.max(0, s.footwear - 2))}` || '🦶';

  if (lg.ceremony) return <ShowMobile state={state} me={me} updateState={updateState} />;
  if (lg.queen || mg.loungeQueen) {
    const queen = lg.queen || mg.loungeQueen;
    return (
      <Card tone="gold" className="text-center space-y-2">
        <div className="text-5xl">👑</div>
        <div className="ui-title ui-title--gold" style={{ fontSize: 24 }}>{queen === me.id ? 'Είσαι η Ultimate Pajama Police Queen!' : `${nameOf(queen)} είναι η βασίλισσα!`}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Stats items={[
        { label: 'Αστέρια', value: stars(s.stars), gold: true, small: true },
        { label: 'Λεία', value: money(s.loot) },
        { label: 'Παπούτσια', value: footwear, small: true },
      ]} />

      <div className="flex flex-wrap gap-2">
        <Badge tone={lg.chief === me.id ? 'gold' : undefined}>{lg.chief === me.id ? '👮 Είσαι ο Αστυνόμος' : `Φυγάς · Αστυνόμος: ${nameOf(lg.chief)}`}</Badge>
        {s.immune && <Badge tone="green">🛡️ Ασυλία</Badge>}
        {s.cuffs !== 'none' && <Badge tone="red">⛓️ Χειροπέδες</Badge>}
        {s.footwear === 0 && <Badge tone="red">🦶 Barefoot Target</Badge>}
      </div>
      <div className="ui-subtitle px-1" style={{ fontSize: 13 }}>Δέσιμο: {restraintFor(s.stars).name} · Θέση: {SQUARE_TYPES[board[lg.pos?.[me.id] || 0]]?.name}</div>

      {lg.alert && now < lg.alert.until && (
        <Card tone="danger" className="text-center">
          <div className="font-bold" style={{ color: 'var(--ui-red)' }}>{lg.alert.title}</div>
          <div className="text-[15px]">{lg.alert.text}</div>
        </Card>
      )}

      {myTurn && !pending && (
        <Button variant="primary" size="xl" block disabled={!!mg.playerAction} onClick={() => sendAction('lounge_roll')}>🎲 Ρίξε ζάρι</Button>
      )}
      {!myTurn && !pending && <div className="ui-subtitle text-center">Σειρά: <b style={{ color: 'var(--ui-text)' }}>{cur?.name}</b></div>}
      {lg.lastRoll && now - lg.lastRoll.at < 10000 && <div className="text-center text-[15px]">🎲 {nameOf(lg.lastRoll.pid)} έφερε {lg.lastRoll.d} → {SQUARE_TYPES[lg.lastRoll.square]?.icon} {SQUARE_TYPES[lg.lastRoll.square]?.name}</div>}

      {lg.card && lg.card.pid === me.id && <GameCard variant="compact" kicker={lg.card.market ? 'Μαύρη Αγορά' : 'Κάρτα Εντάλματος'} icon={lg.card.market ? '🕶️' : '📜'} image={lg.card.image} title={lg.card.title} text={lg.card.text} footLeft={lg.card.secs ? `⏱ ${lg.card.secs}″` : ''} />}

      {lg.mission && lg.mission.pid === me.id && now < lg.mission.until && (
        <div className="space-y-2">
          <GameCard variant="compact" kicker="Μυστική αποστολή" corner="Μόνο για σένα" icon="🩴" title={lg.mission.title} text={lg.mission.text} footLeft={`${Math.ceil((lg.mission.until - now) / 1000)}″`} />
          <Button variant="success" block disabled={!!mg.playerAction} onClick={() => sendAction('lounge_mission_done')}>Τα κατάφερα</Button>
        </div>
      )}

      {it && (
        <Card tone="danger" className="space-y-3 text-center">
          <div className="ui-eyebrow" style={{ color: 'var(--ui-red)' }}>Ανάκριση · {nameOf(it.pid)} · {it.idx + 1}/3</div>
          <div className="text-[19px] font-semibold leading-snug">{it.questions[it.idx]}</div>
          {it.pid === me.id
            ? <div className="ui-subtitle">Απάντα δυνατά ή πιες 1 σφηνάκι. Οι άλλες ψηφίζουν.</div>
            : voted
              ? <div className="ui-subtitle">Η ψήφος σου καταχωρήθηκε κρυφά ✓</div>
              : (
                <ButtonRow>
                  <Button variant="success" onClick={() => updateState({ loungeVotes: { [me.id]: `${voteKey}:truth` } })}>Αλήθεια</Button>
                  <Button variant="danger" onClick={() => updateState({ loungeVotes: { [me.id]: `${voteKey}:lie` } })}>Ψέμα</Button>
                </ButtonRow>
              )}
        </Card>
      )}

      {lg.tickle && <Card tone="danger" className="text-center">{lg.tickle.pid === me.id ? '🪶 Παγίδα Γέλιου: μη γελάσεις δυνατά!' : `🪶 Παγίδα Γέλιου για ${nameOf(lg.tickle.pid)}`}</Card>}

      <ShowMobile state={state} me={me} updateState={updateState} />

      {lg.finale && (
        <Card tone="gold" className="space-y-3">
          <div className="text-center text-[20px] font-bold" style={{ color: 'var(--ui-gold)' }}>👑 {LOUNGE_FINALE.title}</div>
          {(lg.finale.riddle || []).map((r) => <div key={r} className="text-[15px]">• {r}</div>)}
          {lg.finale.winner
            ? <div className="text-center font-semibold">{lg.finale.winner === me.id ? '🔓 Το έλυσες πρώτη! Φόρεσε τις σαγιονάρες σου και πάτα LOCKDOWN COMPLETE!' : `🔓 ${nameOf(lg.finale.winner)} το έλυσε πρώτη`}</div>
            : (
              <div className="space-y-2">
                <Input code inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="____" aria-label="Κωδικός 4 ψηφίων" />
                <Button variant="primary" block disabled={code.length !== 4 || !!mg.playerAction} onClick={() => { sendAction('lounge_code', { code }); setCode(''); }}>Ξεκλείδωμα</Button>
              </div>
            )}
        </Card>
      )}
    </div>
  );
}
