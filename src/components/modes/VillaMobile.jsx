import React, { useState } from 'react';
import * as V from '@/lib/villaEngine';
import { pointsOf } from '@/lib/modeRanking';
import { SQUARE_TYPES } from '@/data/modes/villaContent';

const Card = ({ title, children, tone }) => (
  <section className="rounded-3xl p-4" style={{ background: tone || '#1C1C1E' }}>
    {title && <div className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/55">{title}</div>}
    {children}
  </section>
);

// VILLA TAKEOVER — το προσωπικό κινητό: ρόλος, ενδείξεις κωδικού, συμμαχίες, ειδοποιήσεις, κάρτα, ψήφος, κωδικός.
export default function VillaMobile({ state, me, sendAction }) {
  const mg = state.mg || {};
  const v = mg.villa || {};
  const players = state.players || [];
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '—';
  const [code, setCode] = useState('');
  const role = V.roleOf(v.roles?.[me.id]);
  const clues = v.clues?.[me.id] || [];
  const alliances = (v.alliances || []).filter((a) => a.members.includes(me.id));
  const alerts = V.visibleAlerts(v, me.id).slice(0, 6);
  const square = V.squareAt(v.sq || 1);
  const myCard = v.card?.pid === me.id ? v.card : null;
  const quiet = !!v.quiet?.[me.id];

  return (
    <div className="space-y-3 text-white">
      <Card>
        <div className="flex items-center justify-between">
          <div><div className="text-[13px] text-white/55">Οι πόντοι μου</div><div className="text-3xl font-bold tabular-nums text-[#E8C26B]">{pointsOf(mg, me.id)}</div></div>
          <div className="text-right"><div className="text-[13px] text-white/55">Τετράγωνο</div><div className="text-2xl font-bold tabular-nums">{v.sq || 1}<span className="text-base text-white/40">/{V.lastSquare(v)}</span></div></div>
        </div>
        {square && <div className="mt-2 text-sm text-white/75">{SQUARE_TYPES[square.type]?.icon} {square.title}</div>}
      </Card>

      {myCard && (
        <Card title={myCard.kind === 'truth' ? 'Αλήθεια 18+ για σένα' : 'Θάρρος 18+ για σένα'} tone="#2A1F0A">
          <div className="text-lg font-semibold">{myCard.title}</div>
          <p className="mt-1 text-white/85">{myCard.text}</p>
          {!myCard.response ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => sendAction('villa_response', { value: 'done' })} className="h-12 rounded-full bg-[#E8C26B] font-bold text-black">✋ Το έκανα</button>
              <button type="button" onClick={() => sendAction('villa_response', { value: 'pass' })} className="h-12 rounded-full bg-[#2C2C2E] font-semibold">PASS</button>
            </div>
          ) : <div className="mt-2 text-sm text-white/60">Στάλθηκε: {myCard.response === 'pass' ? 'PASS' : 'Το έκανα'}</div>}
        </Card>
      )}

      {v.vote?.open && (
        <Card title={`🗳️ ${v.vote.q}`}>
          <div className="grid grid-cols-2 gap-2">{players.filter((p) => p.id !== me.id).map((p) => (
            <button key={p.id} type="button" onClick={() => sendAction('villa_vote', { target: p.id })} className="h-11 rounded-2xl bg-[#2C2C2E] text-sm font-semibold">{p.name}</button>
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
        <p className="mt-1 text-xs text-white/45">Λάθος κωδικός = Penalty Surge. Ανταλλάξτε ενδείξεις στο Blackmail Market.</p>
      </Card>

      {alliances.length > 0 && <Card title="🤝 Οι συμμαχίες μου">{alliances.map((a) => <div key={a.id} className="text-sm">{a.members.filter((id) => id !== me.id).map(nameOf).join(', ')}</div>)}</Card>}

      <Card title="🔔 Ειδοποιήσεις">
        {alerts.length ? alerts.map((a) => <div key={a.id} className="border-b border-white/10 py-2 last:border-0"><div className="text-sm font-semibold">{a.title}{a.to !== 'all' ? ' · προσωπικό' : ''}</div><div className="text-sm text-white/75">{a.text}</div></div>) : <div className="text-sm text-white/55">Καμία ακόμα.</div>}
        <button type="button" onClick={() => sendAction('villa_quiet', { value: !quiet })} className="mt-3 flex w-full items-center justify-between rounded-2xl bg-[#2C2C2E] px-4 py-3 text-sm">
          <span>🌙 Ώρες ησυχίας (χωρίς push)</span><span className={`h-[28px] w-[48px] rounded-full p-[2px] ${quiet ? 'bg-[#30D158]' : 'bg-white/20'}`}><span className={`block h-6 w-6 rounded-full bg-white ${quiet ? 'translate-x-5' : ''}`} /></span>
        </button>
        <p className="mt-1 text-xs text-white/45">Ο ύπνος δεν τιμωρείται. PASS και ΣΤΟΠ ισχύουν πάντα.</p>
      </Card>
    </div>
  );
}
