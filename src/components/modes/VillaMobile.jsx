import React, { useState } from 'react';
import * as V from '@/lib/villaEngine';
import { pointsOf } from '@/lib/modeRanking';
import { SQUARE_TYPES, STRIP_STEPS, NAIL_COLORS, FOOTWEAR_LEVELS, KIND_LABEL, COPS_GAME, VILLA_LOOT } from '@/data/modes/villaContent';
import { consentOf } from '@/lib/consent';
import { useTick } from '@/lib/modeKit';

const Card = ({ title, children, tone }) => (
  <section className="rounded-3xl p-4" style={{ background: tone || '#1C1C1E' }}>
    {title && <div className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/55">{title}</div>}
    {children}
  </section>
);

// VILLA TAKEOVER — το προσωπικό κινητό: Live Radar (πόδια & νύχια), Round Strip, κάρτα, διαταγές, ρόλος, κωδικός, ειδοποιήσεις.
export default function VillaMobile({ state, me, sendAction }) {
  useTick(true, 1000);
  const mg = state.mg || {};
  const v = mg.villa || {};
  const players = state.players || [];
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '—';
  const [code, setCode] = useState('');
  const [victim, setVictim] = useState('');
  if (!mg.villa) return <Card><div className="text-white/70">Η Villa ετοιμάζεται… Περίμενε τη διοργανώτρια.</div></Card>;
  const now = Date.now();
  const role = V.roleOf(v.roles?.[me.id]);
  const clues = v.clues?.[me.id] || [];
  const alliances = (v.alliances || []).filter((a) => a.members.includes(me.id));
  const alerts = V.visibleAlerts(v, me.id).slice(0, 8);
  const no = v.sq || 1;
  const square = V.squareAt(no, v);
  const phase = V.phaseOf(no, v);
  const myCard = v.card?.pid === me.id ? v.card : null;
  const quiet = !!v.quiet?.[me.id];
  const strip = V.stripInfo(v);
  const prof = v.profile?.[me.id] || {};
  const level = V.footwearLevelOf(v, me.id);
  const command = V.commandActive(v, now) ? v.command : null;
  const statue = V.statueActive(v, now) ? Math.ceil((v.statue.until - now) / 1000) : 0;
  const canHeist = v.night && !consentOf(mg, me.id).optOuts.includes('night');
  const heistTargets = players.filter((p) => p.id !== me.id && !consentOf(mg, p.id).optOuts.includes('night'));
  const copRole = v.cops ? (v.cops.cops.includes(me.id) ? COPS_GAME.roles[0] : v.cops.thieves.includes(me.id) ? COPS_GAME.roles[1] : null) : null;
  const loot = V.lootOf(v, me.id);

  if (statue) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-3xl bg-black text-center text-white" role="alert">
        <div className="text-5xl font-black tracking-[0.15em]">🗿 ΑΓΑΛΜΑ</div>
        <p className="mt-2 text-white/70">Πάγωσε στη στάση που βρίσκεσαι.</p>
        <div className="mt-4 text-7xl font-bold tabular-nums text-[#E8C26B]">{statue}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-white">
      {command && command.pid === me.id && (
        <Card tone="#B0130B">
          <div className="text-2xl font-black">🟥 ΑΠΟΛΥΤΗ ΔΙΑΤΑΓΗ</div>
          <p className="mt-1 text-white/90">Είσαι ο Διοικητής μέχρι τις {new Date(command.until).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}. Οι εντολές σου εκτελούνται — πάντα μέσα στα όρια που δήλωσε κάθε παίκτρια.</p>
          <div className="mt-2 text-lg font-bold">{command.title}</div>
          <p className="text-white/85">{command.text}</p>
        </Card>
      )}
      {command && command.pid !== me.id && <Card tone="#3A0A08"><div className="font-semibold">🟥 Απόλυτη Διαταγή σε εξέλιξη · Διοικητής: {nameOf(command.pid)}</div></Card>}

      <Card>
        <div className="flex items-center justify-between">
          <div><div className="text-[13px] text-white/55">Οι πόντοι μου</div><div className="text-3xl font-bold tabular-nums text-[#E8C26B]">{pointsOf(mg, me.id)}</div></div>
          <div className="text-right"><div className="text-[13px] text-white/55">Ημέρα {phase.day} · τετράγωνο</div><div className="text-2xl font-bold tabular-nums">{no}<span className="text-base text-white/40">/{V.lastSquare(v)}</span></div></div>
        </div>
        <div className="mt-2 text-sm text-white/75">{phase.title}{v.night ? ' · 🌙 Night Mode' : ''}</div>
        {square && <div className="mt-1 text-sm text-white/75">{SQUARE_TYPES[square.type]?.icon} {square.title}</div>}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">{VILLA_LOOT.map((l) => <span key={l.id}>{l.icon} {loot[l.id]}</span>)}<span>Karma {v.karma?.[me.id] || 0}</span></div>
      </Card>

      <Card title={`👟 Round Strip · γύρος ${v.strip || 0}/4`}>
        <div className="grid grid-cols-4 gap-1.5">{STRIP_STEPS.map((s) => (
          <div key={s.step} className="rounded-xl p-1.5 text-center text-[11px] font-semibold" style={{ background: (v.strip || 0) >= s.step ? '#E8C26B' : '#2C2C2E', color: (v.strip || 0) >= s.step ? '#000' : '#8E8E93' }}>{s.item}</div>
        ))}</div>
        {strip && <p className="mt-2 text-sm text-white/85">{strip.tv}</p>}
      </Card>

      <Card title="📡 Live Radar — τα πόδια μου">
        <div className="text-sm text-white/70">Επίπεδο υποδημάτων: <b className="text-white">{level} · {FOOTWEAR_LEVELS.find((f) => f.level === level)?.label}</b></div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">{FOOTWEAR_LEVELS.map((f) => (
          <button key={f.level} type="button" onClick={() => sendAction('villa_profile', { footwear: f.level })} className="h-10 rounded-xl text-xs font-semibold" style={{ background: prof.footwear === f.level ? '#E8C26B' : '#2C2C2E', color: prof.footwear === f.level ? '#000' : '#fff' }}>{f.label}</button>
        ))}</div>
        <div className="mt-3 text-sm text-white/70">Χρώμα νυχιών ποδιών</div>
        <div className="mt-1 flex flex-wrap gap-1.5">{NAIL_COLORS.map((c) => (
          <button key={c} type="button" onClick={() => sendAction('villa_profile', { nail: c })} className="h-10 rounded-full px-3 text-sm font-semibold" style={{ background: prof.nail === c ? '#FF375F' : '#2C2C2E' }}>💅 {c}</button>
        ))}</div>
      </Card>

      {myCard && (
        <Card title={`${myCard.deckLabel || KIND_LABEL[myCard.kind] || 'Κάρτα'} για σένα`} tone="#2A1F0A">
          {myCard.image && <img src={myCard.image} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="mb-2 aspect-video w-full rounded-xl object-cover" />}
          <div className="text-lg font-semibold">{myCard.no ? `#${myCard.no} — ` : ''}{myCard.title}</div>
          <p className="mt-1 text-white/85">{myCard.text}</p>
          {myCard.secs && <div className="mt-1 text-sm text-[#E8C26B]">⏱ Live Countdown: {myCard.secs}″</div>}
          {!myCard.response ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => sendAction('villa_response', { value: 'done' })} className="h-12 rounded-full bg-[#E8C26B] font-bold text-black">✋ Το έκανα</button>
              <button type="button" onClick={() => sendAction('villa_response', { value: 'pass' })} className="h-12 rounded-full bg-[#2C2C2E] font-semibold">PASS</button>
            </div>
          ) : <div className="mt-2 text-sm text-white/60">Στάλθηκε: {myCard.response === 'pass' ? 'PASS' : 'Το έκανα'}</div>}
        </Card>
      )}

      {copRole && (
        <Card title={COPS_GAME.title} tone="#1A0B0B">
          <div className="text-xl font-bold">{copRole.icon} {copRole.name}</div>
          <p className="mt-1 text-sm text-white/80">{copRole.text}</p>
          <p className="mt-2 text-sm text-white/70"><b>Φάση {v.cops.phase + 1}/5 — {COPS_GAME.phases[v.cops.phase].title}</b></p>
          {v.cops.caught.includes(me.id) && <p className="mt-1 text-sm font-semibold text-[#FF453A]">🚔 Συνελήφθης.</p>}
        </Card>
      )}

      {canHeist && (
        <Card title="🧦 Night Sock Heist" tone="#0B0B1F">
          <p className="text-sm text-white/75">Αθόρυβα, χωρίς βίαιο τράβηγμα. Δήλωσε την κάλτσα που πήρες:</p>
          <div className="mt-2 flex gap-2">
            <select value={victim} onChange={(e) => setVictim(e.target.value)} className="h-12 flex-1 rounded-2xl bg-[#2C2C2E] px-3" aria-label="Από ποια">
              <option value="">— Από ποια —</option>{heistTargets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="button" disabled={!victim} onClick={() => { sendAction('villa_heist', { target: victim }); setVictim(''); }} className="h-12 rounded-full bg-[#BF5AF2] px-5 font-bold disabled:opacity-40">Δήλωση</button>
          </div>
        </Card>
      )}

      {v.vote?.open && (
        <Card title={`🗳️ ${v.vote.q}`}>
          <div className="grid grid-cols-2 gap-2">{players.filter((p) => p.id !== me.id).map((p) => (
            <button key={p.id} type="button" onClick={() => sendAction('villa_vote', { target: p.id })} className="h-11 rounded-2xl bg-[#2C2C2E] text-sm font-semibold">{p.name}{v.vote.kind === 'nail' && v.profile?.[p.id]?.nail ? ` · ${v.profile[p.id].nail}` : ''}</button>
          ))}</div>
        </Card>
      )}

      <Card title="Ο μυστικός μου ρόλος">
        {role ? <><div className="text-xl font-bold">{role.icon} {role.name}</div><p className="mt-1 text-sm text-white/75">{role.text}</p></> : <div className="text-white/70">Villa Guest — χωρίς ειδικό ρόλο. Παίξε έξυπνα.</div>}
      </Card>

      <Card title="🔑 Ενδείξεις κωδικού (μόνο εσύ τις βλέπεις)">
        <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex h-14 items-center justify-center rounded-2xl text-2xl font-bold" style={{ background: clues.includes(i) ? '#E8C26B' : '#2C2C2E', color: clues.includes(i) ? '#000' : '#636366' }}>{clues.includes(i) ? (v.myDigits?.[i] ?? v.code?.[i] ?? '★') : '?'}</div>
        ))}</div>
        <div className="mt-3 flex gap-2">
          <input inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Κωδικός 4 ψηφίων" className="h-12 flex-1 rounded-2xl bg-[#2C2C2E] px-4 text-lg tracking-[0.3em]" />
          <button type="button" disabled={code.length !== 4} onClick={() => { sendAction('villa_code', { code }); setCode(''); }} className="h-12 rounded-full bg-[#E8C26B] px-5 font-bold text-black disabled:opacity-40">Δοκίμασε</button>
        </div>
        <p className="mt-1 text-xs text-white/45">Σωστός = Lockdown Override · λάθος = Alarm / Penalty Surge. Προσοχή στις Decoy παγίδες.</p>
      </Card>

      {alliances.length > 0 && <Card title="🤝 Οι συμμαχίες μου">{alliances.map((a) => <div key={a.id} className="text-sm">{a.broken ? '💔 ' : ''}{a.type ? `${a.type}: ` : ''}{a.members.filter((id) => id !== me.id).map(nameOf).join(', ')}</div>)}</Card>}

      <Card title="🔔 Ειδοποιήσεις">
        {alerts.length ? alerts.map((a) => <div key={a.id} className="border-b border-white/10 py-2 last:border-0"><div className="text-sm font-semibold">{a.title}{a.to !== 'all' ? ' · προσωπικό' : ''}</div><div className="text-sm text-white/75">{a.text}</div></div>) : <div className="text-sm text-white/55">Καμία ακόμα.</div>}
        <button type="button" onClick={() => sendAction('villa_quiet', { value: !quiet })} className="mt-3 flex w-full items-center justify-between rounded-2xl bg-[#2C2C2E] px-4 py-3 text-sm">
          <span>🌙 Ώρες ησυχίας (χωρίς push)</span><span className={`h-[28px] w-[48px] rounded-full p-[2px] ${quiet ? 'bg-[#30D158]' : 'bg-white/20'}`}><span className={`block h-6 w-6 rounded-full bg-white ${quiet ? 'translate-x-5' : ''}`} /></span>
        </button>
        <p className="mt-1 text-xs text-white/45">Συναίνεση και όρια πάνω από όλα. PASS και ΣΤΟΠ ισχύουν πάντα.</p>
      </Card>
    </div>
  );
}
