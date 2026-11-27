import React from 'react';
import WorldMap from '@/components/modes/WorldMap';
import * as E from '@/lib/campaignEngine';
import { NAIL_COLORS, TOKEN_USES, WANTED_LEVELS, STATE_LABELS, VALUE_LABELS, STATUS_LABEL, BUYOUT_TOKENS, trialOf, cardOf } from '@/data/modes/campaignContent';
import { useTick } from '@/lib/modeKit';
import MovieShowMobile from '@/components/modes/MovieShowMobile';

const Card = ({ title, children, tone }) => (
  <section className="mvg-glass mvg-3d p-4" style={tone ? { background: `linear-gradient(160deg, ${tone}ee, #0b0b10cc)` } : undefined}>
    {title && <div className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/55">{title}</div>}
    {children}
  </section>
);
const VOTE_OPTIONS = { truth: ['Ισχύει', 'Μπλόφα'], believe: ['Την πιστεύω', 'Την κρίνω'], verdict: ['Αθώα', 'Ένοχη', 'Ασυλία'], choice: ['Σίγουρα +3', 'Ρίσκο 50/50'] };

// DEAL OF TEMPTATION — Η ΤΑΙΝΙΑ · κινητό (/play): προσωπική κάρτα ηπείρου, σκορ, κατάσταση, νύχια, tokens, ψήφοι.
export default function CampaignMobile({ state, me, sendAction }) {
  useTick(true, 1000);
  const mg = state.mg || {};
  const cg = mg.cg;
  const players = state.players || [];
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '—';
  if (!cg) return <Card><div className="text-white/70">Η ταινία ετοιμάζεται… Ο χάρτης των 5 ηπείρων ανοίγει σε λίγο.</div></Card>;
  const act = E.currentAct(cg);
  const s = E.statsOf(cg, me.id);
  const status = cg.status || 'transition';
  const rank = E.ranking(cg, players, { final: status === 'finale' });
  const myPos = rank.findIndex((p) => p.id === me.id) + 1;
  const trial = cg.trial && !cg.trial.done ? trialOf(cg.trial.id) : null;
  const myTrial = trial && cg.trial.pid === me.id;
  const left = E.trialSecondsLeft(cg);
  const card = cg.card ? cardOf(cg.card.id) : null;
  const votes = cg.votes;
  const myBallot = votes?.ballots?.[me.id];
  const top3 = rank.slice(0, 3).map((p) => p.id);
  const drawnMe = cg.drawn?.pid === me.id && Date.now() - cg.drawn.at < 20000;
  const changed = cg.previously && Date.now() - cg.previously.at < 60000;

  return (
    <div className="mvg space-y-3 text-white">
      <div className="mvg-marquee"><span>Deal of Temptation</span><b>Η ΤΑΙΝΙΑ</b><span>{act.info.name}</span></div>
      <MovieShowMobile cg={cg} me={me} nameOf={nameOf} sendAction={sendAction} />
      {changed && status !== 'finale' && <Card tone="#3A0A12"><div className="font-bold">🗺️ Νέα ήπειρος: {act.info.name}</div><div className="text-sm text-white/75">Πράξη {act.index + 1}: {act.title}</div></Card>}
      {drawnMe && <Card tone="#2A2112"><div className="text-xl font-black">🎲 Κληρώθηκες!</div><div className="text-sm text-white/80">Μπαίνεις στη σκηνή — κοίτα την TV.</div></Card>}

      <Card>
        <div className="flex items-center justify-between">
          <div><div className="text-[13px] text-white/55">{STATUS_LABEL[status]} · Πράξη {act.index + 1}/{act.total}</div><div className="text-lg font-bold">{act.info.name}</div></div>
          <div className="text-right"><div className="text-[13px] text-white/55">Θέση</div><div className="text-2xl font-bold tabular-nums">#{myPos || '—'}</div></div>
        </div>
        <WorldMap active={status === 'active' || status === 'transition' ? act.continent : null} conquered={cg.conquered} compact labels={false} className="mt-2 aspect-[2/1] w-full rounded-2xl" />
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div><div className="mvg-num text-2xl font-bold tabular-nums text-[#E8C26B]">{s.points}</div><div className="text-[11px] text-white/55">Πόντοι</div></div>
          <div><div className="text-2xl font-bold tabular-nums">{s.loot}</div><div className="text-[11px] text-white/55">Λεία</div></div>
          <div><div className="text-2xl font-bold tabular-nums">{s.tokens}</div><div className="text-[11px] text-white/55">Tokens</div></div>
          <div><div className="text-2xl font-bold tabular-nums text-[#FF6B85]">{s.wanted}</div><div className="text-[11px] text-white/55">Wanted</div></div>
        </div>
        {s.wanted > 0 && <div className="mt-2 text-sm text-[#FF8A9C]">🎯 {WANTED_LEVELS[s.wanted].label}: {WANTED_LEVELS[s.wanted].text}</div>}
      </Card>

      {myTrial && (
        <Card title={`${trial.icon} ${trial.title}`} tone="#3A0A12">
          <p className="text-white/85">{trial.text}</p>
          {cg.trial.until && <div className="mt-2 text-5xl font-black tabular-nums text-[#E8C26B]">{left}″</div>}
          <p className="mt-1 text-xs text-white/50">PASS και ΣΤΟΠ ισχύουν πάντα.</p>
        </Card>
      )}
      {trial && !myTrial && (cg.trial.executors || []).includes(me.id) && <Card title="Αποστολή" tone="#2A2112"><div className="font-semibold">{trial.icon} Είσαι εκτελέστρια: {trial.title} · {nameOf(cg.trial.pid)}</div>{cg.trial.until && <div className="text-3xl font-black tabular-nums text-[#E8C26B]">{left}″</div>}</Card>}
      {card && cg.card.pid === me.id && <Card title="Κάρτα για σένα" tone="#2A2112"><div className="text-lg font-bold">{card.title}</div><p className="text-white/85">{cg.card.prompt || card.text}</p></Card>}

      {votes?.open && (votes.kind !== 'risk' || top3.includes(me.id)) && (
        <Card title={`🗳️ ${votes.q}`}>
          {myBallot && <div className="mb-2 text-sm text-white/60">Ψήφισες: {players.find((p) => p.id === myBallot)?.name || myBallot}</div>}
          {['player', 'final'].includes(votes.kind) && <div className="grid grid-cols-2 gap-2">{players.filter((p) => p.id !== me.id).map((p) => (
            <button key={p.id} type="button" onClick={() => sendAction(votes.kind === 'final' ? 'cg_final' : 'cg_vote', votes.kind === 'final' ? { target: p.id } : { value: p.id })} className={`h-11 rounded-2xl text-sm font-semibold ${myBallot === p.id ? 'bg-[#E8C26B] text-black' : 'bg-[#2C2C2E]'}`}>{p.name}</button>
          ))}</div>}
          {VOTE_OPTIONS[votes.kind] && (votes.kind !== 'choice' || votes.pid === me.id) && <div className="grid grid-cols-2 gap-2">{VOTE_OPTIONS[votes.kind].map((o) => (
            <button key={o} type="button" onClick={() => sendAction('cg_vote', { value: o })} className={`h-12 rounded-2xl text-sm font-semibold ${myBallot === o ? 'bg-[#E8C26B] text-black' : 'bg-[#2C2C2E]'}`}>{o}</button>
          ))}</div>}
          {votes.kind === 'risk' && <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => sendAction('cg_risk', { value: 'lock' })} className={`h-12 rounded-2xl font-semibold ${cg.risk?.[me.id] === 'lock' ? 'bg-[#E8C26B] text-black' : 'bg-[#2C2C2E]'}`}>🔒 Κλειδώνω</button>
            <button type="button" onClick={() => sendAction('cg_risk', { value: 'risk' })} className={`h-12 rounded-2xl font-semibold ${cg.risk?.[me.id] === 'risk' ? 'bg-[#FF3B5C]' : 'bg-[#2C2C2E]'}`}>🎲 Ρισκάρω ±6</button>
          </div>}
        </Card>
      )}

      {cg.nailsOpen && !s.nailLocked && (
        <Card title="💅 Δήλωση χρώματος νυχιών" tone="#2A1220">
          <div className="grid grid-cols-2 gap-2">{NAIL_COLORS.map((c) => <button key={c} type="button" onClick={() => sendAction('cg_nail', { nail: c })} className="h-11 rounded-2xl bg-[#2C2C2E] font-semibold">{c}</button>)}</div>
          <p className="mt-1 text-xs text-white/50">Στην ώρα της: +2 πόντοι & +1 token. Μένει σε όλη την ταινία.</p>
        </Card>
      )}
      {s.nail && <div className="px-1 text-sm text-white/60">💅 Τα νύχια σου: <b className="text-white">{s.nail}</b></div>}

      {status !== 'finale' && (
        <Card title="🪙 Tokens ελέγχου & ανατροπής">
          <div className="grid grid-cols-2 gap-2">{TOKEN_USES.map((t) => (
            <button key={t.id} type="button" disabled={s.tokens < t.cost || (t.id === 'shield' && s.wanted >= 3)} onClick={() => sendAction('cg_token', { use: t.id })} className="rounded-2xl bg-[#2C2C2E] p-3 text-left disabled:opacity-35">
              <div className="text-sm font-bold">{t.icon} {t.label} · {t.cost}</div><div className="text-[11px] text-white/60">{t.text}</div>
            </button>
          ))}</div>
          {s.wanted >= 5 && <button type="button" disabled={s.tokens < BUYOUT_TOKENS} onClick={() => sendAction('cg_buyout', {})} className="mt-2 h-11 w-full rounded-full bg-[#FF3B5C] font-bold disabled:opacity-40">Εξαγορά Wanted · {BUYOUT_TOKENS} tokens</button>}
          {(s.flags?.shield || s.flags?.double) && <div className="mt-2 text-xs text-[#7BE495]">Ενεργό: {s.flags.shield ? '🛡️ Ασπίδα ' : ''}{s.flags.double ? '✖️2 Διπλασιασμός' : ''}</div>}
        </Card>
      )}

      <Card title="🧾 Η κατάστασή μου">
        <div className="grid grid-cols-2 gap-1 text-sm">{Object.keys(STATE_LABELS).map((k) => <div key={k} className="flex justify-between gap-2 border-b border-white/5 py-1"><span className="text-white/55">{STATE_LABELS[k]}</span><span>{k === 'mask' ? (s.state.mask ? 'Ενεργή' : 'Ανενεργή') : VALUE_LABELS[s.state[k]] || s.state[k]}</span></div>)}</div>
      </Card>

      {status === 'standby' && <Card tone="#14141C"><div className="text-lg font-bold">⏸ Η επόμενη πράξη δεν έχει ξεκινήσει ακόμη</div><div className="text-sm text-white/60">Κράτα το κινητό φορτισμένο — η ειδοποίηση έρχεται εδώ.</div></Card>}
      {status === 'finale' && (
        <Card title="🎬 Η τελική σου κάρτα" tone="#2A2112">
          <div className="text-3xl font-black text-[#F7E3A8]">#{myPos} · {E.finalScore(cg, me.id)} πόντοι</div>
          <div className="text-sm text-white/70">Λεία {s.loot} · Tokens {s.tokens} · Ζώνες {s.zones} · Κατακτήσεις {rank.find((p) => p.id === me.id)?.conquests || 0}</div>
          {myPos === 1 && <div className="mt-2 text-lg font-bold text-[#E8C26B]">👑 Η μεγάλη νικήτρια!</div>}
        </Card>
      )}
    </div>
  );
}
