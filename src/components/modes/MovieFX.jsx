import React, { useEffect, useRef, useState } from 'react';
import { MODE_MEDIA } from '@/data/brandArt';
import { CONTINENTS, continentOf } from '@/data/modes/campaignContent';
import { tvSfx } from '@/lib/modeKit';
import { playShowVideo } from '@/components/tv/TVShowVideos';
import { isVideoUrl } from '@/lib/mediaKind';

// Κινηματογραφικό στρώμα της TV για «Η Ταινία»: τίτλοι αρχής, κάρτα πράξης, ήχοι, καστ, τίτλοι τέλους.
// Μόνο στην TV (Tablet και κινητά μένουν χωρίς animations). Σέβεται το prefers-reduced-motion.

export const MOVIE_CSS = `
@keyframes mv-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.06); opacity: .85 } }
.mv-pulse { animation: mv-pulse 1.4s ease-in-out infinite }
@keyframes mv-bars { from { height: 0 } to { height: 11vh } }
@keyframes mv-fade { 0% { opacity: 0; transform: scale(1.04) } 15% { opacity: 1; transform: none } 85% { opacity: 1 } 100% { opacity: 0 } }
@keyframes mv-rise { from { opacity: 0; transform: translateY(24px); letter-spacing: .5em } to { opacity: 1; transform: none } }
@keyframes mv-line { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes mv-roll { from { transform: translateY(100vh) } to { transform: translateY(-100%) } }
@keyframes mv-xfade { 0%, 100% { opacity: 0 } 8%, 92% { opacity: 1 } }
@keyframes mv-kenburns { from { transform: scale(1.02) } to { transform: scale(1.14) } }
.mv-bar { animation: mv-bars .9s cubic-bezier(.32,.72,0,1) forwards }
.mv-card { animation: mv-fade 7s ease forwards }
.mv-rise { animation: mv-rise 1.1s cubic-bezier(.32,.72,0,1) both }
.mv-line { animation: mv-line 1.2s cubic-bezier(.32,.72,0,1) both; transform-origin: center }
.mv-roll { animation: mv-roll 70s linear infinite }
.mv-kb { animation: mv-kenburns 9s ease-out both }
@media (prefers-reduced-motion: reduce) { .mv-bar, .mv-card, .mv-rise, .mv-line, .mv-roll, .mv-kb { animation: none !important } .mv-bar { height: 11vh } }
`;

const two = (n) => String(n).padStart(2, '0');

// Μαύρες μπάρες πάνω-κάτω (letterbox).
export const Letterbox = () => (
  <>
    <div aria-hidden="true" className="mv-bar pointer-events-none absolute inset-x-0 top-0 z-30 bg-black" />
    <div aria-hidden="true" className="mv-bar pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-black" />
  </>
);

// Κάρτα τίτλου πράξης (7″). Στην 1η πράξη προηγούνται οι τίτλοι αρχής της ταινίας.
export function ActTitleCard({ act, opening = false, bg = '' }) {
  const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;
  const video = /\.(mp4|m4v|webm|mov)(\?|$)/i.test(bg);
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/80" role="status">
      {bg && (video
        ? <video src={bg} className="absolute inset-0 h-full w-full object-cover opacity-60" autoPlay muted playsInline />
        : <img src={bg} alt="" className="mv-kb absolute inset-0 h-full w-full object-cover opacity-45" onError={(e) => { e.currentTarget.style.display = 'none'; }} />)}
      <Letterbox />
      <div className="mv-card text-center text-white">
        {opening && <div className="mv-rise font-semibold uppercase tracking-[0.5em] text-white/70" style={{ fontSize: u(1.2) }}>Deal of Temptation παρουσιάζει</div>}
        <div className="mv-rise font-semibold uppercase tracking-[0.45em] text-[#FF6B85]" style={{ fontSize: u(1.3), marginTop: u(1), animationDelay: '.3s' }}>Πράξη {two(act.index + 1)} · {act.info.name}</div>
        <div className="mv-line mx-auto bg-[#E8C26B]" style={{ height: 2, width: u(18), margin: `${u(1.2)} auto`, animationDelay: '.6s' }} />
        <div className="mv-rise font-black leading-none" style={{ fontSize: u(6.2), animationDelay: '.8s' }}>{act.title}</div>
        {act.when && <div className="mv-rise text-white/60" style={{ fontSize: u(1.3), marginTop: u(1.2), animationDelay: '1.2s' }}>Ημέρα {act.day} · {act.when}</div>}
      </div>
    </div>
  );
}

// Ήχοι σκηνής: κάρτα πράξης, μετάβαση, κλήρωση, δοκιμασία, στέψη.
export function useMovieSounds(cg) {
  const prev = useRef({});
  useEffect(() => {
    if (!cg) return;
    const p = prev.current;
    const play = (name) => { try { tvSfx[name]?.(); } catch { /* χωρίς ήχο */ } };
    if (p.status && cg.status !== p.status) play(cg.status === 'finale' ? 'crown' : cg.status === 'transition' ? 'news' : cg.status === 'standby' ? 'round' : 'drama');
    if (cg.actStartedAt && cg.actStartedAt !== p.actStartedAt && p.actStartedAt !== undefined) play('drama');
    if (cg.drawn?.at && cg.drawn.at !== p.drawnAt && p.drawnAt !== undefined) play('dice');
    if (cg.trial?.at && cg.trial.at !== p.trialAt && !cg.trial.done && p.trialAt !== undefined) play(cg.trial.id === 'hogtie' ? 'arrest' : cg.trial.id === 'tickle' ? 'tickle' : 'alert');
    // Βίντεο εκπομπής: διάλειμμα, φινάλε, ένταλμα/Wanted, ελευθερία, σύλληψη (μόνο αν έχουν ανέβει).
    if (p.status && cg.status !== p.status) {
      if (cg.status === 'standby') playShowVideo('breakOutVideo');
      else if (p.status === 'standby') playShowVideo('breakBackVideo');
      if (cg.status === 'finale') playShowVideo('recapVideo', 'winnerRevealVideo');
    }
    if (cg.announce?.at && cg.announce.at !== p.announceAt && p.announceAt !== undefined && cg.announce.kind !== 'arrestwheel') playShowVideo('stinger_wanted');
    if (cg.dond?.awardedAt && cg.dond.awardedAt !== p.awardAt && p.awardAt !== undefined && cg.dond.status === 'won') playShowVideo('stinger_immunity');
    if (cg.trial?.at && cg.trial.at !== p.trialAt && !cg.trial.done && p.trialAt !== undefined && cg.trial.id === 'hogtie') playShowVideo('stinger_arrest');
    if (cg.wheel?.at && cg.wheel.at !== p.wheelAt && p.wheelAt !== undefined) { play('dice'); setTimeout(() => play('alert'), 4600); }
    if (cg.announce?.at && cg.announce.at !== p.announceAt && p.announceAt !== undefined) play(cg.announce.kind === 'mostwanted' ? 'crown' : 'arrest');
    if (cg.mandatory?.at && cg.mandatory.at !== p.mandatoryAt && p.mandatoryAt !== undefined) play('news');
    if (cg.mandatory?.drawnAt && cg.mandatory.drawnAt !== p.mDrawnAt && p.mDrawnAt !== undefined) play('dice');
    if (cg.dond?.lastOpened?.at && cg.dond.lastOpened.at !== p.boxAt && p.boxAt !== undefined) play('round');
    if (cg.dond?.offerAt && cg.dond.offerAt !== p.offerAt && p.offerAt !== undefined) play('news');
    if (cg.dond?.awardedAt && cg.dond.awardedAt !== p.awardAt && p.awardAt !== undefined) play('crown');
    if (cg.chair?.at && cg.chair.at !== p.chairAt && p.chairAt !== undefined) play('arrest');
    prev.current = { status: cg.status, actStartedAt: cg.actStartedAt || null, drawnAt: cg.drawn?.at || null, trialAt: cg.trial?.at || null,
      wheelAt: cg.wheel?.at || null, announceAt: cg.announce?.at || null, mandatoryAt: cg.mandatory?.at || null, mDrawnAt: cg.mandatory?.drawnAt || null,
      boxAt: cg.dond?.lastOpened?.at || null, offerAt: cg.dond?.offerAt || null, awardAt: cg.dond?.awardedAt || null, chairAt: cg.chair?.at || null };
  }, [cg?.status, cg?.actStartedAt, cg?.drawn?.at, cg?.trial?.at, cg?.wheel?.at, cg?.announce?.at, cg?.mandatory?.at, cg?.mandatory?.drawnAt, cg?.dond?.lastOpened?.at, cg?.dond?.offerAt, cg?.dond?.awardedAt, cg?.chair?.at]);
}

// «Πρωταγωνιστούν»: το καστ πριν από την πρώτη πράξη.
export function CastScreen({ players = [], cg, statsOf }) {
  const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-[5vw] text-white">
      <Letterbox />
      <div className="mv-rise font-semibold uppercase tracking-[0.5em] text-white/60" style={{ fontSize: u(1.2) }}>Deal of Temptation παρουσιάζει</div>
      <div className="mv-rise font-black" style={{ fontSize: u(5.5), animationDelay: '.3s' }}>Η ΤΑΙΝΙΑ</div>
      <div className="mv-line bg-[#E8C26B]" style={{ height: 2, width: u(16), margin: `${u(1.2)} 0`, animationDelay: '.6s' }} />
      <div className="mv-rise font-semibold uppercase tracking-[0.35em] text-[#E8C26B]" style={{ fontSize: u(1.2), animationDelay: '.8s' }}>Πρωταγωνιστούν</div>
      <div className="grid w-full max-w-[1500px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: u(1.2), marginTop: u(1.6) }}>
        {players.map((p, i) => {
          const nail = statsOf(cg, p.id).nail;
          return (
            <div key={p.id} className="mv-rise text-center" style={{ animationDelay: `${1 + i * 0.25}s` }}>
              <div className="font-black" style={{ fontSize: u(2.6) }}>{p.name}</div>
              <div className="text-white/55" style={{ fontSize: u(1.05) }}>{nail ? `💅 ${nail}` : 'ως η ίδια'}</div>
            </div>
          );
        })}
      </div>
      <div className="mv-rise text-white/50" style={{ fontSize: u(1.1), marginTop: u(2), animationDelay: `${1.2 + players.length * 0.25}s` }}>Σε 5 ηπείρους · {CONTINENTS.map((c) => c.short).join(' · ')}</div>
    </div>
  );
}

// Φωτογραφίες για το μοντάζ: ενότητες της Ταινίας, κάθε ηπείρου και τα gallery τους.
export function montagePhotos(movieModeId) {
  const out = [];
  const add = (url) => { if (url && !isVideoUrl(url) && !out.includes(url)) out.push(url); };
  const m = MODE_MEDIA[movieModeId] || {};
  (m.sections || []).forEach((s) => add(s.image));
  (m.gallery || []).forEach(add);
  CONTINENTS.forEach((c) => { const cm = MODE_MEDIA[c.id] || {}; add(cm.hero); (cm.gallery || []).forEach(add); (cm.sections || []).forEach((s) => add(s.image)); add(cm.cover); });
  return out.slice(0, 24);
}

// Τίτλοι τέλους: κυλιόμενοι, με μοντάζ φωτογραφιών στο φόντο.
export function EndCredits({ cg, players = [], rank = [], acts = [], nameOf, photos = [] }) {
  const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;
  const [i, setI] = useState(0);
  useEffect(() => { if (photos.length < 2) return undefined; const id = setInterval(() => setI((x) => (x + 1) % photos.length), 4500); return () => clearInterval(id); }, [photos.length]);
  const moments = (cg.log || []).filter((l) => /👑|✅|🧦|🔒|⚡|🎨|💅/.test(l.text)).slice(0, 12).reverse();
  const winner = rank[0];
  const Line = ({ a, b }) => <div className="flex justify-between" style={{ gap: u(2), fontSize: u(1.45), padding: `${u(0.25)} 0` }}><span className="text-white/55">{a}</span><span className="font-semibold">{b}</span></div>;
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {photos[i] && <img key={photos[i]} src={photos[i]} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="mv-kb absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.32 }} />}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
      <Letterbox />
      <div className="relative mx-auto h-screen max-w-[900px] overflow-hidden">
        <div className="mv-roll text-center" style={{ paddingTop: u(4) }}>
          <div className="font-semibold uppercase tracking-[0.5em] text-white/60" style={{ fontSize: u(1.2) }}>Deal of Temptation</div>
          <div className="font-black" style={{ fontSize: u(6) }}>Η ΤΑΙΝΙΑ</div>
          <div className="text-white/60" style={{ fontSize: u(1.4) }}>{acts.length} πράξεις · 5 ήπειροι</div>
          {winner && (
            <div style={{ margin: `${u(4)} 0` }}>
              <div className="font-semibold uppercase tracking-[0.35em] text-[#E8C26B]" style={{ fontSize: u(1.2) }}>Η Μεγάλη Νικήτρια</div>
              <div className="font-black text-[#F7E3A8]" style={{ fontSize: u(4.4) }}>👑 {winner.name}</div>
              <div className="text-white/60" style={{ fontSize: u(1.4) }}>{winner.score} τελικοί πόντοι</div>
            </div>
          )}
          <div className="font-semibold uppercase tracking-[0.35em] text-[#E8C26B]" style={{ fontSize: u(1.2), marginBottom: u(1) }}>Πρωταγωνίστησαν</div>
          {rank.map((p, k) => <Line key={p.id} a={`${k + 1}. ${p.name}`} b={`${p.score} · 💰${p.stats.loot} · 🪙${p.stats.tokens}${p.stats.nail ? ` · 💅 ${p.stats.nail}` : ''}`} />)}
          <div className="font-semibold uppercase tracking-[0.35em] text-[#E8C26B]" style={{ fontSize: u(1.2), margin: `${u(4)} 0 ${u(1)}` }}>Οι πράξεις</div>
          {acts.map((a, k) => {
            const c = (cg.conquered || {})[k];
            return <Line key={k} a={`Πράξη ${two(k + 1)} · ${continentOf(c?.continent || a.continent).short}`} b={`${a.title}${c?.winner ? ` — 👑 ${nameOf(c.winner)}` : ''}`} />;
          })}
          {moments.length > 0 && (
            <>
              <div className="font-semibold uppercase tracking-[0.35em] text-[#E8C26B]" style={{ fontSize: u(1.2), margin: `${u(4)} 0 ${u(1)}` }}>Στιγμές</div>
              {moments.map((m) => <div key={m.t + m.text} className="text-white/80" style={{ fontSize: u(1.3), padding: `${u(0.2)} 0` }}>{m.text}</div>)}
            </>
          )}
          <div className="font-semibold uppercase tracking-[0.35em] text-[#E8C26B]" style={{ fontSize: u(1.2), margin: `${u(4)} 0 ${u(1)}` }}>Σκηνοθεσία</div>
          <div style={{ fontSize: u(1.5) }}>Η διοργανώτρια · Tablet</div>
          <div className="text-white/55" style={{ fontSize: u(1.2), marginTop: u(0.5) }}>Γυρίστηκε ζωντανά, με {players.length} κινητά και μία TV.</div>
          <div className="font-black" style={{ fontSize: u(3), margin: `${u(6)} 0 ${u(30)}` }}>ΤΕΛΟΣ</div>
        </div>
      </div>
    </div>
  );
}
