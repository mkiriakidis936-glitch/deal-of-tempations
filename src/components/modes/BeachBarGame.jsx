import React, { useEffect, useRef, useState } from 'react';
import { Panel, Btn, RestraintNote } from '@/components/modes/ModeShell';
import MissionPanel from '@/components/modes/MissionPanel';
import {
  FREEZE_COMMANDS, WHEEL_CATEGORIES, BEACH_WHEEL, FLIPFLOP_MISSIONS, SHOT_TRUTH,
  BEACH_STEP_SECONDS, BEACH_FINALE_SECONDS, BEACH_PHASES,
} from '@/data/modes/beachBarContent';
import { pick, sfx, startBeat, drinkText, useLocalCountdown } from '@/lib/modeKit';

const TURQ = '#00F2FE';
const CORAL = '#FF3366';

export default function BeachBarGame({ ctx, onEnd }) {
  const { players, mg, setMg, log, nameOf } = ctx;
  const bb = mg.bb || { phase: 'checkin' };
  const setBb = (p) => setMg((cur) => ({ bb: { ...(cur.bb || { phase: 'checkin' }), ...p } }));
  const T = (s) => drinkText(s, mg.alcoholFree);
  const flopOn = (id) => (bb.flops || {})[id] !== false;
  const drinks = bb.drinks || {};
  const addDrink = (id, n = 1) => setBb({ drinks: { ...drinks, [id]: (drinks[id] || 0) + n } });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BEACH_PHASES.map((p) => (
          <button
            key={p.id}
            onClick={() => setBb({ phase: p.id })}
            className="comic-boom px-3 py-2 font-heading text-sm"
            style={{ background: bb.phase === p.id ? TURQ : '#1a1a22', color: bb.phase === p.id ? '#000' : '#fff' }}
          >{p.label}</button>
        ))}
      </div>

      <Panel>
        <div className="flex flex-wrap gap-3 text-sm">
          {players.map((p) => (
            <div key={p.id} className="rounded px-2 py-1 bg-background/50 flex items-center gap-2">
              <b>{p.name}</b>
              <button onClick={() => setBb({ flops: { ...(bb.flops || {}), [p.id]: !flopOn(p.id) } })} className={flopOn(p.id) ? '' : 'opacity-30'} title="σαγιονάρες">🩴</button>
              <span>🥃{drinks[p.id] || 0}</span>
              <span>⭐{(mg.scores || {})[p.id] || 0}</span>
              {(mg.immune || []).includes(p.id) && <span title="ασυλία">🛡️</span>}
            </div>
          ))}
        </div>
      </Panel>

      {bb.phase === 'checkin' && <CheckIn ctx={ctx} bb={bb} setBb={setBb} onStart={() => { setBb({ phase: 'dance', flops: Object.fromEntries(players.map((p) => [p.id, true])) }); log('🍹 Το Beach Bar άνοιξε!'); }} />}
      {bb.phase === 'dance' && <Dance ctx={ctx} bb={bb} setBb={setBb} T={T} addDrink={addDrink} flopOn={flopOn} />}
      {bb.phase === 'wheel' && <Wheel ctx={ctx} bb={bb} setBb={setBb} T={T} flopOn={flopOn} />}
      {bb.phase === 'truth' && <Truth ctx={ctx} bb={bb} setBb={setBb} T={T} addDrink={addDrink} />}
      {bb.phase === 'finale' && <Finale ctx={ctx} bb={bb} setBb={setBb} flopOn={flopOn} onEnd={onEnd} />}

      <MissionPanel
        ctx={ctx}
        pool={FLIPFLOP_MISSIONS}
        title="📲 Flip-Flop Heist (κρυφές αποστολές στο κινητό)"
        onSuccess={(m, pid) => {
          if (m.reward === 'immunity') setMg((cur) => ({ immune: [...(cur.immune || []), pid] }));
          ctx.addScore(pid, 1);
        }}
      />
    </div>
  );
}

function CheckIn({ ctx, bb, setBb, onStart }) {
  const { players, mg, setMg } = ctx;
  const checked = bb.checkin || {};
  const all = players.length > 0 && players.every((p) => checked[p.id]);
  return (
    <Panel title="🩴 Digital Check-in" accent={TURQ}>
      <p className="text-sm opacity-80">Όλες φοράτε αποκλειστικά σαγιονάρες και άνετα ρούχα. Η καθεμία επιβεβαιώνει το check-in (ή πατάς εσύ εδώ).</p>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <Btn key={p.id} color={checked[p.id] ? 'bg-emerald-700' : 'bg-secondary'} onClick={() => setBb({ checkin: { ...checked, [p.id]: !checked[p.id] } })}>
            {checked[p.id] ? '✅' : '⬜'} {p.name}
          </Btn>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!mg.alcoholFree} onChange={(e) => setMg({ alcoholFree: e.target.checked })} />
        Χωρίς αλκοόλ: τα «σφηνάκια» γίνονται χυμό-σφηνάκια
      </label>
      <Btn color="bg-cyan-500 text-black" className="!text-lg !px-8 !py-3" disabled={!all} onClick={onStart}>
        🎶 CHECK-IN ΟΛΕΣ — ΞΕΚΙΝΑ ΤΗ ΜΟΥΣΙΚΗ
      </Btn>
      {!all && <button className="text-xs underline" onClick={onStart}>Συνέχεια χωρίς πλήρες check-in</button>}
    </Panel>
  );
}

function Dance({ ctx, bb, setBb, T, addDrink, flopOn }) {
  const { players, log, nameOf, stopped } = ctx;
  const stopRef = useRef(null);
  const [bpm, setBpm] = useState(110);
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (stopped) {
      stopRef.current?.();
      stopRef.current = null;
    } else if (playing && !stopRef.current) {
      stopRef.current = startBeat(bpm);
    }
  }, [stopped, playing, bpm]);
  useEffect(() => () => stopRef.current?.(), []);

  function music(on) {
    stopRef.current?.();
    stopRef.current = null;
    if (on) stopRef.current = startBeat(bpm);
    setPlaying(on);
    setBb({ music: on });
  }
  function freeze() {
    music(false);
    sfx.horn();
    sfx.buzz(500);
    const cmd = pick(FREEZE_COMMANDS);
    setBb({ freeze: { cmd, at: Date.now() } });
    log(`📯 FREEZE! ${cmd}`);
  }
  function loser(p) {
    addDrink(p.id);
    setBb({ phase: 'wheel', loser: p.id, freeze: null });
    log(`🥃 ${p.name} έχασε στο Freeze — σφηνάκι και Τροχός Ποινών`);
  }

  return (
    <Panel title="🎶 The Dance & Freeze Arena" accent={TURQ}>
      <div className="flex flex-wrap items-center gap-2">
        <Btn color={playing ? 'bg-red-800' : 'bg-cyan-500 text-black'} onClick={() => music(!playing)}>{playing ? '⏹ Σταμάτα μουσική' : '▶ Beat (DJ player)'}</Btn>
        <label className="text-xs flex items-center gap-1">BPM
          <input type="range" min="85" max="135" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />{bpm}
        </label>
        <Btn color="bg-orange-600" onClick={freeze}>📯 FREEZE!</Btn>
      </div>
      <div className="flex gap-2 items-center text-xs">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Playlist link (Spotify / YouTube)…" className="flex-1 px-2 py-1.5 rounded bg-background border border-border" />
        <Btn className="!py-1.5" onClick={() => url && window.open(/^https?:/.test(url) ? url : `https://${url}`, '_blank', 'noopener')}>Άνοιγμα</Btn>
      </div>

      {bb.freeze && (
        <div className="rounded-lg p-4 text-center space-y-3" style={{ background: '#2a0010', border: `2px solid ${CORAL}` }}>
          <div className="font-display text-3xl comic-pulse" style={{ color: CORAL }}>📯 ΕΝΤΟΛΗ!</div>
          <div className="font-body text-xl">{bb.freeze.cmd}</div>
          <div className="text-sm opacity-75">Ποια ήταν τελευταία;</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {players.map((p) => <Btn key={p.id} color="bg-red-800" onClick={() => loser(p)}>{p.name}</Btn>)}
          </div>
          <Btn onClick={() => setBb({ freeze: null })}>Ακύρωση</Btn>
        </div>
      )}
      <div className="text-xs opacity-70">Η καθυστερημένη πίνει σφηνάκι και περνά αυτόματα στον Τροχό Ποινών. {T('')}</div>
    </Panel>
  );
}

function Wheel({ ctx, bb, setBb, T, flopOn }) {
  const { players, log, nameOf } = ctx;
  const [who, setWho] = useState(bb.loser || players[0]?.id || '');
  const [spinning, setSpinning] = useState(false);
  const [cat, setCat] = useState(null);
  const card = bb.wheel?.card;
  const [run, setRun] = useState(false);
  const left = useLocalCountdown(card?.secs || 0, run, () => { sfx.alarm(); setRun(false); });

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setRun(false);
    let n = 0;
    const i = setInterval(() => {
      setCat(pick(WHEEL_CATEGORIES).id);
      sfx.click();
      n += 1;
      if (n > 16) {
        clearInterval(i);
        const c = pick(BEACH_WHEEL);
        setCat(c.cat);
        setSpinning(false);
        setBb({ wheel: { card: c, pid: who, at: Date.now() }, loser: null });
        log(`🎡 ${nameOf(who)}: «${c.title}»`);
        sfx.ok();
        if (c.loseFlop) setBb({ flops: { ...(bb.flops || {}), [who]: false } });
      }
    }, 110);
  }

  const meta = WHEEL_CATEGORIES.find((c) => c.id === (card ? card.cat : cat));
  return (
    <Panel title="🎡 The Tie, Hogtie & Tickle Wheel" accent={CORAL}>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={who} onChange={(e) => setWho(e.target.value)} className="px-2 py-2 rounded bg-background border border-border">
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Btn color="bg-rose-600" disabled={spinning} onClick={spin}>🎡 ΓΥΡΝΑ ΤΟΝ ΤΡΟΧΟ</Btn>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {WHEEL_CATEGORIES.map((c) => (
          <span key={c.id} className="px-2 py-1 rounded" style={{ background: `${c.color}${meta?.id === c.id ? '66' : '22'}`, border: `1px solid ${c.color}` }}>{c.icon} {c.name}</span>
        ))}
      </div>
      {card && !spinning && (
        <div className="rounded-lg p-4 space-y-2" style={{ background: '#1a0010', border: `2px solid ${meta?.color || CORAL}` }}>
          <div className="text-xs opacity-70">{nameOf(bb.wheel.pid)} · {meta?.icon} {meta?.name}</div>
          <div className="font-heading text-2xl">{card.title}</div>
          <p className="font-body text-lg">{T(card.text)}</p>
          {card.restraint && <RestraintNote />}
          <div className="flex flex-wrap gap-2 items-center">
            {card.secs ? <Btn color="bg-sky-700" onClick={() => setRun(true)} disabled={run}>⏱ {Math.ceil(run ? left : card.secs)}″</Btn> : null}
            <Btn color="bg-emerald-700" onClick={() => { setBb({ wheel: null, phase: 'dance' }); setRun(false); }}>Έγινε → χορός</Btn>
            <Btn onClick={() => { setBb({ wheel: null }); setRun(false); }}>Νέα περιστροφή</Btn>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Truth({ ctx, bb, setBb, T, addDrink }) {
  const { players, log, nameOf } = ctx;
  const [who, setWho] = useState(players[0]?.id || '');
  const [q, setQ] = useState(null);
  const [state, setState] = useState('idle'); // idle | decide | tickle
  const left = useLocalCountdown(BEACH_STEP_SECONDS, state === 'decide', () => { setState('tickle'); sfx.alarm(); log(`🚨 ${nameOf(who)} άργησε — συναγερμός ομαδικού γαργαλητού`); });
  const tk = useLocalCountdown(20, state === 'tickle', () => sfx.alarm());

  return (
    <Panel title="🥃 Shot & Truth Sync" accent={CORAL}>
      <p className="text-sm opacity-80">Απαντάς ειλικρινά Ή πίνεις διπλό σφηνάκι. Αν αρνηθείς και τα δύο (ή αργήσεις πάνω από 5″), συναγερμός ομαδικού γαργαλητού στη χαμένη.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={who} onChange={(e) => setWho(e.target.value)} className="px-2 py-2 rounded bg-background border border-border">
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Btn color="bg-rose-600" onClick={() => { setQ(pick(SHOT_TRUTH)); setState('decide'); setBb({ truth: { who, at: Date.now() } }); }}>🎴 Νέα ερώτηση 18+</Btn>
      </div>
      {q && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: '#1a0010', border: `2px solid ${CORAL}` }}>
          <div className="text-xs opacity-70">{nameOf(who)}</div>
          <div className="font-body text-xl">{q}</div>
          {state === 'decide' && (
            <div className="flex flex-wrap gap-2 items-center">
              <b className="font-display text-4xl w-16">{Math.ceil(left)}″</b>
              <Btn color="bg-emerald-700" onClick={() => { setState('idle'); setQ(null); sfx.ok(); log(`🗣️ ${nameOf(who)} είπε αλήθεια`); }}>🗣️ TRUTH</Btn>
              <Btn color="bg-orange-600" onClick={() => { addDrink(who, 2); setState('idle'); setQ(null); log(`🥃 ${nameOf(who)} ήπιε διπλό σφηνάκι`); }}>🥃 DRINK (διπλό)</Btn>
            </div>
          )}
          {state === 'tickle' && (
            <div className="space-y-2">
              <div className="font-display text-4xl text-red-300 comic-pulse">🚨 ΣΥΝΑΓΕΡΜΟΣ ΓΑΡΓΑΛΗΤΟΥ — {Math.ceil(tk)}″</div>
              <Btn onClick={() => { setState('idle'); setQ(null); }}>Τέλος</Btn>
            </div>
          )}
        </div>
      )}
      <div className="text-xs opacity-60">{T('Ο διπλός σφηνάκι μετράει στον μετρητή 🥃.')}</div>
    </Panel>
  );
}

function Finale({ ctx, bb, setBb, flopOn, onEnd }) {
  const { players, log, nameOf, addScore } = ctx;
  const finalists = players.filter((p) => !flopOn(p.id));
  const field = finalists.length >= 2 ? finalists : players;
  const [run, setRun] = useState(false);
  const left = useLocalCountdown(BEACH_FINALE_SECONDS, run, () => { sfx.horn(); setRun(false); });
  const queen = bb.queen;
  return (
    <Panel title="👑 The Last Queen Standing" accent="#FFD700">
      <p className="text-sm opacity-80">Όσες έχουν χάσει τις σαγιονάρες τους (κλοπές ή ποινές) μπαίνουν στον τελικό γύρο: 3λεπτο χορευτικό challenge με δεμένους καρπούς. Όποια κρατήσει τον ρυθμό και δεν γελάσει στις παγίδες γαργαλητού γίνεται Beach Queen και διαλέγει την τελική ομαδική δοκιμασία.</p>
      <div className="flex flex-wrap gap-2 text-sm">
        Φιναλίστ: {field.map((p) => <b key={p.id} className="px-2 py-0.5 rounded bg-background/60">{p.name}</b>)}
        {finalists.length < 2 && <span className="opacity-60">(λιγότερες από 2 χωρίς σαγιονάρες — παίζουν όλες)</span>}
      </div>
      <RestraintNote />
      <div className="font-display text-5xl text-center">{Math.ceil(run ? left : BEACH_FINALE_SECONDS)}″</div>
      <div className="flex flex-wrap gap-2 justify-center">
        <Btn color="bg-cyan-500 text-black" onClick={() => { setRun(true); sfx.horn(); }}>▶ Ξεκίνα τον τελικό (3′)</Btn>
      </div>
      {!queen ? (
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-sm">Στέψε:</span>
          {field.map((p) => (
            <Btn key={p.id} color="bg-amber-600 text-black" onClick={() => { setBb({ queen: p.id }); addScore(p.id, 10); log(`👑 ${p.name} είναι η Beach Queen!`); sfx.ok(); }}>{p.name}</Btn>
          ))}
        </div>
      ) : (
        <div className="rounded-lg p-4 text-center space-y-2" style={{ background: '#2a2000', border: '2px solid #FFD700' }}>
          <div className="font-display text-4xl" style={{ color: '#FFD700' }}>👑 BEACH QUEEN: {nameOf(queen)}</div>
          <div className="font-body">Διαλέγει την τελική ομαδική δοκιμασία της βραδιάς!</div>
          <Btn color="bg-emerald-700" onClick={onEnd}>🏆 Τίτλοι & τέλος</Btn>
        </div>
      )}
    </Panel>
  );
}
