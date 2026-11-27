import React from 'react';
import WorldMap from '@/components/modes/WorldMap';
import * as E from '@/lib/campaignEngine';
import { MOVIE_MODE_ID, continentOf, trialOf, cardOf, WANTED_LEVELS, MOVIE_TV } from '@/data/modes/campaignContent';
import { MODE_MEDIA, FILM } from '@/data/brandArt';
import { useTick } from '@/lib/modeKit';
import { isVideoUrl } from '@/lib/mediaKind';
import { showScreen, warrantLines } from '@/components/modes/MovieShowTV';
import { firstArt, actTvArt, contArt, trialArt, cardArt, nailArt } from '@/lib/movieArt';
import { MOVIE_CSS, ActTitleCard, useMovieSounds, CastScreen, EndCredits, montagePhotos } from '@/components/modes/MovieFX';
import { ContinentBoard, EventTakeover, PlayerAvatar, WantedStars, ArtIcon, colorOf } from '@/components/modes/MovieGameUI';

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
  const show = showScreen({ cg, act, nameOf, artFor, statsOf: E.statsOf, now, players });
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
  // Μεγάλη κάρτα γεγονότος για 5″: το πιο πρόσφατο από δοκιμασία, κάρτα, κλήρωση (όχι πάνω στην κάρτα τίτλου πράξης).
  const TAKE_MS = 5000;
  const titleCard = cg.actStartedAt && now - cg.actStartedAt < 7000;
  const fresh = (at) => at && now - at >= 0 && now - at < TAKE_MS;
  const takes = [];
  if (trial && fresh(cg.trial.at)) takes.push({ at: cg.trial.at, kicker: nameOf(cg.trial.pid), player: nameOf(cg.trial.pid), pid: cg.trial.pid, title: trial.title, text: trial.text, img: trialArt(cg.trial.id, true), danger: ['hogtie', 'cuffs'].includes(cg.trial.id) });
  if (card && fresh(cg.card.at)) takes.push({ at: cg.card.at, kicker: `Κάρτα${cg.card.pid ? ` · ${nameOf(cg.card.pid)}` : ''}`, player: cg.card.pid ? nameOf(cg.card.pid) : '', pid: cg.card.pid, title: card.title, text: cg.card.prompt || card.text, img: cardArt(cg.card.id, true) });
  if (drawn && fresh(cg.drawn.at)) takes.push({ at: cg.drawn.at, kicker: MOVIE_TV.draw, player: nameOf(drawn), pid: drawn, title: nameOf(drawn), text: nailOf(drawn) ? `💅 ${nailOf(drawn)}` : '', img: nailArt(nailOf(drawn)) || '' });
  const take = !titleCard && takes.sort((a, b) => b.at - a.at)[0];
  const rowAv = players.length > 7 ? u(2.3) : u(3);
  return (
    <div className="mvg mvg-tv relative min-h-screen w-full overflow-hidden text-white" style={{ background: night ? '#05060c' : '#000' }}>
      <Backdrop src={night ? (firstArt('vid_night', 'bg_tv_night_mode') || artFor('night', act.continent)) : (actTvArt(act) || contArt('hero', act.continent) || artFor(act.continent, act.continent))} dim={night ? 0.14 : 0.24} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 38%, rgba(10,8,20,.35) 0%, rgba(0,0,0,.82) 72%, #000 100%)' }} />
      {!night && <div className="mvg-spot" />}
      <div className="relative grid h-screen grid-cols-[1fr_min(29vw,540px)]" style={{ gap: u(1.6), padding: `${u(1.8)} ${u(2.2)}` }}>
        <div className="flex min-h-0 flex-col" style={{ gap: u(0.9) }}>
          <div className="flex items-center justify-between" style={{ gap: u(1) }}>
            <div className="flex items-center" style={{ gap: u(0.7) }}>
              <ArtIcon id="icon_crown" fallback="👑" size={u(2.6)} />
              <div>
                <div className="gx-gold font-black" style={{ fontSize: u(1.1), letterSpacing: '.14em' }}>DEAL OF TEMPTATION</div>
                <div className="uppercase" style={{ fontSize: u(0.75), letterSpacing: '.28em', color: '#8E8E93' }}>Η Ταινία · {E.formatOf(cg).label}</div>
              </div>
            </div>
            <div className="gx-glass gx-capsule" style={{ padding: `${u(0.55)} ${u(1.4)}`, fontSize: u(0.95), gap: u(1) }}>
              <span className="flex items-center font-bold" style={{ gap: u(0.4) }}><span className="gx-live-dot" />{night ? '🌙 ΝΥΧΤΑ' : 'LIVE'}</span>
              <span className="gx-gold font-black" style={{ fontSize: u(1.3), letterSpacing: '.05em' }}>{actTitle}</span>
              {act.day && <span style={{ color: '#AEAEB2' }}>Ημέρα {act.day}</span>}
              <span className="tabular-nums" style={{ color: '#AEAEB2' }}>⏱ {clock(elapsed)}</span>
            </div>
          </div>
          <div className="mvg-title3d text-center font-black leading-none" style={{ fontSize: u(2.1) }}>{act.title}</div>
          <div style={{ padding: `${u(2.4)} ${u(2.4)} ${u(0.4)}` }}>
            <ContinentBoard cg={cg} players={players} active={act.continent} night={night} u={u} />
          </div>
          <div className="min-h-0 flex-1 gx-glass" style={{ padding: u(1.4) }}>
            {drawn && !trial && !card && (
              <div className="flex items-center justify-center text-center" style={{ gap: u(1.6) }}>
                <PlayerAvatar name={nameOf(drawn)} color={colorOf(players, drawn)} size={u(6)} />
                <div>
                  <div className="font-semibold uppercase tracking-[0.3em] text-[#E8C26B]" style={{ fontSize: u(1.1) }}>{MOVIE_TV.draw}</div>
                  <div className="font-black" style={{ fontSize: u(3.6) }}>{nameOf(drawn)}</div>
                  {nailOf(drawn) && <div className="flex items-center justify-center text-white/70" style={{ fontSize: u(1.3), gap: u(0.8) }}>{nailArt(nailOf(drawn)) && <img src={nailArt(nailOf(drawn))} alt="" className="rounded-xl object-cover" style={{ width: u(4), height: u(4) }} />}💅 {nailOf(drawn)}</div>}
                </div>
              </div>
            )}
            {trial && (
              <div className="grid grid-cols-[auto_1fr_auto] items-center" style={{ gap: u(1.5) }}>
                {trialArt(cg.trial.id, true) ? <img src={trialArt(cg.trial.id, true)} alt="" className="rounded-2xl object-cover shadow-2xl" style={{ width: u(15), aspectRatio: '16/9' }} /> : <PlayerAvatar name={nameOf(cg.trial.pid)} color={colorOf(players, cg.trial.pid)} size={u(5.5)} />}
                <div>
                  <div className="font-semibold uppercase tracking-[0.25em] text-[#FF6B85]" style={{ fontSize: u(1) }}>{trial.icon} {trial.title}</div>
                  <div className="font-black" style={{ fontSize: u(2.5) }}>{nameOf(cg.trial.pid)}{nailOf(cg.trial.pid) ? <span className="text-white/60" style={{ fontSize: u(1.3) }}> · 💅 {nailOf(cg.trial.pid)}</span> : null}</div>
                  <div className="text-white/80" style={{ fontSize: u(1.3) }}>{trial.text}</div>
                  {(cg.trial.executors || []).length > 0 && <div className="text-white/60" style={{ fontSize: u(1.1) }}>Εκτελούν: {cg.trial.executors.map(nameOf).join(', ')}</div>}
                </div>
                {cg.trial.until && <div className="gx-gold font-black tabular-nums" style={{ fontSize: u(6) }}>{left}</div>}
              </div>
            )}
            {!trial && card && (
              <div className="flex items-center" style={{ gap: u(1.5) }}>
                {cardArt(cg.card.id, true) && <img src={cardArt(cg.card.id, true)} alt="" className="rounded-2xl object-cover shadow-2xl" style={{ width: u(15), aspectRatio: '16/9' }} />}
                <div>
                  <div className="font-semibold uppercase tracking-[0.25em] text-[#E8C26B]" style={{ fontSize: u(1) }}>🎴 Κάρτα{cg.card.pid ? ` · ${nameOf(cg.card.pid)}` : ''}{cg.card.pid2 ? ` & ${nameOf(cg.card.pid2)}` : ''}</div>
                  <div className="font-black" style={{ fontSize: u(2.4) }}>{card.title}</div>
                  <div className="text-white/80" style={{ fontSize: u(1.3) }}>{cg.card.prompt || card.text}</div>
                </div>
              </div>
            )}
            {votes && (
              <div className="font-semibold text-[#64D2FF]" style={{ fontSize: u(1.35), marginTop: u(0.8) }}>
                🗳️ {votes.q} · {votes.open ? `Ψηφίστε στο κινητό · ${Object.values(votes.ballots || {}).filter(Boolean).length}/${players.length}` : `Αποτέλεσμα: ${tally.map(([k, n]) => `${names[k] || k} ${n}`).join(' · ') || '—'}`}
              </div>
            )}
            {!drawn && !trial && !card && !votes && (
              <div className="flex items-center" style={{ gap: u(1.2) }}>
                <ArtIcon src={contArt('icon', act.continent)} fallback="🗺️" size={u(4)} />
                <div>
                  <div className="font-semibold uppercase tracking-[0.25em] text-[#E8C26B]" style={{ fontSize: u(0.95) }}>{info.motif}</div>
                  <div className="text-white/80" style={{ fontSize: u(1.35) }}>{info.text}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <aside className="flex min-h-0 flex-col" style={{ gap: u(0.9) }}>
          <div className="min-h-0 flex-1 overflow-hidden gx-glass" style={{ padding: u(1.1) }}>
            <div className="font-semibold uppercase tracking-[0.2em] text-[#E8C26B]" style={{ fontSize: u(0.85) }}>Live Show · κατάταξη</div>
            <ol className="grid" style={{ marginTop: u(0.6), gap: u(0.45) }}>
              {rank.map((p, i) => (
                <li key={p.id} className="flex items-center" style={{ gap: u(0.75), padding: `${u(0.4)} ${u(0.6)}`, borderRadius: u(1.4), background: i === 0 ? 'rgba(232,194,107,.10)' : 'rgba(255,255,255,.04)', border: `1px solid ${i === 0 ? 'rgba(232,194,107,.45)' : 'rgba(255,255,255,.06)'}` }}>
                  <span className="tabular-nums" style={{ width: u(1.3), color: '#8E8E93', fontSize: u(0.95) }}>{i + 1}</span>
                  <PlayerAvatar name={p.name} color={colorOf(players, p.id)} size={rowAv} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold" style={{ fontSize: u(1.15) }} title={p.stats.wanted ? WANTED_LEVELS[p.stats.wanted].label : undefined}>{i === 0 ? '👑 ' : ''}{p.name}</div>
                    <div className="flex items-center" style={{ gap: u(0.6), marginTop: u(0.15) }}>
                      <WantedStars n={p.stats.wanted} size={u(0.9)} />
                      <span className="flex items-center tabular-nums" style={{ gap: u(0.25), fontSize: u(0.85), color: '#AEAEB2' }}>
                        <ArtIcon id="icon_loot" fallback="💰" size={u(1.15)} />{p.stats.loot}
                        <ArtIcon id="icon_token" fallback="🪙" size={u(1.05)} />{p.stats.tokens}
                      </span>
                    </div>
                  </div>
                  <b className="gx-gold tabular-nums" style={{ fontSize: u(1.8) }}>{p.score}</b>
                </li>
              ))}
            </ol>
          </div>
          {wanted && (
            <div className="flex items-center font-semibold" style={{ gap: u(0.8), padding: u(0.9), fontSize: u(1.1), borderRadius: u(1.6), background: 'rgba(58,10,18,.88)', border: '1px solid rgba(255,69,58,.45)' }}>
              <PlayerAvatar name={nameOf(wanted)} color="#FF453A" size={u(2.6)} />
              <span className="min-w-0">🎯 Καταζητούμενη: {nameOf(wanted)}<span className="block font-normal text-[#FF8A9C]" style={{ fontSize: u(0.9) }}>{WANTED_LEVELS[E.statsOf(cg, wanted).wanted].label}</span></span>
            </div>
          )}
          {warrants.map((w) => <div key={w} className="font-semibold text-[#FF8A9C]" style={{ padding: u(0.8), fontSize: u(1), borderRadius: u(1.6), background: 'rgba(255,59,92,.18)' }}>🚨 {w}</div>)}
          <div className="gx-glass text-white/70" style={{ padding: u(0.9), fontSize: u(0.9) }}>{info.motif} · {info.action}</div>
        </aside>
      </div>
      <style>{MOVIE_CSS}</style>
      {take && <EventTakeover key={take.at} kicker={take.kicker} title={take.title} text={take.text} img={take.img} player={take.player} color={take.pid ? colorOf(players, take.pid) : '#E8C26B'} danger={take.danger} u={u} />}
      {titleCard && <ActTitleCard act={act} opening={act.index === 0} bg={firstArt('vid_act_title', 'bg_tv_act_title') || actTvArt(act)} />}
    </div>
  );
}
