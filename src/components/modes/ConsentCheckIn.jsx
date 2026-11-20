import React, { useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { CONSENT_OPTIONS, consentOf, allConfirmed } from '@/lib/consent';
import { timerStart } from '@/lib/modeTimer';

const entryFor = (optOuts, confirmed = true) => ({ optOuts, confirmed, at: Date.now() });

// ---------- Tablet (διοργανώτρια): ξεκινά το παιχνίδι μόνο όταν όλες έχουν επιβεβαιώσει ----------
export function ConsentTablet({ ctx, updateState, minutes }) {
  const { players, mg, setMg, log } = ctx;
  const [open, setOpen] = useState(null);
  const ready = allConfirmed(mg, players);
  const confirmedCount = players.filter((p) => consentOf(mg, p.id).confirmed).length;

  const save = (pid, optOuts) => setMg((cur) => ({
    consent: { ...(cur.consent || {}), players: { ...(cur.consent?.players || {}), [pid]: entryFor(optOuts) } },
  }));
  const toggle = (pid, optionId) => {
    const current = consentOf(mg, pid).optOuts;
    save(pid, current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]);
  };

  function start() {
    if (!ready && !window.confirm(`Λείπουν επιβεβαιώσεις (${confirmedCount}/${players.length}). Να ξεκινήσει το παιχνίδι ΧΩΡΙΣ αυτές; Οι παίκτριες που δεν επιβεβαίωσαν θεωρούνται χωρίς δηλωμένα όρια — ρώτα τες προφορικά.`)) return;
    const now = Date.now();
    setMg({
      consent: { ...(mg.consent || {}), done: true, startedAt: now },
      startedAt: now,
      ...(minutes ? { timer: timerStart(minutes * 60), timerModeId: ctx.mg.modeId } : {}),
    });
    updateState?.({ gameStartedAt: now, gamePausedMs: 0, gamePausedAt: null });
    log('✅ Consent check-in ολοκληρώθηκε — ξεκινά το παιχνίδι');
  }

  return (
    <Panel title="🤝 Consent check-in" accent="#E8C26B">
      <p className="text-sm opacity-80">
        Κάθε παίκτρια ανοίγει το κινητό της και δηλώνει τα όριά της. Η εφαρμογή αποφεύγει αυτόματα κάρτες που τα παραβιάζουν.
        Δεν χρειάζεται εξήγηση — και το ΣΤΟΠ / PASS ισχύει πάντα, οποιαδήποτε στιγμή.
      </p>
      <div className="space-y-2">
        {players.map((p) => {
          const c = consentOf(mg, p.id);
          return (
            <div key={p.id} className="rounded-lg bg-background/50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <b className="flex-1 min-w-[8rem]">{p.name}</b>
                <span className="text-sm" style={{ color: c.confirmed ? '#E8C26B' : '#FF453A' }}>{c.confirmed ? '✓ επιβεβαίωσε' : '⏳ αναμονή'}</span>
                <span className="text-xs opacity-70">{c.optOuts.length ? `${c.optOuts.length} όρια` : 'χωρίς όρια'}</span>
                <button type="button" className="comic-boom px-3 py-1.5 text-xs" onClick={() => setOpen(open === p.id ? null : p.id)}>
                  {open === p.id ? 'Κλείσιμο' : 'Επεξεργασία'}
                </button>
              </div>
              {open === p.id && (
                <div className="mt-2 space-y-1.5">
                  {CONSENT_OPTIONS.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={c.optOuts.includes(option.id)} onChange={() => toggle(p.id, option.id)} />
                      {option.label}
                    </label>
                  ))}
                  {!c.confirmed && <Btn color="bg-emerald-700" onClick={() => save(p.id, c.optOuts)}>✓ Επιβεβαίωση για {p.name}</Btn>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center space-y-1">
        <Btn color={ready ? 'bg-emerald-700' : 'bg-amber-700'} onClick={start}>▶ Έναρξη παιχνιδιού ({confirmedCount}/{players.length})</Btn>
        {!ready && <div className="text-xs opacity-60">Πρέπει να επιβεβαιώσουν όλες· ή ξεκίνα με δική σου ευθύνη μετά από ερώτηση.</div>}
      </div>
    </Panel>
  );
}

// ---------- Κινητό παίκτριας ----------
export function ConsentMobile({ mg, me, updateState }) {
  const mine = consentOf(mg, me.id);
  const [selected, setSelected] = useState(mine.optOuts);
  const [editing, setEditing] = useState(!mine.confirmed);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await updateState({ mg: { consent: { players: { [me.id]: entryFor(selected) } } } });
      setEditing(false);
    } finally { setBusy(false); }
  }
  const toggle = (id) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: '#0B0A06', border: '1px solid rgba(232,194,107,.5)' }}>
      <div className="font-display text-xl" style={{ color: '#F7E3A8' }}>🤝 Πριν ξεκινήσουμε</div>
      {editing ? (
        <>
          <p className="text-sm opacity-85">Διάλεξε ό,τι <b>δεν</b> θέλεις να σου τύχει. Δεν το βλέπει η υπόλοιπη παρέα και δεν χρειάζεται να εξηγήσεις.</p>
          <div className="space-y-2">
            {CONSENT_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-center gap-3 rounded-lg p-3 text-sm" style={{ background: selected.includes(option.id) ? 'rgba(232,194,107,.16)' : 'rgba(255,255,255,.05)', border: '1px solid rgba(232,194,107,.3)' }}>
                <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} className="w-5 h-5" />
                {option.label}
              </label>
            ))}
          </div>
          <div className="text-xs opacity-70">Μπορείς να πεις ΣΤΟΠ ή PASS οποιαδήποτε στιγμή, χωρίς να δικαιολογηθείς.</div>
          <button type="button" disabled={busy} onClick={confirm} className="w-full rounded-full p-3 font-heading text-black disabled:opacity-50" style={{ background: 'linear-gradient(180deg,#F9E7B2,#E8C26B 55%,#C99B2E)' }}>
            {busy ? 'Αποθήκευση…' : '✓ ΕΠΙΒΕΒΑΙΩΣΗ'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm">✓ Καταχωρήθηκε{mine.optOuts.length ? ` (${mine.optOuts.length} όρια)` : ' (χωρίς όρια)'}. Περίμενε να ξεκινήσει η διοργανώτρια το παιχνίδι.</p>
          <button type="button" onClick={() => setEditing(true)} className="w-full rounded-full border p-2.5 text-sm" style={{ borderColor: 'rgba(232,194,107,.5)' }}>Αλλαγή επιλογών</button>
        </>
      )}
    </div>
  );
}

// ---------- TV: κανόνες + κατάσταση (ΠΟΤΕ δεν δείχνει τα όρια κάθε παίκτριας) ----------
const RULES = [
  { icon: '🎮', title: 'Πώς παίζεται', text: 'Το tablet της διοργανώτριας οδηγεί το παιχνίδι. Στο κινητό σου βλέπεις μόνο ό,τι αφορά εσένα.' },
  { icon: '🤝', title: 'Τα όριά σου μετράνε', text: 'Δήλωσε στο κινητό τι δεν θέλεις. Η εφαρμογή αποφεύγει αυτές τις κάρτες. Δεν χρειάζεται εξήγηση.' },
  { icon: '⏹', title: 'ΣΤΟΠ & PASS', text: 'Οποιαδήποτε στιγμή μπορείς να πεις ΣΤΟΠ ή PASS. Όλα σταματούν και ελέγχουμε ότι είναι όλες καλά.' },
  { icon: '🍹', title: 'Αλκοόλ προαιρετικό', text: 'Τα ποτά είναι πάντα προαιρετικά και υπάρχει μη αλκοολούχα επιλογή.' },
];

export function ConsentTV({ state }) {
  const mg = state.mg || {};
  const players = state.players || [];
  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6 text-white">
      <div className="text-center">
        <div className="text-xs tracking-[.4em]" style={{ color: '#E8C26B' }}>DEAL OF TEMPTATION</div>
        <div className="font-display text-5xl sm:text-7xl mt-2" style={{ color: '#F7E3A8' }}>Πρώτα η ασφάλεια</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {RULES.map((rule) => (
          <div key={rule.title} className="rounded-2xl p-6" style={{ background: 'rgba(232,194,107,.07)', border: '1px solid rgba(232,194,107,.4)' }}>
            <div className="text-4xl">{rule.icon}</div>
            <div className="font-heading text-2xl mt-2" style={{ color: '#F7E3A8' }}>{rule.title}</div>
            <p className="text-lg opacity-85 mt-1">{rule.text}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {players.map((p) => {
          const ok = consentOf(mg, p.id).confirmed;
          return (
            <span key={p.id} className="rounded-full px-5 py-2 text-lg font-heading" style={{ background: ok ? 'rgba(232,194,107,.18)' : 'rgba(255,255,255,.06)', border: `1px solid ${ok ? '#E8C26B' : 'rgba(255,255,255,.25)'}`, color: ok ? '#F7E3A8' : '#bbb' }}>
              {ok ? '✓' : '⏳'} {p.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
