import React, { useEffect, useRef, useState } from 'react';
import { MODE_THEMES, modeMeta } from '@/data/modes/modeRegistry';
import { CHAOS_POWERS, GATE_TOKENS } from '@/data/modes/extendedContent';
import { EXIT_CODE } from '@/data/modes/lockdownContent';
import { fmt, sfx, timerLeft, timerPause, useTick } from '@/lib/modeKit';

// Οθόνη κινητού (/play) για τα 4 νέα modes.
export default function ModeMobile({ state, me, updateState, onChangePlayer }) {
  const mg = state.mg || {};
  const meta = modeMeta(state.mode);
  const theme = MODE_THEMES[state.mode];
  const players = state.players || [];
  useTick(true, 500);

  const mission = (mg.missions || {})[me.id];
  const missionKey = mission ? `${mission.sentAt}` : null;
  const seen = useRef(null);
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    if (!mission || mission.status !== 'active' || seen.current === missionKey) return;
    seen.current = missionKey;
    setAlert(true);
    sfx.buzz(400);
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker?.ready
          .then((r) => r.showNotification('🕵️ Μυστική αποστολή', { body: mission.title, vibrate: [200, 100, 200] }))
          .catch(() => new Notification('🕵️ Μυστική αποστολή', { body: mission.title }));
      }
    } catch { /* οι ειδοποιήσεις δεν είναι διαθέσιμες */ }
  }, [missionKey]);

  function askNotif() { try { Notification.requestPermission(); } catch { /* ignore */ } }

  function panic() {
    if (mg.stop) return;
    updateState({ mg: { stop: true, stopAt: Date.now(), stopBy: me.id, timer: timerPause(mg.timer) } });
  }

  const ld = mg.ld || {};
  const bb = mg.bb || {};
  const tokens = (mg.tokens || {})[me.id] || 0;
  const hand = (mg.chaosCards || {})[me.id] || [];
  const act = meta.acts[Math.min(mg.actIndex || 0, meta.acts.length - 1)];
  const isLockdown = act === 'lockdown';
  const left = timerLeft(mg.timer);
  const ranking = [...players].sort((a, b) => ((mg.scores || {})[b.id] || 0) + ((mg.tokens || {})[b.id] || 0) - (((mg.scores || {})[a.id] || 0) + ((mg.tokens || {})[a.id] || 0)));

  return (
    <div className="min-h-screen p-3 pb-24 text-foreground" style={{ background: theme.bg }}>
      <div className="max-w-md mx-auto space-y-3">
        <div className="text-center">
          <div className="font-display text-xl" style={{ color: theme.accent, textShadow: `0 0 12px ${theme.accent}88` }}>{meta.icon} {meta.name}</div>
          <div className="text-xs opacity-60">{me.name}</div>
        </div>

        {mg.timer && (
          <div className={`text-center font-display text-5xl tabular-nums ${left < 60 ? 'comic-pulse' : ''}`} style={{ color: left < 60 ? '#FF003C' : theme.accent2 }}>{fmt(left)}</div>
        )}

        {mg.stop && (
          <div className="rounded-lg p-4 text-center" style={{ background: '#78001e' }}>
            <div className="font-display text-3xl text-white">⏸ ΣΤΟΠ</div>
            <div className="text-sm text-white/90">Όλα σταμάτησαν. Λύστε δεσίματα και ελέγξτε ότι είστε όλες καλά. Η συνέχεια γίνεται από το tablet.</div>
          </div>
        )}

        {mission && mission.status === 'active' && (
          <div className="rounded-lg p-3 space-y-1" style={{ background: '#2a0033', border: '2px solid #d946ef' }}>
            <div className="text-xs uppercase tracking-widest text-fuchsia-300">🕵️ Μυστική αποστολή · μόνο για σένα</div>
            <div className="font-heading text-lg">{mission.title}</div>
            <div className="text-sm">{mission.text}</div>
            <div className="text-xs opacity-70">Λήγει σε {fmt((mission.expiresAt - Date.now()) / 1000)} — η διοργανώτρια κρίνει την επιτυχία.</div>
          </div>
        )}

        {isLockdown && (
          <div className="rounded-lg p-3 text-center space-y-2" style={{ background: '#000', border: '2px solid #FF003C' }}>
            <div className="text-xs opacity-70">Level: {{ init: 'Εκκίνηση', l1: '1 · Hostage', l2: '2 · Sensory Cipher', l3: '3 · Sabotage', exit: 'Exit Code', won: 'ΑΠΟΔΡΑΣΗ!', lost: 'ΑΠΟΤΥΧΙΑ' }[ld.stage || 'init']}</div>
            <div className="flex justify-center gap-2">
              {EXIT_CODE.split('').map((d, i) => (
                <div key={i} className="w-11 h-14 flex items-center justify-center font-display text-3xl rounded" style={{ border: `2px solid ${(ld.revealed || [])[i] ? '#FFD700' : '#FF003C'}`, color: '#FFD700' }}>{(ld.revealed || [])[i] ? d : '🔒'}</div>
              ))}
            </div>
          </div>
        )}

        {(act === 'board' || act === 'midnight' || act === 'morning') && (
          <div className="rounded-lg p-3 space-y-2" style={{ background: '#15151a' }}>
            <div className="flex justify-between"><b>🪙 Tokens</b><b className="font-display text-xl">{tokens}</b></div>
            <div className="text-xs opacity-70">Πύλη: {Math.min(tokens, GATE_TOKENS)}/{GATE_TOKENS}{(mg.immune || []).includes(me.id) ? ' · 🛡️ έχεις ασυλία' : ''}</div>
            {hand.length > 0 && (
              <div className="text-xs">🃏 Chaos Cards (κρυφές): {hand.map((id) => CHAOS_POWERS.find((x) => x.id === id)?.name).join(', ')} — πες στη διοργανώτρια πότε θες να παίξεις.</div>
            )}
            {mg.card && mg.card.playerId === me.id && <div className="rounded bg-fuchsia-950/70 p-2 text-sm"><b>{mg.card.title}</b><div>{mg.card.text}</div></div>}
            {mg.branch === me.id && <div className="rounded bg-yellow-900/60 p-2 text-sm">🔀 Σε διακλάδωση! Διάλεξε Glam ή Chaos Route στο tablet.</div>}
            {(mg.pos || {})[me.id] != null && <div className="text-xs opacity-60">Θέση ταμπλό: #{(mg.pos || {})[me.id] || 0}</div>}
          </div>
        )}

        {act === 'beach' && (
          <div className="rounded-lg p-3 space-y-2" style={{ background: '#15151a' }}>
            <div className="text-sm">🩴 Σαγιονάρες: {(bb.flops || {})[me.id] === false ? 'έχασες! 😱' : 'ΟΚ'} · 🥃 {(bb.drinks || {})[me.id] || 0}</div>
            {bb.freeze && <div className="rounded p-2 text-center font-heading" style={{ background: '#2a0010', border: '2px solid #FF3366' }}>📯 {bb.freeze.cmd}</div>}
            {bb.wheel && bb.wheel.pid === me.id && <div className="rounded p-2 text-sm" style={{ background: '#1a0010', border: '2px solid #FF3366' }}><b>{bb.wheel.card.title}</b><div>{bb.wheel.card.text}</div></div>}
            {bb.truth && bb.truth.who === me.id && <div className="text-sm text-center opacity-80">🥃 Σειρά σου στο Shot & Truth — Truth ή Drink!</div>}
            {bb.queen === me.id && <div className="text-center font-display text-2xl" style={{ color: '#FFD700' }}>👑 Beach Queen!</div>}
          </div>
        )}

        <div className="rounded-lg p-3" style={{ background: '#15151a' }}>
          <div className="font-heading text-sm mb-1">Βαθμολογία</div>
          {ranking.map((p) => (
            <div key={p.id} className="flex justify-between text-sm"><span className={p.id === me.id ? 'font-bold' : ''}>{p.name}</span><b>{((mg.scores || {})[p.id] || 0) + ((mg.tokens || {})[p.id] || 0)}</b></div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={askNotif} className="py-2 rounded-lg text-xs border border-border bg-secondary">🔔 Ειδοποιήσεις αποστολών</button>
          <button onClick={onChangePlayer} className="py-2 rounded-lg text-xs border border-border bg-secondary">🔄 Αλλαγή παίκτριας</button>
        </div>
      </div>

      <button onClick={panic} className="fixed bottom-3 left-3 right-3 z-40 py-4 rounded-xl font-heading text-xl bg-destructive text-destructive-foreground" style={{ maxWidth: 448, margin: '0 auto' }}>
        ⏹ ΣΤΟΠ — δεν είμαι καλά / λύστε με
      </button>

      {alert && mission && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5" style={{ background: 'rgba(30,0,40,.95)' }}>
          <div className="max-w-sm w-full rounded-2xl p-5 text-center space-y-3" style={{ border: '2px solid #d946ef', background: '#12001a' }}>
            <div className="text-4xl">🕵️</div>
            <div className="font-display text-2xl text-fuchsia-200">ΜΥΣΤΙΚΗ ΑΠΟΣΤΟΛΗ</div>
            <div className="font-heading text-lg">{mission.title}</div>
            <p className="text-sm">{mission.text}</p>
            <button onClick={() => setAlert(false)} className="w-full py-3 rounded-lg font-heading bg-fuchsia-700">Το κατάλαβα — κρύψε την οθόνη</button>
          </div>
        </div>
      )}
    </div>
  );
}
