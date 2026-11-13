import React, { useEffect, useRef, useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { pick, useTick, fmt } from '@/lib/modeKit';

// Real-Time Secret Missions: ξεκινούν από το tablet και εμφανίζονται κρυφά στο κινητό της παίκτριας.
export default function MissionPanel({ ctx, pool, onSuccess, onFail, title = '📲 Secret Missions' }) {
  const { players, mg, setMg, log } = ctx;
  const missions = mg.missions || {};
  const [target, setTarget] = useState('random');
  const [auto, setAuto] = useState(false);
  const [everyMin, setEveryMin] = useState(6);
  useTick(true, 1000);

  function send() {
    const cur = ctx.mg.missions || {};
    const free = players.filter((p) => !cur[p.id] || cur[p.id].status !== 'active');
    const p = target === 'random' ? pick(free.length ? free : players) : players.find((x) => x.id === target);
    if (!p) return;
    const m = pick(pool);
    setMg({
      missions: {
        ...cur,
        [p.id]: { ...m, playerId: p.id, sentAt: Date.now(), expiresAt: Date.now() + (m.mins || 5) * 60000, status: 'active' },
      },
    });
    log(`📲 Μυστική αποστολή στο κινητό της ${p.name}: «${m.title}»`);
  }
  const sendRef = useRef(send);
  sendRef.current = send;

  useEffect(() => {
    if (!auto) return undefined;
    const i = setInterval(() => sendRef.current(), everyMin * 60000);
    return () => clearInterval(i);
  }, [auto, everyMin]);

  function finish(pid, ok) {
    const m = missions[pid];
    if (!m) return;
    setMg({ missions: { ...missions, [pid]: { ...m, status: ok ? 'done' : 'failed' } } });
    const name = players.find((p) => p.id === pid)?.name;
    log(`${ok ? '✅' : '❌'} ${name}: «${m.title}»`);
    if (ok) onSuccess?.(m, pid); else onFail?.(m, pid);
  }

  const active = Object.values(missions).filter((m) => m.status === 'active');

  return (
    <Panel title={title}>
      <div className="flex flex-wrap items-center gap-2">
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="px-2 py-2 rounded bg-background border border-border text-sm">
          <option value="random">🎲 Τυχαία παίκτρια</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Btn color="bg-fuchsia-700" onClick={send}>📲 Στείλε αποστολή</Btn>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          αυτόματα κάθε
          <input
            type="number" min="1" max="30" value={everyMin}
            onChange={(e) => setEveryMin(Math.max(1, Number(e.target.value) || 1))}
            className="w-12 px-1 rounded bg-background border border-border text-center"
          />
          λεπτά
        </label>
      </div>
      {active.length === 0 && <div className="text-xs opacity-60">Καμία ενεργή αποστολή. Οι αποστολές εμφανίζονται στο κινητό της παίκτριας (άνοιγμα /play).</div>}
      {active.map((m) => {
        const name = players.find((p) => p.id === m.playerId)?.name;
        const left = (m.expiresAt - Date.now()) / 1000;
        return (
          <div key={m.playerId} className="rounded border border-fuchsia-500/50 bg-fuchsia-950/40 p-2 text-sm space-y-1">
            <div className="flex justify-between gap-2">
              <b>{name} · {m.title}</b>
              <span className={left <= 0 ? 'text-red-400' : 'text-fuchsia-200'}>{left > 0 ? fmt(left) : 'έληξε'}</span>
            </div>
            <div className="text-xs opacity-80">{m.text}</div>
            <div className="flex gap-2">
              <Btn color="bg-emerald-700" className="!py-1.5" onClick={() => finish(m.playerId, true)}>✅ Πέτυχε</Btn>
              <Btn color="bg-red-800" className="!py-1.5" onClick={() => finish(m.playerId, false)}>❌ Απέτυχε</Btn>
            </div>
          </div>
        );
      })}
    </Panel>
  );
}
