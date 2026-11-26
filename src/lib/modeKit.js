import { useCallback, useEffect, useRef, useState } from 'react';
import { stopAllSounds } from '@/data/soundLibrary';
import { timerStart, timerLeft, timerAdd, timerPause, timerResume } from '@/lib/modeTimer';
import { applyDelta, undoLast } from '@/lib/modeUndo';
import { randomExitCode } from '@/lib/consent';
import { withCustomSounds } from '@/lib/gameSounds';
import { applyOutputToContext } from '@/lib/avDevices';

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const result = [...(arr || [])];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const uid = () => Math.random().toString(36).slice(2, 8);

let gameStopActive = false;
const gameStopListeners = new Set();

export const isGameStopActive = () => gameStopActive;

export function setGameStopActive(active) {
  gameStopActive = !!active;
  if (gameStopActive) {
    stopAllSounds();
    audioCtx?.suspend().catch(() => {});
    try { window.speechSynthesis?.cancel(); } catch { /* δεν υποστηρίζεται */ }
    try { navigator.vibrate?.(0); } catch { /* δεν υποστηρίζεται */ }
  } else if (audioCtx?.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  gameStopListeners.forEach((listener) => listener(gameStopActive));
}

export function fmt(sec) {
  const s = Math.max(0, Math.ceil(sec || 0));
  // Πάνω από 1 ώρα (π.χ. Villa 48h): ώρες:λεπτά:δευτερόλεπτα.
  if (s >= 3600) return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- Συγχρονισμένο χρονόμετρο: βλ. modeTimer.js (καθαρές συναρτήσεις) ----------
export { timerStart, timerLeft, timerAdd, timerPause, timerResume };

export function useGameStopState() {
  const [paused, setPaused] = useState(gameStopActive);
  useEffect(() => {
    const listener = (value) => setPaused(value);
    gameStopListeners.add(listener);
    return () => gameStopListeners.delete(listener);
  }, []);
  return paused;
}

export function useTick(active = true, ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let id = null;
    const start = () => { if (id === null) id = setInterval(() => set((n) => n + 1), ms); };
    const stop = () => { if (id !== null) { clearInterval(id); id = null; } };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop();
      else { set((n) => n + 1); start(); }
    };
    if (document.visibilityState !== 'hidden') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [active, ms]);
}

// Τοπικό αντίστροφο για μικρές δοκιμασίες (π.χ. 30″ ποινή) — δεν γράφεται στη βάση.
export function useLocalCountdown(seconds, running, onDone) {
  const [left, setLeft] = useState(seconds);
  const [paused, setPaused] = useState(gameStopActive);
  const remainingRef = useRef(seconds);
  const doneRef = useRef(onDone);
  const completedRef = useRef(false);
  doneRef.current = onDone;

  useEffect(() => {
    const listener = (value) => setPaused(value);
    gameStopListeners.add(listener);
    return () => gameStopListeners.delete(listener);
  }, []);

  useEffect(() => {
    remainingRef.current = seconds;
    completedRef.current = false;
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) {
      completedRef.current = false;
      return undefined;
    }
    remainingRef.current = seconds;
    completedRef.current = false;
    setLeft(seconds);
    return undefined;
  }, [running, seconds]);

  useEffect(() => {
    if (!running || paused || completedRef.current) return undefined;
    let last = Date.now();
    const i = setInterval(() => {
      const now = Date.now();
      remainingRef.current = Math.max(0, remainingRef.current - (now - last) / 1000);
      last = now;
      setLeft(remainingRef.current);
      if (remainingRef.current <= 0 && !completedRef.current) {
        completedRef.current = true;
        clearInterval(i);
        doneRef.current?.();
      }
    }, 100);
    return () => clearInterval(i);
  }, [running, paused, seconds]);

  return left;
}

// ---------- Ήχοι (WebAudio, χωρίς αρχεία) ----------
let audioCtx = null;
export function unlockModeAudio() {
  try { ac(); } catch { /* χωρίς WebAudio */ }
}
function ac() {
  if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); applyOutputToContext(audioCtx); }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}
function tone(freq, dur, type = 'sine', vol = 0.15, when = 0) {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t = c.currentTime + when;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch { /* ο browser μπλόκαρε τον ήχο */ }
}
function sweep(from, to, dur, type = 'sine', vol = 0.15, when = 0) {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    const t = c.currentTime + when;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch { /* ο browser μπλόκαρε τον ήχο */ }
}
const chord = (notes, dur, type, vol, when = 0) => notes.forEach((f) => tone(f, dur, type, vol, when));

// Τηλεοπτικά stingers για την TV: σύντομα, χωρίς αρχεία, ελάχιστη CPU.
export const tvSfx = withCustomSounds('tv', {
  dice() { [0, 0.07, 0.14, 0.21, 0.3].forEach((w, i) => tone(1200 + i * 140, 0.04, 'square', 0.05, w)); tone(523, 0.25, 'triangle', 0.14, 0.42); },
  loot() { tone(1318, 0.09, 'triangle', 0.13, 0.5); tone(1760, 0.22, 'triangle', 0.13, 0.6); },
  card() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.28, 'triangle', 0.09, i * 0.07)); },
  market() { sweep(220, 110, 0.6, 'sawtooth', 0.08); chord([220, 262, 311], 0.5, 'triangle', 0.06, 0.15); },
  arrest() { [0, 0.45, 0.9].forEach((w) => { sweep(700, 1100, 0.22, 'square', 0.06, w); sweep(1100, 700, 0.22, 'square', 0.06, w + 0.22); }); tone(70, 0.6, 'sine', 0.3); },
  truth() { chord([523, 659, 784], 0.5, 'triangle', 0.09); chord([659, 784, 1047], 0.8, 'triangle', 0.09, 0.35); },
  lie() { chord([392, 466], 0.4, 'sawtooth', 0.07); chord([311, 370], 0.9, 'sawtooth', 0.07, 0.35); tone(60, 0.7, 'sine', 0.25, 0.35); },
  alert() { [0, 0.3, 0.6].forEach((w) => tone(880, 0.18, 'square', 0.07, w)); },
  tickle() { [0, 0.12, 0.24, 0.36].forEach((w, i) => tone(1400 + (i % 2) * 300, 0.08, 'sine', 0.07, w)); },
  finale() { [0, 0.25, 0.5, 0.75, 1, 1.15, 1.3, 1.45].forEach((w) => tone(90, 0.12, 'sine', 0.25, w)); chord([392, 494, 587], 1.2, 'triangle', 0.08, 1.6); },
  winner() { chord([523, 659, 784], 0.3, 'triangle', 0.1); chord([587, 740, 880], 0.3, 'triangle', 0.1, 0.25); chord([659, 831, 988, 1319], 1.1, 'triangle', 0.1, 0.5); },
  crown() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.11, i * 0.16)); chord([523, 659, 784, 1047], 1.6, 'triangle', 0.09, 0.7); },
  round() { tone(440, 0.15, 'triangle', 0.1); tone(660, 0.3, 'triangle', 0.1, 0.15); },
  golden() { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.5, 'sine', 0.08, i * 0.09)); sweep(400, 1600, 0.8, 'triangle', 0.05, 0.1); },
  confess() { tone(330, 0.9, 'sine', 0.12); tone(415, 0.9, 'sine', 0.08, 0.3); },
  weather() { [523, 659, 784, 659].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, i * 0.18)); },
  dossier() { tone(196, 0.5, 'sawtooth', 0.06); tone(233, 0.5, 'sawtooth', 0.06, 0.5); tone(185, 0.9, 'sawtooth', 0.06, 1); },
  news() { [0, 0.12, 0.24].forEach((w) => tone(1568, 0.08, 'square', 0.05, w)); tone(784, 0.4, 'triangle', 0.1, 0.4); },
  drama() { tone(55, 2.2, 'sine', 0.3); sweep(110, 220, 2, 'sawtooth', 0.04); tone(880, 0.6, 'sine', 0.05, 1.8); },
});

export const sfx = withCustomSounds('sfx', {
  alarm() { [0, 0.4, 0.8, 1.2].forEach((w, i) => tone(i % 2 ? 440 : 660, 0.34, 'sawtooth', 0.12, w)); },
  horn() { tone(180, 0.9, 'sawtooth', 0.2); tone(185, 0.9, 'square', 0.1); },
  click(high) { tone(high ? 2600 : 1500, 0.03, 'square', high ? 0.14 : 0.06); },
  ok() { tone(660, 0.12, 'triangle', 0.16); tone(880, 0.22, 'triangle', 0.16, 0.12); },
  fail() { tone(220, 0.4, 'sawtooth', 0.16); },
  buzz(ms = 200) { try { navigator.vibrate?.(ms); } catch { /* δεν υποστηρίζεται */ } },
});

// Beat για το «DJ player»: kick + hi-hat, ρυθμός ρυθμιζόμενος.
export function startBeat(bpm = 110) {
  let step = 0;
  const ms = (60 / bpm / 2) * 1000;
  const i = setInterval(() => {
    if (step % 4 === 0) { tone(120, 0.18, 'sine', 0.35); tone(60, 0.22, 'sine', 0.3); }
    if (step % 2 === 1) tone(5000, 0.04, 'square', 0.03);
    if (step % 8 === 6) tone(300, 0.08, 'triangle', 0.1);
    step += 1;
  }, ms);
  return () => clearInterval(i);
}

// Παραμορφωμένος «ψίθυρος» για τα ASMR clues (speech synthesis του browser).
export function whisper(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.pitch = 0.4;
    u.rate = 0.65;
    u.volume = 0.35;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* χωρίς υποστήριξη ομιλίας */ }
}

// ---------- Context παιχνιδιού: όλα ζουν στο state.mg ----------
export function useModeCtx(state, updateState) {
  const players = state.players || [];
  const mg = state.mg || {};
  const mgRef = useRef(mg);
  mgRef.current = mg;

  const setMg = useCallback((patch) => {
    const next = { ...mgRef.current, ...(typeof patch === 'function' ? patch(mgRef.current) : patch) };
    mgRef.current = next;
    return updateState({ mg: next });
  }, [updateState]);

  const log = useCallback((text) => {
    const prev = mgRef.current.log || [];
    return setMg({ log: [{ t: Date.now(), text }, ...prev].slice(0, 40) });
  }, [setMg]);

  const addTokens = useCallback((id, n) => setMg((cur) => applyDelta(cur, 'tokens', id, n)), [setMg]);

  const addScore = useCallback((id, n) => setMg((cur) => applyDelta(cur, 'scores', id, n)), [setMg]);

  // Αναίρεση της τελευταίας αλλαγής tokens/score (για λάθος πάτημα της διοργανώτριας).
  const undo = useCallback(() => {
    const result = undoLast(mgRef.current);
    if (!result) return null;
    setMg(result.patch);
    return result.entry;
  }, [setMg]);

  const centralStopped = !!state.stopActive;
  const stopped = !!mg.stop || centralStopped;
  const pauseRef = useRef({ active: false, at: null, timerWasRunning: false });

  // Ένα ενιαίο pause lifecycle: το χρονόμετρο και οι προθεσμίες αποστολών
  // παγώνουν μία φορά, ανεξάρτητα από το αν το STOP ήρθε από Tablet ή Mobile.
  useEffect(() => {
    if (stopped && !pauseRef.current.active) {
      const at = Date.now();
      const current = mgRef.current;
      pauseRef.current = { active: true, at, timerWasRunning: !!current.timer?.endsAt };
      if (current.timer?.endsAt) setMg({ timer: timerPause(current.timer), pauseAt: at });
      return;
    }

    if (!stopped && pauseRef.current.active) {
      const pausedFor = Math.max(0, Date.now() - (pauseRef.current.at || Date.now()));
      const current = mgRef.current;
      const missions = { ...(current.missions || {}) };
      Object.keys(missions).forEach((id) => {
        if (missions[id]?.status === 'active' && missions[id].expiresAt) {
          missions[id] = { ...missions[id], expiresAt: missions[id].expiresAt + pausedFor };
        }
      });
      const next = {
        ...current,
        timer: pauseRef.current.timerWasRunning ? timerResume(current.timer) : current.timer,
        missions,
        pauseAt: null,
        ...(current.startedAt ? { startedAt: current.startedAt + pausedFor } : {}),
        ...(current.actStartedAt ? { actStartedAt: current.actStartedAt + pausedFor } : {}),
        ...(current.morningTimer ? { morningTimer: current.morningTimer + pausedFor } : {}),
      };
      mgRef.current = next;
      updateState({ mg: next });
      pauseRef.current = { active: false, at: null, timerWasRunning: false };
    }
  }, [stopped, setMg, updateState]);

  const toggleStop = useCallback(() => {
    if (centralStopped) return;
    const cur = mgRef.current;
    if (cur.stop) {
      const pausedFor = Math.max(0, Date.now() - (cur.stopAt || Date.now()));
      setMg({ stop: false, stopBy: null });
      updateState({
        gamePausedMs: (state.gamePausedMs || 0) + (state.gamePausedAt ? Date.now() - state.gamePausedAt : pausedFor),
        gamePausedAt: null,
      });
    } else {
      const stopAt = Date.now();
      setMg({ stop: true, stopAt });
      updateState({ gamePausedAt: state.gamePausedAt || stopAt });
    }
  }, [setMg, centralStopped, updateState, state.gamePausedMs, state.gamePausedAt]);

  const nameOf = useCallback((id) => players.find((p) => p.id === id)?.name || '—', [players]);

  return { players, mg, setMg, log, addTokens, addScore, undo, toggleStop, nameOf, centralStopped, stopped: !!mg.stop || centralStopped };
}

export function initialMg(modeId, extra = {}) {
  const base = {
    modeId,
    phase: 'play',
    actIndex: 0,
    stop: false,
    tokens: {},
    scores: {},
    log: [],
    missions: {},
    alcoholFree: !!extra.alcoholFree,
    startedAt: Date.now(),
  };
  // Ψηφιακά modes: consent check-in πριν ξεκινήσει το παιχνίδι + τυχαίος Exit Code ανά συνεδρία.
  if (['pedi_glam', 'pedi_extended', 'lockdown', 'marathon_4h', 'villa_takeover'].includes(modeId) || String(modeId || '').startsWith('custom_')) base.consentRequired = true;
  if (modeId === 'lockdown') base.exitCode = extra.exitCode || randomExitCode();
  // Νέες παρτίδες: εισαγωγή με κανόνες σε Tablet/TV/κινητά πριν την πρώτη φάση.
  if (['lockdown', 'marathon_4h', 'villa_takeover'].includes(modeId)) base.briefingRequired = true;
  return base;
}

// Αν είναι ενεργό το alcoholFree, τα «σφηνάκια» γίνονται χυμό-σφηνάκια.
export const drinkText = (text, alcoholFree) => (alcoholFree ? String(text).replace(/σφηνάκια?/gi, 'χυμό-σφηνάκι') : text);
