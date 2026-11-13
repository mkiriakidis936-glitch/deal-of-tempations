import React, { useEffect, useRef, useState } from 'react';
import DecibelMeter from '@/components/comic/DecibelMeter';
import { Btn, Panel } from '@/components/modes/ModeShell';
import { MINI_GAMES, TRUE_FALSE } from '@/data/modes/lockdownContent';
import { pick, shuffle, sfx, useLocalCountdown } from '@/lib/modeKit';

// Τα 10 ψηφιακά mini-games του Lockdown. Κάθε ένα καλεί onResult(true|false).

const WORDS = ['TICKLE', 'SATIN', 'VELVET', 'FEATHER', 'LOCKDOWN', 'PAJAMA'];
const LEET = { I: '!', E: '3', A: '4', O: '0', S: '5', L: '1' };

function glitch(word) {
  return word.split('').map((ch, i) => (i % 2 ? (LEET[ch] || ch.toLowerCase()) : ch)).join('-');
}

function GlitchCipher({ onResult }) {
  const [word] = useState(() => pick(WORDS));
  const [val, setVal] = useState('');
  const [run] = useState(true);
  const left = useLocalCountdown(45, run, () => onResult(false));
  return (
    <div className="space-y-2 text-center">
      <div className="font-display text-4xl tracking-widest text-red-400 comic-pulse">{glitch(word)}</div>
      <div className="text-sm opacity-70">Ποια λέξη κρύβεται; Σου μένουν {Math.ceil(left)}″</div>
      <input value={val} onChange={(e) => setVal(e.target.value)} className="px-3 py-2 rounded bg-black border border-red-500 text-center uppercase text-xl" autoFocus />
      <div><Btn color="bg-red-800" onClick={() => onResult(val.trim().toUpperCase() === word)}>ΕΛΕΓΧΟΣ</Btn></div>
    </div>
  );
}

function SwipeHold({ onResult }) {
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
      if (s >= 15) { clearInterval(i); onResult(true); }
    }, 100);
    return () => clearInterval(i);
  }, []);
  const pad = (on, set, label) => (
    <div
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); set(true); }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      className={`flex-1 h-40 rounded-xl flex items-center justify-center font-heading text-lg select-none ${on ? 'bg-red-600' : 'bg-red-950 border border-red-500'}`}
      style={{ touchAction: 'none' }}
    >{label}</div>
  );
  return (
    <div className="space-y-2">
      <div className="text-center font-heading">Hold Together — {secs.toFixed(1)}″ / 15″</div>
      <div className="h-3 rounded bg-white/10 overflow-hidden"><i className="block h-full bg-red-500" style={{ width: `${(secs / 15) * 100}%` }} /></div>
      <div className="flex gap-3">{pad(a, setA, 'ΠΑΤΗΣΤΕ (1η)')}{pad(b, setB, 'ΠΑΤΗΣΤΕ (2η)')}</div>
      <div className="text-xs opacity-60 text-center">Και τα δύο πατήματα μαζί, χωρίς διακοπή. Αν ξεφύγει ένα, ξαναρχίζει.</div>
      <div className="text-center"><Btn onClick={() => onResult(false)}>Παράτησα</Btn></div>
    </div>
  );
}

const ICONS = ['😴', '🧊', '🎀', '🧦', '🪶', '🕯️', '💅', '🩴', '🔑'];
function MemoryGrid({ onResult }) {
  const [seq] = useState(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * 9)));
  const [lit, setLit] = useState(-1);
  const [phase, setPhase] = useState('show');
  const [step, setStep] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < seq.length) { setLit(seq[i]); sfx.click(true); i += 1; }
      else { setLit(-1); setPhase('input'); clearInterval(t); }
    }, 800);
    return () => clearInterval(t);
  }, [seq]);
  function tap(c) {
    if (phase !== 'input') return;
    sfx.click();
    if (c !== seq[step]) { onResult(false); return; }
    if (step + 1 >= seq.length) onResult(true); else setStep(step + 1);
  }
  return (
    <div className="space-y-2">
      <div className="text-center text-sm opacity-70">{phase === 'show' ? 'Απομνημόνευσε τη σειρά…' : `Ξαναπάτα με τη σειρά (${step}/${seq.length})`}</div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {ICONS.map((ic, i) => (
          <button key={i} onClick={() => tap(i)} className={`aspect-square text-3xl rounded-lg ${lit === i ? 'bg-red-500 scale-105' : 'bg-red-950 border border-red-700'}`}>{ic}</button>
        ))}
      </div>
    </div>
  );
}

function TruthTap({ onResult }) {
  const [qs] = useState(() => shuffle(TRUE_FALSE));
  const [i, setI] = useState(0);
  const [ok, setOk] = useState(0);
  const left = useLocalCountdown(20, true, () => onResult(false));
  function answer(v) {
    if (v !== qs[i][1]) { onResult(false); return; }
    if (ok + 1 >= 5) { onResult(true); return; }
    setOk(ok + 1);
    setI(i + 1);
  }
  return (
    <div className="space-y-3 text-center">
      <div className="text-sm">⏱ {Math.ceil(left)}″ · σωστά {ok}/5</div>
      <div className="font-body text-xl min-h-[3.5rem]">{qs[i][0]}</div>
      <div className="flex gap-3 justify-center">
        <Btn color="bg-emerald-700" className="!px-8 !py-4" onClick={() => answer(true)}>TRUE</Btn>
        <Btn color="bg-red-800" className="!px-8 !py-4" onClick={() => answer(false)}>FALSE</Btn>
      </div>
    </div>
  );
}

function DecibelSilence({ onResult }) {
  const [run, setRun] = useState(false);
  const done = useRef(false);
  const finish = (ok) => { if (done.current) return; done.current = true; onResult(ok); };
  const left = useLocalCountdown(30, run, () => finish(true));
  return (
    <div className="space-y-2">
      <div className="text-center text-sm opacity-80">Max Decibels: 0 · πρώτα πάτα START στο μικρόφωνο, μετά ξεκίνα τα 30″.</div>
      <DecibelMeter label="SILENCE METER" threshold={0.12} onThreshold={() => { if (run) finish(false); }} />
      {!run ? <div className="text-center"><Btn color="bg-red-800" onClick={() => setRun(true)}>🤫 Ξεκίνα 30″ σιωπής</Btn></div>
        : <div className="text-center font-display text-4xl">{Math.ceil(left)}″</div>}
      <div className="text-center"><Btn onClick={() => finish(false)}>Κάποια γέλασε / μίλησε</Btn></div>
    </div>
  );
}

function Lockpick({ onResult }) {
  const [targets] = useState(() => Array.from({ length: 3 }, () => Math.floor(Math.random() * 24) * 15));
  const [pin, setPin] = useState(0);
  const [angle, setAngle] = useState(0);
  const dist = Math.min(Math.abs(angle - targets[pin]), 360 - Math.abs(angle - targets[pin]));
  function rotate(d) {
    const a = (angle + d + 360) % 360;
    setAngle(a);
    const dd = Math.min(Math.abs(a - targets[pin]), 360 - Math.abs(a - targets[pin]));
    sfx.click(dd <= 30);
  }
  function open() {
    if (dist <= 7) {
      sfx.ok();
      if (pin + 1 >= targets.length) onResult(true); else { setPin(pin + 1); }
    } else { sfx.fail(); onResult(false); }
  }
  return (
    <div className="space-y-3 text-center">
      <div className="text-sm opacity-80">Άκου τα «click»: ψηλότερος ήχος = κοντά. Pin {pin + 1}/{targets.length}</div>
      <div className="mx-auto w-36 h-36 rounded-full border-4 border-red-500 relative bg-black">
        <div className="absolute left-1/2 top-1/2 w-1 h-16 bg-red-400 origin-bottom" style={{ transform: `translate(-50%,-100%) rotate(${angle}deg)` }} />
      </div>
      <div className="flex gap-2 justify-center">
        <Btn onClick={() => rotate(-15)}>⟲ 15°</Btn>
        <Btn color="bg-red-800" onClick={open}>🔓 Δοκίμασε</Btn>
        <Btn onClick={() => rotate(15)}>⟳ 15°</Btn>
      </div>
    </div>
  );
}

const SOCK_FACES = ['🔴', '🟣', '🟢'];
function SockMatch({ onResult }) {
  const [cards] = useState(() => shuffle([...SOCK_FACES, ...SOCK_FACES].concat(['🟡', '🔵'])));
  const [sel, setSel] = useState([]);
  const [matched, setMatched] = useState([]);
  const left = useLocalCountdown(30, true, () => onResult(false));
  function tap(i) {
    if (matched.includes(i) || sel.includes(i)) return;
    const next = [...sel, i];
    if (next.length < 2) { setSel(next); return; }
    if (cards[next[0]] === cards[next[1]]) {
      const m = [...matched, ...next];
      setMatched(m);
      sfx.ok();
      if (m.length >= 4) onResult(true);
    } else sfx.fail();
    setSel([]);
  }
  return (
    <div className="space-y-2 text-center">
      <div className="text-sm">Βρες 2 ζευγάρια · ⏱ {Math.ceil(left)}″ · (παράλληλα μια από εσάς ψάχνει κάλτσες στα τυφλά!)</div>
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {cards.map((c, i) => (
          <button key={i} onClick={() => tap(i)} className="aspect-square rounded-lg bg-red-950 border border-red-700 text-3xl">
            {matched.includes(i) || sel.includes(i) ? `🧦${c}` : '❔'}
          </button>
        ))}
      </div>
    </div>
  );
}

function DangerSlider({ onResult }) {
  const [v, setV] = useState(3);
  const left = useLocalCountdown(5, true, () => onResult(v === 7));
  return (
    <div className="space-y-3 text-center">
      <div className="font-heading">Tickle Intensity Level: <b className="text-3xl">{v}</b> · ⏱ {Math.ceil(left)}″</div>
      <input type="range" min="1" max="10" value={v} onChange={(e) => setV(Number(e.target.value))} className="w-full" />
      <div className="text-sm opacity-70">Βάλ’ το ακριβώς στο 7.</div>
      <Btn color="bg-red-800" onClick={() => onResult(v === 7)}>ΚΛΕΙΔΩΜΑ</Btn>
    </div>
  );
}

function ShakeTest({ onResult }) {
  const [energy, setEnergy] = useState(0);
  const [started, setStarted] = useState(false);
  const [hasMotion, setHasMotion] = useState(false);
  const energyRef = useRef(0);
  const left = useLocalCountdown(10, started, () => onResult(energyRef.current >= 100));

  function bump(n) { energyRef.current = Math.min(100, energyRef.current + n); setEnergy(energyRef.current); }
  async function start() {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        await DeviceMotionEvent.requestPermission();
      }
    } catch { /* συνεχίζουμε με tap fallback */ }
    setStarted(true);
  }
  useEffect(() => {
    if (!started) return undefined;
    const h = (e) => {
      const a = e.accelerationIncludingGravity || {};
      const mag = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
      if (mag > 25) { setHasMotion(true); bump(2.5); }
    };
    window.addEventListener('devicemotion', h);
    return () => window.removeEventListener('devicemotion', h);
  }, [started]);

  return (
    <div className="space-y-3 text-center">
      <div className="font-heading text-xl">Shake to Override</div>
      <div className="h-4 rounded bg-white/10 overflow-hidden"><i className="block h-full bg-red-500" style={{ width: `${energy}%` }} /></div>
      {!started ? <Btn color="bg-red-800" onClick={start}>📳 Ξεκίνα (10″)</Btn> : (
        <>
          <div className="font-display text-4xl">{Math.ceil(left)}″</div>
          {!hasMotion && <Btn className="!px-8 !py-4" onClick={() => bump(5)}>👆 Πάτα γρήγορα (αν δεν έχεις αισθητήρα)</Btn>}
        </>
      )}
    </div>
  );
}

function FinalCipher({ onResult }) {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-3 text-center">
      <div className="font-display text-2xl leading-relaxed">🌸 + 🌸 = 10<br />🧦 + 🌸 = 8<br />🧦 × 🌸 = ?</div>
      <input inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value)} className="w-28 text-center text-2xl px-2 py-2 rounded bg-black border border-red-500" />
      <div><Btn color="bg-red-800" onClick={() => onResult(val.trim() === '15')}>ΕΛΕΓΧΟΣ</Btn></div>
    </div>
  );
}

const COMPONENTS = {
  glitch: GlitchCipher, hold: SwipeHold, memory: MemoryGrid, truth: TruthTap, decibel: DecibelSilence,
  lockpick: Lockpick, socks: SockMatch, slider: DangerSlider, shake: ShakeTest, cipher: FinalCipher,
};

// Launcher: διαλέγεις mini-game, παίζεται, και η ποινή εφαρμόζεται αυτόματα στο timer.
export default function LockdownMiniGames({ onPenalty, onWheel, onClose }) {
  const [game, setGame] = useState(null);
  const [result, setResult] = useState(null);
  const G = game ? COMPONENTS[game.id] : null;

  function done(ok) {
    setResult(ok);
    if (ok) { sfx.ok(); return; }
    sfx.fail();
    if (game.failSecs) onPenalty(game.failSecs, game);
    if (game.wheel) onWheel?.();
  }

  return (
    <Panel title="🎮 Digital Mini-Games" accent="#FF003C">
      {!game && (
        <div className="grid sm:grid-cols-2 gap-2">
          {MINI_GAMES.map((g) => (
            <button key={g.id} onClick={() => { setGame(g); setResult(null); }} className="comic-boom bg-red-950/70 text-left p-2">
              <div className="font-heading text-sm">{g.icon} {g.name}</div>
              <div className="text-xs opacity-75">{g.desc}</div>
            </button>
          ))}
          <Btn className="sm:col-span-2" color="bg-secondary" onClick={() => setGame(MINI_GAMES[Math.floor(Math.random() * MINI_GAMES.length)])}>🎲 Τυχαίο mini-game</Btn>
        </div>
      )}
      {game && result === null && (
        <div className="space-y-2">
          <div className="font-heading">{game.icon} {game.name}</div>
          <G key={game.id + (game._k || '')} onResult={done} />
        </div>
      )}
      {game && result !== null && (
        <div className="text-center space-y-2">
          <div className={`font-display text-3xl ${result ? 'text-emerald-400' : 'text-red-400'}`}>{result ? '✅ ΕΠΙΤΥΧΙΑ' : '❌ ΑΠΟΤΥΧΙΑ'}</div>
          {!result && game.fail && <div className="text-sm">{game.fail}</div>}
          <div className="flex gap-2 justify-center">
            <Btn onClick={() => { setGame(null); setResult(null); }}>Άλλο mini-game</Btn>
            <Btn onClick={onClose}>Κλείσιμο</Btn>
          </div>
        </div>
      )}
      {!game && <div className="text-center"><Btn onClick={onClose}>Κλείσιμο</Btn></div>}
    </Panel>
  );
}
