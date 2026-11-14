import { useCallback, useEffect, useRef, useState } from 'react';

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
export const uid = () => Math.random().toString(36).slice(2, 8);

let gameStopActive = false;
const gameStopListeners = new Set();

export const isGameStopActive = () => gameStopActive;

export function setGameStopActive(active) {
  gameStopActive = !!active;
  if (gameStopActive) {
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
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- Συγχρονισμένο χρονόμετρο (ίδιο σε tablet / TV / κινητά) ----------
export const timerStart = (seconds) => ({ total: seconds, endsAt: Date.now() + seconds * 1000, remaining: seconds });
export const timerLeft = (t) => (!t ? 0 : t.endsAt ? Math.max(0, (t.endsAt - Date.now()) / 1000) : Math.max(0, t.remaining || 0));
export const timerAdd = (t, sec) => {
  if (!t) return t;
  if (t.endsAt) return { ...t, endsAt: t.endsAt + sec * 1000, total: (t.total || 0) + sec };
  return { ...t, remaining: (t.remaining || 0) + sec, total: (t.total || 0) + sec };
};
export const timerPause = (t) => (t && t.endsAt ? { ...t, remaining: timerLeft(t), endsAt: null } : t);
export const timerResume = (t) => (t && !t.endsAt ? { ...t, endsAt: Date.now() + (t.remaining || 0) * 1000 } : t);

export function useGameStopState() {
  const [paused, setPaused] = useState(gameStopActive);
  useEffect(() => {
    const listener = (value) => setPaused(value);
    gameStopListeners.add(listener);
    return () => gameStopListeners.delete(listener);
  }, []);
  return paused;
}

export function useTick(active = true, ms = 250) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const i = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(i);
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
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
export const sfx = {
  alarm() { [0, 0.4, 0.8, 1.2].forEach((w, i) => tone(i % 2 ? 440 : 660, 0.34, 'sawtooth', 0.12, w)); },
  horn() { tone(180, 0.9, 'sawtooth', 0.2); tone(185, 0.9, 'square', 0.1); },
  click(high) { tone(high ? 2600 : 1500, 0.03, 'square', high ? 0.14 : 0.06); },
  ok() { tone(660, 0.12, 'triangle', 0.16); tone(880, 0.22, 'triangle', 0.16, 0.12); },
  fail() { tone(220, 0.4, 'sawtooth', 0.16); },
  buzz(ms = 200) { try { navigator.vibrate?.(ms); } catch { /* δεν υποστηρίζεται */ } },
};

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

  const addTokens = useCallback((id, n) => {
    const tokens = { ...(mgRef.current.tokens || {}) };
    tokens[id] = Math.max(0, (tokens[id] || 0) + n);
    return setMg({ tokens });
  }, [setMg]);

  const addScore = useCallback((id, n) => {
    const scores = { ...(mgRef.current.scores || {}) };
    scores[id] = (scores[id] || 0) + n;
    return setMg({ scores });
  }, [setMg]);

  const toggleStop = useCallback(() => {
    const cur = mgRef.current;
    if (cur.stop) {
      setMg({ stop: false, stopBy: null, timer: timerResume(cur.timer) });
    } else {
      setMg({ stop: true, stopAt: Date.now(), timer: timerPause(cur.timer) });
    }
  }, [setMg]);

  const nameOf = useCallback((id) => players.find((p) => p.id === id)?.name || '—', [players]);

  return { players, mg, setMg, log, addTokens, addScore, toggleStop, nameOf, stopped: !!mg.stop };
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
  return base;
}

// Αν είναι ενεργό το alcoholFree, τα «σφηνάκια» γίνονται χυμό-σφηνάκια.
export const drinkText = (text, alcoholFree) => (alcoholFree ? String(text).replace(/σφηνάκια?/gi, 'χυμό-σφηνάκι') : text);
