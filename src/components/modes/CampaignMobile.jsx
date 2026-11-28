import React from 'react';
import * as E from '@/lib/campaignEngine';
import { NAIL_COLORS, TOKEN_USES, WANTED_LEVELS, STATE_LABELS, VALUE_LABELS, STATUS_LABEL, BUYOUT_TOKENS, trialOf, cardOf } from '@/data/modes/campaignContent';
import { useTick } from '@/lib/modeKit';
import MovieShowMobile from '@/components/modes/MovieShowMobile';
import { firstArt, actPhoneArt, contArt, trialArt, cardArt, nailArt } from '@/lib/movieArt';
import { PlayerAvatar, ArtIcon, WantedStars, ContinentStrip, FlipCard, useDelta, DeltaBurst, colorOf } from '@/components/modes/MovieGameUI';

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
  const myPoints = cg ? E.statsOf(cg, me.id).points : null;
  const pointsDelta = useDelta(myPoints);
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
      {(() => {
        const bg = E.isNight(cg) && status === 'active' ? firstArt('bg_phone_night') : status === 'active' ? (actPhoneArt(act) || contArt('phone', act.continent)) : firstArt('bg_phone_waiting') || contArt('phone', act.continent);
        return bg ? <div aria-hidden="true" className="mvg-bgimg" style={{ backgroundImage: `linear-gradient(180deg, rgba(18,7,58,.55), rgba(7,3,32,.94) 55%), url("${bg}")` }} /> : null;
      })()}
      <MovieShowMobile cg={cg} me={me} nameOf={nameOf} sendAction={sendAction} stopped={!!mg.stop || !!state.stopActive} />

      <header className="gx-glass overflow-hidden p-0">
        {/* 11.0.0 · Κάρτα διαγωνιζόμενης: πινακίδα ονόματος, σκορ LED, θέση */}
        <div className="show-podium-plate flex w-full items-center gap-3 px-3.5 py-2.5 text-left" style={{ '--pc': colorOf(players, me.id), width: '100%', borderRadius: 0 }}>
          <PlayerAvatar name={me.name} color="#fff" size={44} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[21px] leading-tight">{me.name}</div>
            <div className="truncate text-[11px] font-bold tracking-[0.14em] text-white/75">{STATUS_LABEL[status]} · Πράξη {act.index + 1}/{act.total} · {act.info.name}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.2em] text-white/75">ΘΕΣΗ</div>
            <div className="show-title text-[34px]">#{myPos || '—'}</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 px-3.5 pt-3">
          <div className="show-led-window relative flex-1 flex-col py-1.5">
            <span className="show-led text-[44px] leading-none">{s.points}</span>
            <span className="text-[10px] font-bold tracking-[0.3em] text-white/55">ΠΟΝΤΟΙ</span>
            <DeltaBurst delta={pointsDelta} />
          </div>
        </div>
        <div className="px-3.5 pb-3.5">
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="gx-stat" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(140,120,255,.35)' }}>
            <ArtIcon id="icon_loot" fallback="💰" size={28} />
            <div><b>{s.loot}</b><small>λεία</small></div>
          </div>
          <div className="gx-stat" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(140,120,255,.35)' }}>
            <ArtIcon id="icon_token" fallback="🪙" size={26} />
            <div><b>{s.tokens}</b><small>tokens</small></div>
          </div>
          <div className="gx-stat" style={{ background: s.wanted ? 'rgba(255,45,85,.16)' : 'rgba(255,255,255,.06)', border: `1px solid ${s.wanted ? 'rgba(255,45,85,.55)' : 'rgba(140,120,255,.35)'}` }}>
            <div className="min-w-0"><WantedStars n={s.wanted} size={12} /><small>wanted {s.wanted}/5</small></div>
          </div>
        </div>
        <div className="mt-3"><ContinentStrip cg={cg} active={status === 'active' || status === 'transition' ? act.continent : null} /></div>
        {s.wanted > 0 && <div className="mt-2 text-sm text-[#FF8A9C]">🎯 {WANTED_LEVELS[s.wanted].label}: {WANTED_LEVELS[s.wanted].text}</div>}
        </div>
      </header>

      {changed && status !== 'finale' && (
        <div className="gx-glass gx-pop flex items-center gap-3 p-3.5" style={{ border: '1px solid rgba(255,69,58,.45)', background: 'rgba(58,10,18,.75)' }}>
          <ArtIcon src={contArt('icon', act.continent)} fallback="🗺️" size={40} />
          <div><div className="font-bold">Νέα ήπειρος: {act.info.name}</div><div className="text-sm text-white/75">Πράξη {act.index + 1}: {act.title}</div></div>
        </div>
      )}
      {drawnMe && (
        <div className="gx-glass gx-pop flex items-center gap-3 p-4" style={{ border: '1.5px solid rgba(232,194,107,.7)', boxShadow: '0 0 40px rgba(232,194,107,.35)' }}>
          <span className="text-4xl" aria-hidden="true">🎲</span>
          <div><div className="show-title text-[30px]">Κληρώθηκες!</div><div className="text-sm text-white/80">Μπαίνεις στη σκηνή · κοίτα την TV.</div></div>
        </div>
      )}

      {myTrial && (
        <FlipCard
          id={cg.trial.at}
          front={(
            <div className="relative min-h-[300px]" style={{ border: '1.5px solid rgba(232,194,107,.6)', borderRadius: 30, boxShadow: '0 0 40px rgba(232,194,107,.25)', background: '#120a0e' }}>
              {trialArt(cg.trial.id) && <img src={trialArt(cg.trial.id)} alt="" className="absolute inset-0 h-full w-full rounded-[30px] object-cover" style={{ filter: 'brightness(.45)' }} />}
              <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-2 p-5 text-center">
                <span className="text-6xl" aria-hidden="true">{trial.icon}</span>
                <div className="show-title text-[44px]">ΣΕΙΡΑ ΣΟΥ</div>
                <div className="text-sm text-white/80">{trial.title} · άγγιξε την κάρτα</div>
                {cg.trial.until && <div className="text-3xl font-black tabular-nums text-[#E8C26B]">{left}″</div>}
              </div>
            </div>
          )}
          back={(
            <section className="p-4" style={{ border: '1.5px solid rgba(255,69,58,.5)', borderRadius: 30, background: 'linear-gradient(160deg, #3A0A12ee, #0b0b10f2)' }}>
              <div className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/60">{trial.icon} {trial.title}</div>
              {trialArt(cg.trial.id) && <img src={trialArt(cg.trial.id)} alt="" className="mb-2 max-h-72 w-full rounded-2xl object-cover" />}
              <p className="text-white/85">{trial.text}</p>
              {cg.trial.until && <div className="mt-2 text-5xl font-black tabular-nums text-[#E8C26B]">{left}″</div>}
              <p className="mt-1 text-xs text-white/50">PASS και ΣΤΟΠ ισχύουν πάντα.</p>
            </section>
          )}
        />
      )}
      {trial && !myTrial && (cg.trial.executors || []).includes(me.id) && <Card title="Αποστολή" tone="#2A2112"><div className="font-semibold">{trial.icon} Είσαι εκτελέστρια: {trial.title} · {nameOf(cg.trial.pid)}</div>{cg.trial.until && <div className="text-3xl font-black tabular-nums text-[#E8C26B]">{left}″</div>}</Card>}
      {card && cg.card.pid === me.id && (
        <FlipCard
          id={cg.card.at}
          front={(
            <div className="relative min-h-[300px]" style={{ border: '1.5px solid rgba(232,194,107,.6)', borderRadius: 30, boxShadow: '0 0 40px rgba(232,194,107,.25)', background: '#120e08' }}>
              {cardArt(cg.card.id) && <img src={cardArt(cg.card.id)} alt="" className="absolute inset-0 h-full w-full rounded-[30px] object-cover" style={{ filter: 'brightness(.5)' }} />}
              <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-2 p-5 text-center">
                <span className="text-6xl" aria-hidden="true">🎴</span>
                <div className="gx-gold text-[34px] font-black leading-none">ΚΑΡΤΑ ΓΙΑ ΣΕΝΑ</div>
                <div className="text-sm text-white/80">Άγγιξε για να την ανοίξεις</div>
              </div>
            </div>
          )}
          back={(
            <section className="p-5 text-[#2a1e05]" style={{ borderRadius: 30, background: 'linear-gradient(180deg, #F9E7B2 0%, #E8C26B 46%, #C99B2E 100%)', boxShadow: '0 0 40px rgba(232,194,107,.35)' }}>
              <div className="text-[12px] font-bold uppercase tracking-[0.18em] opacity-70">Κάρτα για σένα</div>
              {cardArt(cg.card.id) && <img src={cardArt(cg.card.id)} alt="" className="my-2 w-full rounded-2xl object-cover" style={{ aspectRatio: '4/5', maxHeight: 300 }} />}
              <div className="text-2xl font-black leading-tight">{card.title}</div>
              <p className="mt-1">{cg.card.prompt || card.text}</p>
            </section>
          )}
        />
      )}

      {votes?.open && (votes.kind !== 'risk' || top3.includes(me.id)) && (
        <Card title={`🗳️ ${votes.q}`}>
          {myBallot && <div className="mb-2 text-sm text-white/60">Ψήφισες: {players.find((p) => p.id === myBallot)?.name || myBallot}</div>}
          {['player', 'final'].includes(votes.kind) && <div className="grid grid-cols-2 gap-2">{players.filter((p) => p.id !== me.id).map((p) => (
            <button key={p.id} type="button" onClick={() => sendAction(votes.kind === 'final' ? 'cg_final' : 'cg_vote', votes.kind === 'final' ? { target: p.id } : { value: p.id })} className={`gx-press flex h-12 items-center gap-2 rounded-full px-2 text-sm font-semibold ${myBallot === p.id ? 'bg-[#E8C26B] text-black shadow-[0_0_24px_rgba(232,194,107,.45)]' : 'bg-[#2C2C2E]'}`}><PlayerAvatar name={p.name} color={colorOf(players, p.id)} size={32} /><span className="truncate">{p.name}</span></button>
          ))}</div>}
          {VOTE_OPTIONS[votes.kind] && (votes.kind !== 'choice' || votes.pid === me.id) && <div className="grid grid-cols-2 gap-2">{VOTE_OPTIONS[votes.kind].map((o) => (
            <button key={o} type="button" onClick={() => sendAction('cg_vote', { value: o })} className={`gx-press h-12 rounded-full text-sm font-semibold ${myBallot === o ? 'bg-[#E8C26B] text-black shadow-[0_0_24px_rgba(232,194,107,.45)]' : 'bg-[#2C2C2E]'}`}>{o}</button>
          ))}</div>}
          {votes.kind === 'risk' && <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => sendAction('cg_risk', { value: 'lock' })} className={`gx-press h-12 rounded-full font-semibold ${cg.risk?.[me.id] === 'lock' ? 'bg-[#E8C26B] text-black' : 'bg-[#2C2C2E]'}`}>🔒 Κλειδώνω</button>
            <button type="button" onClick={() => sendAction('cg_risk', { value: 'risk' })} className={`gx-press h-12 rounded-full font-semibold ${cg.risk?.[me.id] === 'risk' ? 'bg-[#FF3B5C]' : 'bg-[#2C2C2E]'}`}>🎲 Ρισκάρω ±6</button>
          </div>}
        </Card>
      )}

      {cg.nailsOpen && !s.nailLocked && (
        <Card title="💅 Δήλωση χρώματος νυχιών" tone="#2A1220">
          <div className="grid grid-cols-2 gap-2">{NAIL_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => sendAction('cg_nail', { nail: c })} className="mvg-btn relative h-20 overflow-hidden rounded-2xl bg-[#2C2C2E] font-bold">
              {nailArt(c) && <img src={nailArt(c)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
              <span className="relative drop-shadow-[0_2px_4px_rgba(0,0,0,.9)]">{c}</span>
            </button>
          ))}</div>
          <p className="mt-1 text-xs text-white/50">Στην ώρα της: +2 πόντοι & +1 token. Μένει σε όλη την ταινία.</p>
        </Card>
      )}
      {s.nail && <div className="px-1 text-sm text-white/60">💅 Τα νύχια σου: <b className="text-white">{s.nail}</b></div>}

      {status !== 'finale' && (
        <Card title="🎒 Το σακίδιό μου · tokens">
          <div className="gx-pack">{TOKEN_USES.map((t) => (
            <button key={t.id} type="button" disabled={s.tokens < t.cost || (t.id === 'shield' && s.wanted >= 3)} onClick={() => sendAction('cg_token', { use: t.id })} className="gx-pack-item gx-press" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)' }}>
              <span className="text-3xl" aria-hidden="true">{t.icon}</span>
              <span className="min-w-0"><span className="block text-sm font-bold">{t.label}</span><span className="block text-[11px] leading-snug text-white/60">{t.text}</span></span>
              <span className="gx-cost" aria-label={`Κόστος ${t.cost}`}>{t.cost}</span>
            </button>
          ))}</div>
          {s.wanted >= 5 && <button type="button" disabled={s.tokens < BUYOUT_TOKENS} onClick={() => sendAction('cg_buyout', {})} className="gx-press mt-2 h-12 w-full rounded-full bg-[#FF3B5C] font-bold disabled:opacity-40">Εξαγορά Wanted · {BUYOUT_TOKENS} tokens</button>}
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
