import React from 'react';
import WorldMap from '@/components/modes/WorldMap';
import * as E from '@/lib/campaignEngine';
import { MOVIE_MODE_ID, STATUS_LABEL, continentOf, trialOf, cardOf, WANTED_LEVELS, MOVIE_TV } from '@/data/modes/campaignContent';
import { MODE_MEDIA, FILM } from '@/data/brandArt';
import { useTick } from '@/lib/modeKit';
import { isVideoUrl } from '@/lib/mediaKind';
import { showScreen, warrantLines } from '@/components/modes/MovieShowTV';
import { firstArt, actTvArt, contArt, trialArt, cardArt, nailArt } from '@/lib/movieArt';
import { MOVIE_CSS, ActTitleCard, useMovieSounds, CastScreen, EndCredits, montagePhotos } from '@/components/modes/MovieFX';

// DEAL OF TEMPTATION — Η ΤΑΙΝΙΑ · TV (δημόσια σκηνή): χάρτης 5 ηπείρων και 4 καταστάσεις (Ενεργή, Μετάβαση, Standby, Φινάλε).
// Ποτέ κρυφές πληροφορίες ή μυστικές αποστολές εδώ.
export const artFor = (sectionId, continentId) => {
  const own = MODE_MEDIA[MOVIE_MODE_ID]?.sections?.find((s) => s.id === sectionId)?.image;
  const m = MODE_MEDIA[continentId] || {};
  return own || m.hero || m.cover || '';
};
const two = (n) => String(n).padStart(2, '0');
const clock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 3600)}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`; };

function Backdrop({ src, dim = 0.22 }) {
  if (!src) return null;
  return isVideoUrl(src)
    ? <video key={src} src={src} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: dim }} autoPlay muted loop playsInline />
    : <img key={src} src={src} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: dim }} />;
}

export default function CampaignTV({ state }) {
  useTick(true, 1000);
  const mg = state.mg || {};
  const cg = mg.cg;
  useMovieSounds(cg);
  const players = state.players || [];
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '—';
  const names = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;
  if (!cg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-[4vw] text-white">
        <div className="w-full max-w-[1400px] text-center">
          <div className="font-semibold uppercase tracking-[0.35em] text-[#E8C26B]" style={{ fontSize: u(1.2) }}>Deal of Temptation</div>
          <div className="font-black" style={{ fontSize: u(4.6) }}>Η ΤΑΙΝΙΑ</div>
          <WorldMap className="mx-auto mt-6 aspect-[2/1] w-full rounded-2xl" />
          <div className="mt-4 text-white/60" style={{ fontSize: u(1.4) }}>Η διοργανώτρια διαλέγει ροή: Γρήγορο σετ, 48 ή 72 ώρες.</div>
        </div>
      </div>
    );
  }
  const now = Date.now();
  const act = E.currentAct(cg);
  const info = act.info;
  const night = E.isNight(cg) && cg.status === 'active';
  const rank = E.ranking(cg, players, { final: cg.status === 'finale' });
  const wanted = cg.mostWanted || E.wantedOne(cg, players);
  const status = cg.status || 'transition';
  const actTitle = `ΠΡΑΞΗ ${two(act.index + 1)} · ${info.name}`;
  const elapsed = cg.actStartedAt ? now - cg.actStartedAt : 0;
  const nailOf = (id) => E.statsOf(cg, id).nail;

  // ---------- SHOW: Τροχοί, ανακοινώσεις, υποχρεωτική κλήρωση, παιχνίδια, Καρέκλα ----------
  const show = showScreen({ cg, act, nameOf, artFor, statsOf: E.statsOf, now });
  if (show) return <><style>{MOVIE_CSS}</style>{show}</>;
  const warrants = warrantLines(cg, players, nameOf, act);

  // ---------- ΦΙΝΑΛΕ ----------
  if (status === 'finale' && cg.finaleAt && now - cg.finaleAt > 12000) {
    return <><style>{MOVIE_CSS}</style><EndCredits cg={cg} players={players} rank={rank} acts={E.actsOf(cg)} nameOf={nameOf} photos={montagePhotos(MOVIE_MODE_ID)} /></>;
  }
  if (status === 'finale') {
    const top = rank[0];
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
        <Backdrop src={(cg.finaleAt && now - cg.finaleAt < 7000 && firstArt('vid_finale_map')) || firstArt('vid_big_gift', 'bg_tv_big_gift', 'bg_tv_final_recap') || artFor('finale', 'villa_takeover')} dim={0.32} />
        <div className="relative grid h-screen grid-cols-[1.25fr_1fr]" style={{ gap: u(2), padding: u(2.6) }}>
          <div className="flex min-h-0 flex-col" style={{ gap: u(1.2) }}>
            <div className="font-semibold uppercase tracking-[0.3em] text-[#E8C26B]" style={{ fontSize: u(1.1) }}>{MOVIE_TV.finale.title} · {E.formatOf(cg).label}</div>
            <WorldMap active={null} conquered={cg.conquered} names={names} className="aspect-[2/1] w-full rounded-3xl" />
            <div className="grid grid-cols-3" style={{ gap: u(0.6) }}>
              {E.actsOf(cg).map((a, i) => {
                const c = (cg.conquered || {})[i];
                return <div key={i} className="rounded-2xl bg-white/5" style={{ padding: u(0.7), fontSize: u(0.95) }}><b className="text-[#E8C26B]">Πράξη {two(i + 1)}</b> · {continentOf(c?.continent || a.continent).name}<div className="text-white/70">{c?.winner ? `👑 ${nameOf(c.winner)}` : '—'}</div></div>;
              })}
            </div>
          </div>
          <div className="flex min-h-0 flex-col justify-center" style={{ gap: u(1.2) }}>
            {top && (
              <div className="rounded-[2rem] bg-gradient-to-b from-[#2A2112] to-[#17140C] text-center ring-1 ring-[#E8C26B]/60" style={{ padding: u(2) }}>
                <div style={{ fontSize: u(4) }}>👑</div>
                <div className="font-semibold uppercase tracking-[0.25em] text-[#E8C26B]" style={{ fontSize: u(1) }}>Η μεγάλη νικήτρια</div>
                <div className="font-black text-[#F7E3A8]" style={{ fontSize: u(4) }}>{top.name}</div>
                <div className="text-white/70" style={{ fontSize: u(1.3) }}>{top.score} τελικοί πόντοι · {top.conquests} ήπειροι</div>
                <div className="font-semibold text-[#E8C26B]" style={{ fontSize: u(1.2), marginTop: u(0.6) }}>🎁 Το Μεγάλο Δώρο</div>
              </div>
            )}
            <ol className="mvg-glass" style={{ padding: u(1.2) }}>
              {rank.map((p, i) => (
                <li key={p.id} className="flex justify-between border-b border-white/10 last:border-0" style={{ fontSize: u(1.3), padding: `${u(0.4)} 0` }}>
                  <span>{i + 1}. {p.name}</span><span className="font-bold tabular-nums text-[#E8C26B]">{p.score}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ΜΕΤΑΒΑΣΗ: «Previously On / Επόμενη Ήπειρος» ----------
  if (status === 'transition' && act.index === 0 && !Object.keys(cg.conquered || {}).length && !cg.jump) {
    return <><style>{MOVIE_CSS}</style><CastScreen players={players} cg={cg} statsOf={E.statsOf} /></>;
  }
  if (status === 'transition') {
    const prev = cg.previously;
    const leader = rank[0];
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
        <Backdrop src={firstArt(prev?.from ? `vid_jump_${act.continent}` : '', 'vid_previously', 'bg_tv_previously_on') || artFor('transition', act.continent)} dim={0.32} />
        <div className="relative grid h-screen grid-cols-[1.3fr_1fr] items-center" style={{ gap: u(2.4), padding: u(2.8) }}>
          <WorldMap active={act.continent} conquered={cg.conquered} names={names} focus zoom={act.continent} route={prev?.from && prev.from !== act.continent ? [prev.from, act.continent] : null} className="aspect-[2/1] w-full rounded-3xl" />
          <div style={{ display: 'grid', gap: u(1.1) }}>
            <div className="font-semibold uppercase tracking-[0.3em] text-[#FF6B85]" style={{ fontSize: u(1.1) }}>{prev?.from ? 'Previously On…' : 'Η ταινία ξεκινά'}</div>
            {prev?.from && <div className="text-white/70" style={{ fontSize: u(1.4) }}>Από {continentOf(prev.from).name} → {info.name}{prev.jump ? ' · ⚡ Έκτακτο άλμα' : ''}</div>}
            <div className="font-black leading-none" style={{ fontSize: u(3.4) }}>{actTitle}</div>
            <div className="font-bold text-[#F7E3A8]" style={{ fontSize: u(2.2) }}>{act.title}</div>
            <div className="text-white/80" style={{ fontSize: u(1.35) }}>{act.text}</div>
            <div className="grid grid-cols-2" style={{ gap: u(0.8) }}>
              <div className="rounded-2xl bg-white/5" style={{ padding: u(0.9) }}><div className="text-white/55" style={{ fontSize: u(0.9) }}>Προηγείται</div><div className="font-bold" style={{ fontSize: u(1.6) }}>{leader && leader.score ? `${leader.name} · ${leader.score}` : '—'}</div></div>
              <div className="rounded-2xl bg-white/5" style={{ padding: u(0.9) }}><div className="text-white/55" style={{ fontSize: u(0.9) }}>Καταζητούμενη</div><div className="font-bold text-[#FF6B85]" style={{ fontSize: u(1.6) }}>{wanted ? `🎯 ${nameOf(wanted)}` : '—'}</div></div>
            </div>
            <div className="text-white/55" style={{ fontSize: u(1) }}>Μεταφέρονται: πόντοι, λεία, tokens, εντάλματα, συμμαχίες και Καταζητούμενη.</div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- STANDBY ----------
  if (status === 'standby') {
    const next = E.actsOf(cg)[Math.min(act.index + (cg.lastClosed ? 1 : 0), act.total - 1)];
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
        <Backdrop src={firstArt('vid_standby') || FILM.breakLoopVideo || firstArt('bg_tv_standby') || artFor('standby', act.continent)} dim={0.28} />
        <div className="relative grid h-screen grid-cols-[1.4fr_1fr] items-center" style={{ gap: u(2.4), padding: u(2.8) }}>
          <WorldMap active={null} conquered={cg.conquered} names={names} night className="aspect-[2/1] w-full rounded-3xl" />
          <div style={{ display: 'grid', gap: u(1.2) }}>
            <div className="font-semibold uppercase tracking-[0.3em] text-[#E8C26B]" style={{ fontSize: u(1.1) }}>⏸ Επόμενη πράξη σε Standby</div>
            <div className="font-black" style={{ fontSize: u(2.6) }}>{next ? `${continentOf(next.continent).name}` : 'Φινάλε'}</div>
            <div className="text-white/70" style={{ fontSize: u(1.4) }}>{next?.title}</div>
            <ol className="mvg-glass" style={{ padding: u(1.1) }}>
              {rank.slice(0, 3).map((p, i) => <li key={p.id} className="flex justify-between" style={{ fontSize: u(1.6), padding: `${u(0.3)} 0` }}><span>{['🥇', '🥈', '🥉'][i]} {p.name}</span><b className="tabular-nums text-[#E8C26B]">{p.score}</b></li>)}
            </ol>
            {wanted && <div className="font-semibold text-[#FF6B85]" style={{ fontSize: u(1.4) }}>🎯 Καταζητούμενη: {nameOf(wanted)}</div>}
          </div>
        </div>
      </div>
    );
  }

  // ---------- ΕΝΕΡΓΗ ΠΡΑΞΗ ----------
  const trial = cg.trial && !cg.trial.done ? trialOf(cg.trial.id) : null;
  const left = E.trialSecondsLeft(cg, now);
  const card = cg.card ? cardOf(cg.card.id) : null;
  const drawn = cg.drawn && now - cg.drawn.at < 20000 ? cg.drawn.pid : null;
  const votes = cg.votes;
  const tally = votes && !votes.open ? E.tallyVotes(cg) : [];
  return (
    <div className="mvg mvg-tv relative min-h-screen w-full overflow-hidden text-white" style={{ background: night ? '#05060c' : '#000' }}>
      <Backdrop src={night ? (firstArt('vid_night', 'bg_tv_night_mode') || artFor('night', act.continent)) : (actTvArt(act) || contArt('hero', act.continent) || artFor(act.continent, act.continent))} dim={night ? 0.14 : 0.22} />
      {!night && <div className="mvg-spot" />}
      <div className="relative grid h-screen grid-cols-[1fr_min(30vw,560px)]" style={{ gap: u(1.6), padding: `${u(2.2)} ${u(2.4)}` }}>
        <div className="flex min-h-0 flex-col" style={{ gap: u(1) }}>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-semibold uppercase tracking-[0.3em] text-[#FF6B85]" style={{ fontSize: u(1) }}>{STATUS_LABEL.active}{night ? ' · 🌙 Νυχτερινή λειτουργία' : ''} · {E.formatOf(cg).label}{act.day ? ` · Ημέρα ${act.day}` : ''}</div>
              <div className="mvg-title3d font-black leading-none" style={{ fontSize: u(2.8) }}>{actTitle}</div>
              <div className="font-bold text-[#F7E3A8]" style={{ fontSize: u(1.5) }}>{act.title}</div>
            </div>
            <div className="text-right tabular-nums text-white/70" style={{ fontSize: u(1.6) }}>⏱ {clock(elapsed)}</div>
          </div>
          <div style={{ perspective: '1600px' }}><div className="mvg-float"><WorldMap active={act.continent} conquered={cg.conquered} names={names} night={night} focus className="aspect-[2.1/1] w-full rounded-3xl" /></div></div>
          <div className="min-h-0 flex-1 mvg-glass" style={{ padding: u(1.4) }}>
            {drawn && !trial && !card && (
              <div className="text-center">
                <div className="font-semibold uppercase tracking-[0.3em] text-[#E8C26B]" style={{ fontSize: u(1.1) }}>{MOVIE_TV.draw}</div>
                <div className="font-black" style={{ fontSize: u(4) }}>{nameOf(drawn)}</div>
                {nailOf(drawn) && <div className="flex items-center justify-center text-white/70" style={{ fontSize: u(1.3), gap: u(0.8) }}>{nailArt(nailOf(drawn)) && <img src={nailArt(nailOf(drawn))} alt="" className="rounded-xl object-cover" style={{ width: u(5), height: u(5) }} />}💅 {nailOf(drawn)}</div>}
              </div>
            )}
            {trial && (
              <div className="grid grid-cols-[auto_1fr_auto] items-center" style={{ gap: u(1.5) }}>
                {trialArt(cg.trial.id, true) ? <img src={trialArt(cg.trial.id, true)} alt="" className="rounded-2xl object-cover shadow-2xl" style={{ width: u(16), aspectRatio: '16/9' }} /> : <span />}
                <div>
                  <div className="font-semibold uppercase tracking-[0.25em] text-[#FF6B85]" style={{ fontSize: u(1) }}>{trial.icon} {trial.title}</div>
                  <div className="font-black" style={{ fontSize: u(2.6) }}>{nameOf(cg.trial.pid)}{nailOf(cg.trial.pid) ? <span className="text-white/60" style={{ fontSize: u(1.3) }}> · 💅 {nailOf(cg.trial.pid)}</span> : null}</div>
                  <div className="text-white/80" style={{ fontSize: u(1.35) }}>{trial.text}</div>
                  {(cg.trial.executors || []).length > 0 && <div className="text-white/60" style={{ fontSize: u(1.1) }}>Εκτελούν: {cg.trial.executors.map(nameOf).join(', ')}</div>}
                </div>
                {cg.trial.until && <div className="font-black tabular-nums text-[#E8C26B]" style={{ fontSize: u(6) }}>{left}</div>}
              </div>
            )}
            {!trial && card && (
              <div className="flex items-center" style={{ gap: u(1.5) }}>
                {cardArt(cg.card.id, true) && <img src={cardArt(cg.card.id, true)} alt="" className="rounded-2xl object-cover shadow-2xl" style={{ width: u(16), aspectRatio: '16/9' }} />}
                <div>
                <div className="font-semibold uppercase tracking-[0.25em] text-[#E8C26B]" style={{ fontSize: u(1) }}>🎴 Κάρτα{cg.card.pid ? ` · ${nameOf(cg.card.pid)}` : ''}{cg.card.pid2 ? ` & ${nameOf(cg.card.pid2)}` : ''}</div>
                <div className="font-black" style={{ fontSize: u(2.4) }}>{card.title}</div>
                <div className="text-white/80" style={{ fontSize: u(1.35) }}>{cg.card.prompt || card.text}</div>
                </div>
              </div>
            )}
            {votes && (
              <div className="font-semibold text-[#64D2FF]" style={{ fontSize: u(1.35), marginTop: u(0.8) }}>
                🗳️ {votes.q} · {votes.open ? `Ψηφίστε στο κινητό · ${Object.values(votes.ballots || {}).filter(Boolean).length}/${players.length}` : `Αποτέλεσμα: ${tally.map(([k, n]) => `${names[k] || k} ${n}`).join(' · ') || '—'}`}
              </div>
            )}
            {!drawn && !trial && !card && !votes && <div className="text-white/70" style={{ fontSize: u(1.4) }}>{info.text}</div>}
          </div>
        </div>
        <aside className="flex min-h-0 flex-col" style={{ gap: u(1) }}>
          <div className="min-h-0 flex-1 overflow-hidden mvg-glass" style={{ padding: u(1.2) }}>
            <div className="font-semibold uppercase tracking-[0.2em] text-[#E8C26B]" style={{ fontSize: u(0.9) }}>Live Show · κατάταξη</div>
            <ol style={{ marginTop: u(0.5) }}>
              {rank.map((p, i) => {
                const w = p.stats.wanted;
                return (
                  <li key={p.id} className="flex items-center justify-between border-b border-white/10 last:border-0" style={{ fontSize: u(1.25), padding: `${u(0.42)} 0` }}>
                    <span className="min-w-0 truncate"><span className="inline-block text-white/45" style={{ width: u(1.8) }}>{i + 1}</span>{i === 0 ? '👑 ' : ''}{p.name}{w > 0 ? <span className="text-[#FF6B85]" title={WANTED_LEVELS[w].label}> {'★'.repeat(w)}</span> : null}</span>
                    <span className="shrink-0 tabular-nums"><b className="text-[#E8C26B]">{p.score}</b><span className="text-white/45" style={{ fontSize: u(0.85) }}> · 💰{p.stats.loot} · 🪙{p.stats.tokens}</span></span>
                  </li>
                );
              })}
            </ol>
          </div>
          {wanted && <div className="rounded-3xl bg-[#3A0A12]/90 font-semibold" style={{ padding: u(1), fontSize: u(1.2) }}>🎯 Καταζητούμενη: {nameOf(wanted)} · {WANTED_LEVELS[E.statsOf(cg, wanted).wanted].label}</div>}
          {warrants.map((w) => <div key={w} className="rounded-3xl bg-[#FF3B5C]/20 font-semibold text-[#FF8A9C]" style={{ padding: u(0.8), fontSize: u(1) }}>🚨 {w}</div>)}
          <div className="mvg-glass text-white/70" style={{ padding: u(1), fontSize: u(0.95) }}>{info.motif} · {info.action}</div>
        </aside>
      </div>
      <style>{MOVIE_CSS}</style>
      {cg.actStartedAt && now - cg.actStartedAt < 7000 && <ActTitleCard act={act} opening={act.index === 0} bg={firstArt('vid_act_title', 'bg_tv_act_title') || actTvArt(act)} />}
    </div>
  );
}
