import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Panel, Btn, RestraintNote } from '@/components/modes/ModeShell';
import LockdownMiniGames from '@/components/modes/LockdownMiniGames';
import { VIP_VAULT } from '@/data/modes/extendedContent';
import {
  LOCKDOWN_SECONDS, EXIT_CODE, WRONG_ANSWER_PENALTY, SURGE_BELOW, SURGE_BONUS, LOCKDOWN_MESSAGE,
  BINDING_OPTIONS, HOSTAGE_QUESTIONS, HOSTAGE_NEEDED, CONFESSION_LOCK, SPICY_WHEEL,
  WHEEL_DECISION_SECONDS, WHEEL_PENALTY_SECONDS, FOOT_ID, WHISPER_CLUES, SOCK_HEIST_SECONDS,
} from '@/data/modes/lockdownContent';
import { pick, shuffle, sfx, whisper, timerStart, timerAdd, timerLeft, useTick, useLocalCountdown } from '@/lib/modeKit';

const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const RED = '#FF003C';

// Act 3 — Pajama Lockdown (18+ Escape Room)
export default function ActLockdown({ ctx, onDone, standalone }) {
  const { players, mg, setMg, log, nameOf } = ctx;
  const ld = mg.ld || { stage: 'init' };
  const setLd = (p) => setMg((cur) => ({ ld: { ...(cur.ld || { stage: 'init' }), ...p } }));
  const [tray, setTray] = useState(null); // 'mini' | 'wheel'
  const [vaultCard, setVaultCard] = useState(null);
  const live = ['l1', 'l2', 'l3', 'exit'].includes(ld.stage);
  useTick(live, 500);

  // Λήξη χρόνου + Midnight Penalty Surge (μόνο από το tablet).
  const mgRef = useRef(mg);
  mgRef.current = mg;
  useEffect(() => {
    if (!live) return undefined;
    const i = setInterval(() => {
      const cur = mgRef.current;
      const l = cur.ld || {};
      if (!cur.timer?.endsAt || cur.stop) return;
      const left = timerLeft(cur.timer);
      if (left <= 0) {
        sfx.alarm();
        setMg({ ld: { ...l, stage: 'lost' } });
        return;
      }
      if (left < SURGE_BELOW && !l.surge) {
        sfx.alarm();
        sfx.buzz(600);
        setMg({ timer: timerAdd(cur.timer, SURGE_BONUS), ld: { ...l, surge: true, surgeAt: Date.now() } });
      }
    }, 500);
    return () => clearInterval(i);
  }, [live]);

  // Ποινή = αφαιρείται χρόνος από το αντίστροφο ρολόι (π.χ. λάθος απάντηση: −2′).
  function penalty(secs, why) {
    if (!secs) return;
    setMg((cur) => ({ timer: timerAdd(cur.timer, -secs) }));
    log(`⏱ −${Math.round(secs / 60 * 10) / 10}′ στον χρόνο${why?.name ? ` (${why.name})` : ''}`);
  }

  function start() {
    sfx.alarm();
    setMg({ timer: timerStart(LOCKDOWN_SECONDS), ld: { ...ld, stage: 'l1', revealed: [false, false, false, false], correct: 0, wrong: 0, qOrder: shuffle(HOSTAGE_QUESTIONS.map((_, i) => i)), qi: 0 } });
    log('🚨 THE PAJAMA LOCKDOWN HAS BEGUN — 60′');
  }

  const revealed = ld.revealed || [false, false, false, false];
  const reveal = (i) => setLd({ revealed: revealed.map((v, k) => (k === i ? true : v)) });
  const hostageIdx = (mg.hostageIdx || 0) % Math.max(1, players.length);
  const hostage = players[ld.hostageIdx ?? hostageIdx];

  if (ld.stage === 'init') {
    return <Init onStart={start} />;
  }

  if (ld.stage === 'won') {
    return (
      <div className="space-y-3">
        <Panel title="👑 THE FINAL ESCAPE — VIP VAULT UNLOCKED" accent="#FFD700">
          <p className="font-body">Ο Exit Code ({EXIT_CODE}) λύθηκε πριν μηδενιστεί το ρολόι. Το Lockdown ξεκλειδώθηκε!</p>
          {vaultCard && <div className="rounded bg-amber-950/60 border border-amber-500 p-3 font-body text-lg">{vaultCard}</div>}
          <div className="flex flex-wrap gap-2">
            <Btn color="bg-amber-600 text-black" onClick={() => setVaultCard(pick(VIP_VAULT))}>🎴 Κάρτα VIP Vault</Btn>
            <Btn color="bg-emerald-700" onClick={() => onDone?.('won')}>{standalone ? '🏆 Τίτλοι & τέλος' : 'Επόμενη φάση →'}</Btn>
          </div>
        </Panel>
      </div>
    );
  }

  if (ld.stage === 'lost') {
    return <Lost onDone={() => onDone?.('lost')} standalone={standalone} />;
  }

  return (
    <div className="space-y-3">
      {ld.surge && !ld.surgeDone && <Surge onDone={() => setLd({ surgeDone: true })} />}

      <div className="rounded-lg p-3 text-center font-body text-sm" style={{ border: `1px solid ${RED}`, background: '#1a0006', color: '#ffb3c1' }}>
        {LOCKDOWN_MESSAGE}
      </div>

      <DigitBar revealed={revealed} />

      {ld.stage === 'l1' && <Level1 ctx={ctx} ld={ld} setLd={setLd} hostage={hostage} penalty={penalty} onPass={() => { reveal(0); setLd({ stage: 'l2' }); log('🔓 Level 1 ολοκληρώθηκε — 1ο ψηφίο'); sfx.ok(); }} />}
      {ld.stage === 'l2' && <Level2 ld={ld} setLd={setLd} hostage={hostage} revealed={revealed} reveal={reveal} log={log} />}
      {ld.stage === 'l3' && <SockHeist onResult={(ok) => {
        if (ok) { setLd({ stage: 'exit' }); log('🧦 Midnight Sock Heist επιτυχές'); sfx.ok(); }
        else { penalty(60, { name: 'αποτυχία Sock Heist' }); sfx.fail(); }
      }} />}
      {ld.stage === 'exit' && <Exit onSolved={() => {
        setLd({ stage: 'won' });
        log('🎆 EXIT CODE σωστός — ΞΕΚΛΕΙΔΩΘΗΚΕ!');
        sfx.ok();
        confetti({ particleCount: 220, spread: 120, origin: { y: 0.55 }, colors: ['#FF003C', '#FF2A85', '#FFD700', '#00F2FE'] });
      }} />}

      <Panel title="⚙️ Chaos Mechanics" accent={RED}>
        <div className="flex flex-wrap gap-2">
          <Btn color="bg-red-900" onClick={() => setTray(tray === 'wheel' ? null : 'wheel')}>🎡 Spicy Truth Wheel</Btn>
          <Btn color="bg-red-900" onClick={() => setTray(tray === 'mini' ? null : 'mini')}>🎮 Mini-games</Btn>
          {ld.stage === 'l2' && revealed.slice(1).every(Boolean) && <Btn color="bg-amber-700" onClick={() => setLd({ stage: 'l3' })}>🧦 Level 3 →</Btn>}
          <Btn onClick={() => setMg((cur) => ({ timer: timerAdd(cur.timer, 60) }))}>+1′ (host)</Btn>
        </div>
        <div className="text-xs opacity-70 space-y-1">
          <div>🔗 <b>Blindfold Chain</b>: η Hostage ({hostage?.name}) είναι τυφλή και δεμένη· οι άλλες την καθοδηγούν αγγίζοντας πέλματα μόνο με κάλτσες ή δάχτυλα για να βρει τις σωστές επιλογές στην οθόνη.</div>
          <div>🔄 <b>Rotation</b>: η θέση της Hostage αλλάζει κυκλικά σε κάθε act.</div>
        </div>
      </Panel>

      {tray === 'wheel' && <SpicyWheel onClose={() => setTray(null)} log={log} />}
      {tray === 'mini' && <LockdownMiniGames onPenalty={penalty} onWheel={() => setTray('wheel')} onClose={() => setTray(null)} />}

      <div className="text-center"><Btn color="bg-secondary" onClick={() => { if (window.confirm('Να τελειώσει το Lockdown;')) setLd({ stage: 'lost' }); }}>🏳️ Παράδοση (Lockdown)</Btn></div>
    </div>
  );
}

function Init({ onStart }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    sfx.alarm();
    const i = setInterval(() => sfx.alarm(), 9000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="rounded-xl p-6 text-center space-y-5" style={{ background: '#000', border: `2px solid ${RED}`, boxShadow: `0 0 40px ${RED}66` }}>
      <div className="font-display text-4xl sm:text-6xl comic-pulse" style={{ color: RED, textShadow: `0 0 20px ${RED}` }}>LOCKDOWN</div>
      <p className="font-body text-base sm:text-xl max-w-xl mx-auto" style={{ color: '#ffb3c1' }}>{LOCKDOWN_MESSAGE}</p>
      <div className="max-w-sm mx-auto space-y-1">
        <input
          type="range" min="0" max="100" value={v}
          onChange={(e) => { const n = Number(e.target.value); setV(n); if (n >= 98) onStart(); }}
          onPointerUp={() => setV(0)}
          className="w-full" style={{ accentColor: RED }}
        />
        <div className="text-xs opacity-70">Σύρε μέχρι το τέλος για να ξεκινήσει το Lockdown (60′)</div>
      </div>
    </div>
  );
}

function DigitBar({ revealed }) {
  return (
    <div className="flex justify-center gap-3">
      {EXIT_CODE.split('').map((d, i) => (
        <div key={i} className="w-14 h-16 rounded-lg flex items-center justify-center font-display text-4xl"
          style={{ background: '#000', border: `2px solid ${revealed[i] ? '#FFD700' : RED}`, color: revealed[i] ? '#FFD700' : '#5a0012' }}>
          {revealed[i] ? d : '🔒'}
        </div>
      ))}
    </div>
  );
}

function Level1({ ctx, ld, setLd, hostage, penalty, onPass }) {
  const { players, log } = ctx;
  const qi = ld.qi || 0;
  const order = ld.qOrder || HOSTAGE_QUESTIONS.map((_, i) => i);
  const q = HOSTAGE_QUESTIONS[order[qi % order.length]];
  const [binding, setBinding] = useState(0);
  function answer(ok) {
    if (ok) {
      const c = (ld.correct || 0) + 1;
      sfx.ok();
      if (c >= HOSTAGE_NEEDED) { onPass(); return; }
      setLd({ correct: c, qi: qi + 1 });
    } else {
      sfx.fail();
      sfx.buzz(300);
      penalty(WRONG_ANSWER_PENALTY, { name: 'λάθος απάντηση' });
      setLd({ wrong: (ld.wrong || 0) + 1, qi: qi + 1 });
    }
  }
  return (
    <Panel title="⛓️ Level 1 · The Hostage Sacrifice" accent={RED}>
      <p className="text-sm opacity-80">Ο πρώτος κωδικός είναι κλειδωμένος. Η ομάδα επιλέγει μία «Hostage»· οι υπόλοιπες απαντούν στις ερωτήσεις ενώ κάνουν ασταμάτητο γαργάλημα στα πέλματά της. Κάθε λάθος = +2′ ποινή στο ρολόι.</p>
      <div className="flex flex-wrap gap-2 items-center text-sm">
        Hostage:
        <select value={ld.hostageIdx ?? ''} onChange={(e) => setLd({ hostageIdx: Number(e.target.value) })} className="px-2 py-1.5 rounded bg-background border border-border">
          <option value="">{hostage?.name} (σειρά)</option>
          {players.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
        </select>
        <select value={binding} onChange={(e) => setBinding(Number(e.target.value))} className="px-2 py-1.5 rounded bg-background border border-border max-w-full">
          {BINDING_OPTIONS.map((b, i) => <option key={i} value={i}>{b}</option>)}
        </select>
      </div>
      <RestraintNote />
      <div className="rounded p-3 text-lg font-body" style={{ background: '#1a0006', border: `1px solid ${RED}` }}>{q}</div>
      <div className="flex flex-wrap gap-2 items-center">
        <Btn color="bg-emerald-700" onClick={() => answer(true)}>✅ Σωστά</Btn>
        <Btn color="bg-red-800" onClick={() => answer(false)}>❌ Λάθος (+2′)</Btn>
        <span className="text-sm opacity-75">Σωστά {ld.correct || 0}/{HOSTAGE_NEEDED} · λάθη {ld.wrong || 0}</span>
      </div>
    </Panel>
  );
}

function Level2({ ld, setLd, hostage, revealed, reveal, log }) {
  return (
    <div className="space-y-3">
      <div className="font-heading text-lg" style={{ color: RED }}>🔥 Level 2 · The 18+ Sensory Cipher — λύστε τις 3 δοκιμασίες</div>
      <FootId done={revealed[1]} hostage={hostage} onDone={() => { reveal(1); log('🙈 Blind Foot ID λύθηκε — 2ο ψηφίο'); sfx.ok(); }} />
      <ConfessionLock done={revealed[2]} onDone={(w) => { reveal(2); log(`🤫 Confession Lock: λέξη-κλειδί «${w}» — 3ο ψηφίο`); sfx.ok(); }} />
      <WhisperClue done={revealed[3]} onDone={() => { reveal(3); log('🎧 Audio Whisper Clue λύθηκε — 4ο ψηφίο'); sfx.ok(); }} />
    </div>
  );
}

function FootId({ done, hostage, onDone }) {
  const [tex, setTex] = useState(null);
  const [show, setShow] = useState(false);
  const [guess, setGuess] = useState('');
  const [wrong, setWrong] = useState(false);
  return (
    <Panel title={`🙈 Blind Foot ID ${done ? '✓' : ''}`} accent={RED}>
      <p className="text-sm opacity-80">Η {hostage?.name} (μάσκα ύπνου) δέχεται υφή στα πέλματα και πληκτρολογεί το ψηφίο που αντιστοιχεί στη σωστή υφή.</p>
      {!done && (!tex ? <Btn color="bg-red-900" onClick={() => { setTex(pick(FOOT_ID)); setShow(false); setGuess(''); }}>🎴 Νέα υφή</Btn> : (
        <div className="space-y-2">
          <div className="rounded p-2 bg-black/60 text-sm">
            {show ? <><b>{tex.name}</b> — {tex.text} <span className="opacity-60">(ψηφίο {tex.digit})</span></> : '🔒 Κρυφή υφή — μόνο για τις εφαρμόζουσες'}
            <button className="ml-2 underline text-xs" onClick={() => setShow(!show)}>{show ? 'κρύψε' : '👁 δες'}</button>
          </div>
          <div className="flex gap-2 items-center">
            <input value={guess} maxLength={1} inputMode="numeric" onChange={(e) => setGuess(e.target.value)}
              className={`w-16 text-center text-3xl rounded bg-black border-2 ${wrong ? 'border-red-500' : 'border-red-800'}`} placeholder="#" />
            <Btn color="bg-red-800" onClick={() => {
              if (guess === tex.digit) onDone(); else { setWrong(true); sfx.fail(); setTimeout(() => setWrong(false), 700); }
            }}>ΕΛΕΓΧΟΣ</Btn>
            <Btn onClick={() => setTex(null)}>Άλλη υφή</Btn>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function ConfessionLock({ done, onDone }) {
  const [q, setQ] = useState(null);
  const [word, setWord] = useState('');
  return (
    <Panel title={`🤫 The Secret Confession Lock ${done ? '✓' : ''}`} accent={RED}>
      {!done && (!q ? <Btn color="bg-red-900" onClick={() => setQ(pick(CONFESSION_LOCK))}>🎴 Τράβηξε ερώτηση 18+</Btn> : (
        <div className="space-y-2">
          <div className="rounded p-2 bg-black/60 font-body text-lg">{q}</div>
          <p className="text-xs opacity-70">Συσκεφθείτε και συμφωνήστε ΟΜΟΦΩΝΑ σε μία κοινή λέξη-κλειδί.</p>
          <div className="flex gap-2">
            <input value={word} onChange={(e) => setWord(e.target.value)} className="flex-1 px-2 py-1.5 rounded bg-black border border-red-800" placeholder="Κοινή λέξη-κλειδί" />
            <Btn color="bg-red-800" disabled={!word.trim()} onClick={() => onDone(word.trim())}>Ομόφωνα ✓</Btn>
          </div>
        </div>
      ))}
    </Panel>
  );
}

function WhisperClue({ done, onDone }) {
  const [clue, setClue] = useState(() => pick(WHISPER_CLUES));
  const [guess, setGuess] = useState('');
  const [wrong, setWrong] = useState(false);
  return (
    <Panel title={`🎧 The Audio Whisper Clue ${done ? '✓' : ''}`} accent={RED}>
      {!done && (
        <div className="space-y-2">
          <p className="text-sm opacity-80">Το κινητό παίζει παραμορφωμένο ψίθυρο (ASMR 18+). Βρείτε τη λέξη-κλειδί.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Btn color="bg-red-900" onClick={() => whisper(clue.say)}>▶ Παίξε ψίθυρο</Btn>
            <input value={guess} onChange={(e) => setGuess(e.target.value)} className={`px-2 py-1.5 rounded bg-black border ${wrong ? 'border-red-500' : 'border-red-800'}`} placeholder="Λέξη-κλειδί" />
            <Btn color="bg-red-800" onClick={() => {
              if (norm(guess) === norm(clue.keyword)) onDone(); else { setWrong(true); sfx.fail(); setTimeout(() => setWrong(false), 700); }
            }}>ΕΛΕΓΧΟΣ</Btn>
            <Btn onClick={() => setGuess(clue.keyword)}>💡 Hint</Btn>
            <Btn onClick={() => setClue(pick(WHISPER_CLUES))}>Άλλο clip</Btn>
          </div>
        </div>
      )}
    </Panel>
  );
}

function SockHeist({ onResult }) {
  const [run, setRun] = useState(false);
  const left = useLocalCountdown(SOCK_HEIST_SECONDS, run, () => { sfx.alarm(); setRun(false); });
  return (
    <Panel title="🧦 Level 3 · The Sabotage Override — Midnight Sock Heist" accent={RED}>
      <p className="text-sm opacity-80">Όλες φοράτε παράταιρες/τρύπιες/αστείες κάλτσες. 2 λεπτά αστραπιαίας μάχης κλοπής καλτσών στο δωμάτιο, χωρίς καμία να χάσει την ισορροπία της ή να πέσει κάτω.</p>
      <div className="text-center font-display text-5xl" style={{ color: left <= 15 && run ? RED : undefined }}>{Math.ceil(run ? left : SOCK_HEIST_SECONDS)}″</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {!run && <Btn color="bg-red-800" onClick={() => setRun(true)}>▶ ΞΕΚΙΝΑ ΤΟ HEIST</Btn>}
        <Btn color="bg-emerald-700" onClick={() => onResult(true)}>✅ Επιτυχία</Btn>
        <Btn color="bg-red-900" onClick={() => onResult(false)}>❌ Έπεσε κάποια / χάθηκε ο χρόνος</Btn>
      </div>
    </Panel>
  );
}

function SyncConfirm({ onOk }) {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  const [secs, setSecs] = useState(0);
  const both = useRef(false);
  both.current = a && b;
  useEffect(() => {
    let s = 0;
    const i = setInterval(() => {
      s = both.current ? s + 0.1 : 0;
      setSecs(s);
      if (s >= 3) { clearInterval(i); onOk(); }
    }, 100);
    return () => clearInterval(i);
  }, []);
  const pad = (on, set, label) => (
    <div
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); set(true); }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      className={`flex-1 h-24 rounded-xl flex items-center justify-center text-sm text-center px-2 select-none ${on ? 'bg-red-600' : 'bg-red-950 border border-red-500'}`}
      style={{ touchAction: 'none' }}
    >{label}</div>
  );
  return (
    <div className="space-y-2">
      <div className="text-xs opacity-80">🔗 The Sync Code: μία (με δεμένα/περιορισμένα χέρια) αγγίζει το pad με τη μύτη της παντόφλας, η άλλη το δεύτερο — ταυτόχρονα για 3″.</div>
      <div className="flex gap-2">{pad(a, setA, '🩴 Μύτη παντόφλας')}{pad(b, setB, '✋ Επιβεβαίωση')}</div>
      <div className="h-2 bg-white/10 rounded overflow-hidden"><i className="block h-full bg-red-500" style={{ width: `${(secs / 3) * 100}%` }} /></div>
    </div>
  );
}

function Exit({ onSolved }) {
  const [code, setCode] = useState('');
  const [synced, setSynced] = useState(false);
  const [wrong, setWrong] = useState(false);
  function press(d) { if (code.length < 4) { sfx.click(); setCode(code + d); } }
  function submit() {
    if (code === EXIT_CODE) onSolved();
    else { setWrong(true); sfx.fail(); sfx.buzz(400); setCode(''); setTimeout(() => setWrong(false), 700); }
  }
  return (
    <Panel title="🔢 The Exit Code" accent="#FFD700">
      <div className={`text-center font-display text-5xl tracking-[0.4em] ${wrong ? 'text-red-500' : ''}`}>{code.padEnd(4, '•')}</div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✔'].map((k) => (
          <button
            key={k}
            onClick={() => (k === '⌫' ? setCode(code.slice(0, -1)) : k === '✔' ? (synced && code.length === 4 && submit()) : press(k))}
            className="comic-boom bg-red-950 py-3 text-2xl disabled:opacity-40"
            disabled={k === '✔' && !(synced && code.length === 4)}
          >{k}</button>
        ))}
      </div>
      {!synced ? <SyncConfirm onOk={() => { setSynced(true); sfx.ok(); }} /> : <div className="text-center text-emerald-300 text-sm">🔗 Sync επιβεβαιώθηκε — πάτα ✔</div>}
    </Panel>
  );
}

function SpicyWheel({ onClose, log }) {
  const [q, setQ] = useState(null);
  const [spin, setSpin] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | decide | penalty
  const decide = useLocalCountdown(WHEEL_DECISION_SECONDS, phase === 'decide', () => { setPhase('penalty'); sfx.alarm(); log('🎡 Spicy Truth Wheel: ποινή 30″ δέσιμο & γαργάλημα'); });
  const pen = useLocalCountdown(WHEEL_PENALTY_SECONDS, phase === 'penalty', () => { sfx.alarm(); });

  function go() {
    setSpin(true);
    setPhase('idle');
    let n = 0;
    const i = setInterval(() => {
      setQ(pick(SPICY_WHEEL));
      sfx.click();
      n += 1;
      if (n > 14) { clearInterval(i); setSpin(false); setPhase('decide'); }
    }, 110);
  }
  return (
    <Panel title="🎡 The Spicy Truth Wheel" accent={phase === 'penalty' ? '#ff0000' : RED}>
      <div className={`rounded p-3 min-h-[5rem] font-body text-lg ${phase === 'penalty' ? 'bg-red-900/80' : 'bg-black/60'}`}>{q || 'Γύρνα τον τροχό για να εμφανιστεί η ερώτηση.'}</div>
      {phase === 'decide' && (
        <div className="flex items-center gap-3">
          <b className="font-display text-3xl">{Math.ceil(decide)}″</b>
          <Btn color="bg-emerald-700" onClick={() => { setPhase('idle'); sfx.ok(); }}>✅ Απάντησε</Btn>
          <Btn color="bg-red-800" onClick={() => { setPhase('penalty'); sfx.alarm(); log('🎡 Spicy Truth Wheel: άρνηση — ποινή 30″'); }}>🙅 Αρνήθηκε</Btn>
        </div>
      )}
      {phase === 'penalty' && (
        <div className="space-y-2">
          <RestraintNote />
          <div className="font-display text-4xl text-red-300">{Math.ceil(pen)}″ δέσιμο & γαργάλημα στα πέλματα</div>
          <Btn onClick={() => setPhase('idle')}>Τέλος ποινής</Btn>
        </div>
      )}
      <div className="flex gap-2"><Btn color="bg-red-800" disabled={spin} onClick={go}>🎡 ΓΥΡΝΑ</Btn><Btn onClick={onClose}>Κλείσιμο</Btn></div>
    </Panel>
  );
}

function Surge({ onDone }) {
  const left = useLocalCountdown(60, true, () => { sfx.alarm(); });
  return (
    <div className="fixed inset-0 z-[55] flex flex-col items-center justify-center gap-4 p-6 text-center animate-pulse" style={{ background: 'rgba(160,0,30,.94)' }}>
      <div className="font-display text-4xl sm:text-6xl text-white">MIDNIGHT PENALTY SURGE</div>
      <div className="text-lg text-white font-body max-w-xl">Το ρολόι έπεσε κάτω από 10′ και οι γρίφοι είναι ανοιχτοί! Άμεσο ομαδικό δέσιμο και 60″ ασταμάτητο ομαδικό γαργάλημα σε όλες. Παίρνετε +5′ στο ρολόι.</div>
      <RestraintNote />
      <div className="font-display text-7xl text-white tabular-nums">{Math.ceil(left)}″</div>
      <Btn color="bg-white text-black" onClick={onDone}>Ολοκληρώθηκε — συνεχίστε</Btn>
    </div>
  );
}

function Lost({ onDone, standalone }) {
  const [run, setRun] = useState(false);
  const left = useLocalCountdown(60, run, () => { sfx.alarm(); setRun(false); });
  return (
    <Panel title="💀 LOCKDOWN FAILED — The Ultimate Tickle Penalty" accent={RED}>
      <p className="font-body">Ο χρόνος μηδενίστηκε. Η ομάδα δέχεται την απόλυτη ποινή γαργαλητού.</p>
      <RestraintNote />
      <div className="font-display text-5xl text-center text-red-300">{Math.ceil(run ? left : 60)}″</div>
      <div className="flex flex-wrap gap-2 justify-center">
        <Btn color="bg-red-800" onClick={() => setRun(true)}>▶ Ξεκίνα την ποινή (60″)</Btn>
        <Btn color="bg-emerald-700" onClick={onDone}>{standalone ? '🏁 Τέλος' : 'Επόμενη φάση →'}</Btn>
      </div>
    </Panel>
  );
}
