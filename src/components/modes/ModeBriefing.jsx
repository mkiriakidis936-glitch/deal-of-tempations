import React, { useEffect, useRef, useState } from 'react';
import { MODE_GUIDE, SAFETY_RULES, PLAYER_REMINDERS, SCREENS, currentPhase, phaseIdFor } from '@/data/modes/modeGuide';
import { modeMeta } from '@/data/modes/modeRegistry';
import { modeArtUrl } from '@/components/modes/ModeArt';
import { rankPlayers, pointsOf, championOf, finalStandings } from '@/lib/modeRanking';

// Η εισαγωγή εμφανίζεται μόνο σε νέες παρτίδες (briefingRequired) μέχρι η διοργανώτρια να πατήσει «Ξεκινάμε».
export const briefingPending = (mg = {}, modeId) => !!MODE_GUIDE[modeId] && !!mg.briefingRequired && !mg.briefingDone;

const Phases = ({ guide, size = 'md' }) => (
  <ol className="grid gap-2 sm:grid-cols-2">
    {guide.phases.map((phase, i) => (
      <li key={phase.id} className="flex gap-3 rounded-2xl bg-white/5 p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8C26B] text-sm font-black text-black">{i + 1}</span>
        <div className="min-w-0"><div className={`font-bold ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>{phase.title}</div><div className={`text-white/65 ${size === 'lg' ? 'text-lg' : 'text-xs'}`}>{phase.text}</div></div>
      </li>
    ))}
  </ol>
);

const Safety = ({ size = 'md' }) => (
  <div className={`rounded-2xl border border-[#FF453A]/40 bg-[#1A0B0A] p-4 ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
    <div className="font-bold text-[#FF8A80]">🛑 Ασφάλεια πάνω απ' όλα</div>
    <div className="mt-1">{SAFETY_RULES.stop}</div>
    <div className="mt-1 text-white/75">{SAFETY_RULES.pass}</div>
    <div className="mt-2 flex flex-wrap gap-1.5">{SAFETY_RULES.boundaries.map((b) => <span key={b} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{b}</span>)}</div>
  </div>
);

// ---------- Tablet ----------
export function BriefingTablet({ state, setMg, log }) {
  const meta = modeMeta(state.mode);
  const guide = MODE_GUIDE[state.mode];
  if (!guide) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-[#1C1C1E] p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E8C26B]">Εισαγωγή · η TV δείχνει τώρα τους κανόνες</div>
        <div className="mt-1 text-3xl font-bold">{meta?.icon} {meta?.name}</div>
        <p className="mt-2 text-white/75">{guide.tagline}</p>
        <p className="mt-3"><b>Στόχος:</b> {guide.goal}</p>
        <p className="mt-1"><b>Νίκη:</b> {guide.win}</p>
      </div>
      <Phases guide={guide} />
      <Safety />
      <button type="button" onClick={() => { setMg({ briefingDone: true, briefingDoneAt: Date.now() }); log?.('🎬 Η εισαγωγή ολοκληρώθηκε — ξεκινάμε!'); }}
        className="h-16 w-full rounded-full bg-[#E8C26B] text-xl font-black text-black">▶ Ξεκινάμε</button>
    </div>
  );
}

// ---------- TV ----------
export function BriefingTV({ state }) {
  const meta = modeMeta(state.mode);
  const guide = MODE_GUIDE[state.mode];
  const art = modeArtUrl(state.mode, '');
  if (!guide) return null;
  // Όλα χωράνε σε μία οθόνη TV (χωρίς scroll): μεγέθη με βάση το μικρότερο από πλάτος/ύψος.
  const u = (n) => `min(${n}vw, ${n * 1.75}vh)`;
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-black text-white" style={{ padding: `${u(4.5)} ${u(3)} ${u(2)}`, gap: u(1.2) }}>
      {art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
      <div className="relative">
        <div className="font-semibold uppercase tracking-[0.3em] text-[#E8C26B]" style={{ fontSize: u(1.2) }}>Πώς παίζεται</div>
        <div className="font-bold leading-none" style={{ fontSize: u(3.8) }}>{meta?.icon} {meta?.name}</div>
        <div className="max-w-[75vw] text-white/80" style={{ fontSize: u(1.5), marginTop: u(0.6) }}>{guide.tagline}</div>
      </div>
      <div className="relative grid grid-cols-3" style={{ gap: u(1.2), fontSize: u(1.2) }}>
        <div className="col-span-2 rounded-3xl bg-white/5" style={{ padding: u(1.2) }}><b className="text-[#E8C26B]">Στόχος</b><div>{guide.goal}</div><b className="block text-[#E8C26B]" style={{ marginTop: u(0.6) }}>Νίκη</b><div>{guide.win}</div></div>
        <div className="rounded-3xl border border-[#FF453A]/50 bg-[#1A0B0A]/80" style={{ padding: u(1.2) }}><b className="text-[#FF8A80]">🛑 ΣΤΟΠ & PASS</b><div style={{ fontSize: u(1.05), marginTop: u(0.4) }}>Το ΣΤΟΠ σταματά αμέσως τα πάντα. Το PASS είναι πάντα διαθέσιμο.</div></div>
      </div>
      <ol className="relative grid min-h-0 grid-cols-3 content-start" style={{ gap: u(1) }}>
        {guide.phases.map((phase, i) => (
          <li key={phase.id} className="flex min-h-0 overflow-hidden rounded-3xl bg-white/5" style={{ gap: u(0.8), padding: u(1) }}>
            <span className="flex shrink-0 items-center justify-center rounded-full bg-[#E8C26B] font-black text-black" style={{ width: u(2.6), height: u(2.6), fontSize: u(1.2) }}>{i + 1}</span>
            <div className="min-w-0"><div className="line-clamp-2 font-bold leading-tight" style={{ fontSize: u(1.25) }}>{phase.title}</div><div className="line-clamp-2 text-white/70" style={{ fontSize: u(1), marginTop: u(0.3) }}>{phase.text}</div></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------- Κινητό ----------
export function BriefingMobile({ state }) {
  const meta = modeMeta(state.mode);
  const guide = MODE_GUIDE[state.mode];
  if (!guide) return null;
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-[#1C1C1E] p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">Σε λίγο ξεκινάμε</div>
        <div className="mt-1 text-2xl font-bold">{meta?.icon} {meta?.name}</div>
        <p className="mt-2 text-sm text-white/75">{guide.goal}</p>
      </div>
      <div className="rounded-3xl bg-[#1C1C1E] p-4">
        <div className="mb-2 text-sm font-bold">Να θυμάσαι</div>
        <ul className="space-y-1.5 text-sm text-white/80">{PLAYER_REMINDERS.map((r) => <li key={r}>• {r}</li>)}</ul>
      </div>
      <Safety />
    </div>
  );
}

// ---------- Οδηγίες τρέχουσας φάσης (Tablet) ----------
export function PhaseGuideTablet({ state }) {
  const phase = currentPhase(state);
  if (!phase) return null;
  return (
    <div className="rounded-3xl border border-[#E8C26B]/30 bg-[#17140C] p-4">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8C26B]">
        <span>Φάση {phase.index + 1}/{phase.total}</span>
        <span className="flex gap-1">{Array.from({ length: phase.total }, (_, i) => <span key={i} className={`h-1.5 w-6 rounded-full ${i <= phase.index ? 'bg-[#E8C26B]' : 'bg-white/15'}`} />)}</span>
      </div>
      <div className="mt-1 text-lg font-bold">{phase.title}</div>
      <div className="text-sm text-white/70">{phase.text}</div>
      {phase.next && <div className="mt-2 rounded-2xl bg-black/40 px-3 py-2 text-sm"><b className="text-[#F7E3A8]">➜ Επόμενη ενέργεια:</b> {phase.next}</div>}
    </div>
  );
}

// ---------- Μετάβαση φάσης στην TV: μεγάλη κάρτα για 6″ όταν αλλάζει φάση ----------
export function PhaseTransitionTV({ state }) {
  const id = phaseIdFor(state);
  const prev = useRef(id);
  const [shownAt, setShownAt] = useState(0);
  useEffect(() => {
    if (prev.current && id && prev.current !== id) setShownAt(Date.now());
    prev.current = id;
  }, [id]);
  const briefingDoneAt = state?.mg?.briefingDoneAt || 0;
  useEffect(() => {
    if (briefingDoneAt && Date.now() - briefingDoneAt < 8000) setShownAt(Date.now());
  }, [briefingDoneAt]);
  useEffect(() => {
    if (!shownAt) return undefined;
    const t = setTimeout(() => setShownAt(0), 6000);
    return () => clearTimeout(t);
  }, [shownAt]);
  const phase = currentPhase(state);
  if (!shownAt || !phase) return null;
  const art = modeArtUrl(state.mode, phase.id);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 dot-phase-in" role="status">
      {art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}
      <div className="relative text-center">
        <div className="text-[1.6vw] font-semibold uppercase tracking-[0.4em] text-[#E8C26B]">Φάση {phase.index + 1} από {phase.total}</div>
        <div className="mt-[1vw] max-w-[80vw] text-[4.5vw] font-bold leading-tight text-white">{phase.title}</div>
        <div className="mx-auto mt-[1vw] max-w-[60vw] text-[1.8vw] text-white/75">{phase.text}</div>
      </div>
    </div>
  );
}

// ---------- Τελετή νικήτριας στην TV ----------
export function ChampionCeremonyTV({ state }) {
  const players = state.players || [];
  const mg = state.mg || {};
  const champion = championOf(players, mg);
  const podium = finalStandings(players, mg).slice(0, 3);
  const art = modeArtUrl(state.mode, '');
  const meta = modeMeta(state.mode);
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {art && <img src={art} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(232,194,107,0.35),transparent_60%)]" />
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-[2vw] p-[3vw] text-center">
        <div className="text-[1.6vw] font-semibold uppercase tracking-[0.4em] text-[#E8C26B]">{meta?.name} · Τελικό αποτέλεσμα</div>
        {champion && (
          <div className="dot-crown-in">
            <div className="text-[7vw] leading-none">👑</div>
            <div className="text-[6vw] font-bold leading-none text-[#F7E3A8]">{champion.player.name}</div>
            <div className="mt-[0.8vw] text-[2vw] text-white/80">{champion.title}</div>
          </div>
        )}
        <div className="mt-[2vw] flex items-end justify-center gap-[2vw]">
          {[podium[1], podium[0], podium[2]].map((p, i) => p && (
            <div key={p.id} className="w-[16vw] rounded-t-3xl bg-white/10 p-[1vw]" style={{ height: ['13vw', '18vw', '10vw'][i] }}>
              <div className="text-[2.5vw]">{['🥈', '🥇', '🥉'][i]}</div>
              <div className="truncate text-[1.6vw] font-bold">{p.name}</div>
              <div className="text-[1.3vw] tabular-nums text-[#E8C26B]">{pointsOf(mg, p.id)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Προσωπικό dashboard κινητού ----------
export function PlayerDashboard({ state, me }) {
  const mg = state.mg || {};
  const players = state.players || [];
  const ranking = rankPlayers(players, mg);
  const position = ranking.findIndex((p) => p.id === me?.id) + 1;
  const phase = currentPhase(state);
  if (!me) return null;
  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Η κατάστασή μου">
      <div className="rounded-2xl bg-[#1C1C1E] p-3 text-center"><div className="text-2xl font-bold tabular-nums">{position ? `#${position}` : '—'}</div><div className="text-[11px] text-white/55">Θέση από {players.length}</div></div>
      <div className="rounded-2xl bg-[#1C1C1E] p-3 text-center"><div className="text-2xl font-bold tabular-nums text-[#E8C26B]">{pointsOf(mg, me.id)}</div><div className="text-[11px] text-white/55">Πόντοι</div></div>
      <div className="rounded-2xl bg-[#1C1C1E] p-3 text-center"><div className="truncate text-sm font-bold">{phase ? `${phase.index + 1}/${phase.total}` : '—'}</div><div className="truncate text-[11px] text-white/55">{phase ? phase.title.split(' — ')[0] : 'Φάση'}</div></div>
    </div>
  );
}

export { SCREENS };
