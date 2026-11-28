import React, { useEffect, useState } from 'react';
import { PlayerAvatar } from '@/components/modes/MovieGameUI';

// 10.5.0 · Κίνηση της Ταινίας στην TV, με δικό της χρονόμετρο (requestAnimationFrame).
// ΔΕΝ βασίζεται σε CSS transition/animation, που τα σβήνει το «iOS flat layer» του app.css.
// Η πρόοδος βγαίνει από το «at» της κατάστασης: αν η TV ανοίξει στη μέση, συνεχίζει από το σωστό σημείο.
// Μόνο εμφάνιση· καμία ενέργεια, καμία αλλαγή στην κατάσταση του παιχνιδιού.

export const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
export const easeOutQuint = (k) => 1 - Math.pow(1 - k, 5);
export const easeOutBack = (k) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// 0 → 1 μέσα σε «ms» από τη στιγμή «at». Ξαναζωγραφίζει όσο τρέχει, σταματά όταν φτάσει στο 1.
export function useProgress(at, ms) {
  const calc = () => (!at || reduced() ? 1 : Math.max(0, Math.min(1, (Date.now() - at) / ms)));
  const [p, setP] = useState(calc);
  useEffect(() => {
    let raf = 0;
    const tick = () => { const v = calc(); setP(v); if (v < 1) raf = requestAnimationFrame(tick); };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [at, ms]);
  return p;
}

// ---------- 🎲 Ζάρι ----------
const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const FACE_ROT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
function Face({ n, transform, size }) {
  return (
    <div className="gx-die-face" style={{ transform, width: size, height: size }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <span key={i} className={PIPS[n].includes(i) ? 'gx-pip' : ''} />)}
    </div>
  );
}
// Κυλάει «ms» και σταματά ακριβώς στην όψη «value», με μικρό αναπήδημα στο τέλος.
export function RollingDie({ value = 1, at = 0, ms = 2400, size = 'min(14vw, 24vh)' }) {
  const p = useProgress(at, ms);
  const [x0, y0] = FACE_ROT[value] || FACE_ROT[1];
  const k = easeOutCubic(p);
  const rx = (x0 - 720 - 18) * k;
  const ry = (y0 + 1080 + 22) * k;
  const hop = Math.abs(Math.sin(p * Math.PI * 3)) * (1 - p) * 14; // αναπηδήματα που σβήνουν
  const half = `calc(${size} / 2)`;
  return (
    <div className="gx-die-stage" style={{ width: size, height: size, transform: `translateY(-${hop}%)` }}>
      <div className="gx-die" style={{ width: size, height: size, transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
        <Face n={1} size={size} transform={`translateZ(${half})`} />
        <Face n={6} size={size} transform={`rotateY(180deg) translateZ(${half})`} />
        <Face n={2} size={size} transform={`rotateY(90deg) translateZ(${half})`} />
        <Face n={5} size={size} transform={`rotateY(-90deg) translateZ(${half})`} />
        <Face n={3} size={size} transform={`rotateX(90deg) translateZ(${half})`} />
        <Face n={4} size={size} transform={`rotateX(-90deg) translateZ(${half})`} />
      </div>
    </div>
  );
}

// ---------- 🎡 Τροχός: γωνία περιστροφής (μοίρες) για τώρα ----------
export function useWheelAngle(at, ms, target) {
  const p = useProgress(at, ms);
  return { angle: target * easeOutQuint(p), done: p >= 1 };
}

// ---------- 💼 Βαλιτσάκι που ανοίγει ----------
// 0–0.35: τρέμει · 0.35–0.7: το καπάκι ανοίγει · 0.6–1: η τιμή ανεβαίνει μέσα από το βαλιτσάκι.
export function OpeningCase({ no, label, kind = 'normal', at, ms = 2600, size = 'min(22vw, 34vh)' }) {
  const p = useProgress(at, ms);
  const shake = p < 0.35 ? Math.sin(p * 120) * 3 * (1 - p / 0.35) : 0;
  const lid = Math.max(0, Math.min(1, (p - 0.35) / 0.35));
  const rise = Math.max(0, Math.min(1, (p - 0.6) / 0.4));
  const tone = kind === 'big' ? '#E8C26B' : kind === 'trap' ? '#FF3B5C' : '#F5F1E8';
  return (
    <div className="relative" style={{ width: size, height: `calc(${size} * 0.78)`, perspective: '1200px', transform: `rotate(${shake}deg)` }}>
      {/* λάμψη από μέσα */}
      <div className="absolute inset-x-[8%] top-[18%] rounded-full" style={{ height: '40%', background: `radial-gradient(closest-side, ${tone}, transparent)`, opacity: lid * 0.9, filter: 'blur(18px)' }} />
      {/* η τιμή */}
      <div className="absolute inset-x-[10%] z-[1] flex items-center justify-center rounded-2xl text-center font-black"
        style={{ top: '22%', height: '34%', transform: `translateY(${-70 * easeOutBack(rise)}%) scale(${0.7 + 0.3 * easeOutBack(rise)})`, opacity: rise, background: 'linear-gradient(180deg,#1C1C1E,#0b0b0d)', border: `2px solid ${tone}`, color: tone, fontSize: `calc(${size} * 0.11)`, boxShadow: `0 0 40px ${tone}88`, padding: '0 4%' }}>
        <span className="line-clamp-2" style={{ lineHeight: 1.05 }}>{label}</span>
      </div>
      {/* σώμα */}
      <div className="absolute inset-x-0 bottom-0 rounded-[10%]" style={{ height: '64%', background: 'linear-gradient(180deg,#2E2A22,#14120E)', border: '3px solid #C99B2E', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.18), 0 18px 40px rgba(0,0,0,.7)' }}>
        <div className="absolute inset-x-[42%] top-[12%] rounded" style={{ height: '10%', background: '#C99B2E' }} />
      </div>
      {/* καπάκι με μεντεσέ στο πάνω μέρος του σώματος: μπροστά χρυσό με αριθμό, πίσω σκούρα επένδυση */}
      <div className="absolute inset-x-0 z-[2]" style={{ top: '6%', height: '34%', transformOrigin: '50% 100%', transformStyle: 'preserve-3d', transform: `rotateX(${-118 * easeOutCubic(lid)}deg)` }}>
        <div className="absolute inset-0 flex items-center justify-center rounded-[10%] font-black"
          style={{ background: 'linear-gradient(180deg,#FFF1C7,#E8C26B 55%,#C99B2E)', border: '3px solid #8a6a1e', color: '#1c1405', fontSize: `calc(${size} * 0.16)`, backfaceVisibility: 'hidden', boxShadow: '0 -6px 20px rgba(0,0,0,.4)' }}>
          <span className="absolute left-1/2 -translate-x-1/2 rounded-t-md" style={{ top: '-22%', width: '26%', height: '22%', border: '3px solid #8a6a1e', borderBottom: 0 }} />
          {no}
        </div>
        <div className="absolute inset-0 rounded-[10%]" style={{ transform: 'rotateX(180deg)', backfaceVisibility: 'hidden', background: 'linear-gradient(180deg,#3a0f18,#14060a)', border: '3px solid #8a6a1e', boxShadow: `inset 0 0 30px ${tone}55` }} />
      </div>
    </div>
  );
}

// ---------- 🎰 Κλήρωση: ρουλέτα με τις παίκτριες ----------
// Οι κάρτες περνούν όλο και πιο αργά κάτω από τον προβολέα και σταματούν στη νικήτρια («winner» είναι ήδη γνωστή).
export function DrawRoulette({ players = [], winner, at, ms = 3800, colorOf = () => '#E8C26B', u }) {
  const p = useProgress(at, ms);
  const list = players.length ? players : [{ id: winner, name: '?' }];
  const n = list.length;
  const wi = Math.max(0, list.findIndex((pl) => pl.id === winner));
  const laps = Math.max(3, Math.ceil(24 / Math.max(1, n)));
  const total = laps * n + wi; // πόσες θέσεις θα περάσουν
  const pos = total * easeOutQuint(p); // τρέχουσα θέση (δεκαδική)
  const landed = p >= 1;
  const slots = [-2, -1, 0, 1, 2];
  const cardW = u(13);
  return (
    <div className="relative flex items-center justify-center" style={{ height: u(17), width: '100%' }}>
      <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-[28px]" style={{ width: `calc(${cardW} * 1.18)`, background: 'radial-gradient(closest-side, rgba(247,227,168,.28), transparent)', boxShadow: landed ? '0 0 0 3px #E8C26B, 0 0 80px rgba(232,194,107,.6)' : '0 0 0 2px rgba(232,194,107,.5)' }} />
      {slots.map((s) => {
        const frac = pos - Math.floor(pos);
        const idx = (((Math.floor(pos) + s) % n) + n) % n;
        const pl = list[idx];
        const off = s - frac; // -2..2
        const d = Math.abs(off);
        const sc = 1 - Math.min(0.4, d * 0.18);
        return (
          <div key={s} className="absolute flex flex-col items-center justify-center rounded-[24px]"
            style={{ width: cardW, height: u(15), transform: `translateX(calc(${cardW} * ${off * 1.08})) scale(${sc})`, opacity: Math.max(0, 1 - d * 0.38), background: 'linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02)),#141416', border: '1px solid rgba(255,255,255,.12)', gap: u(0.6), zIndex: 10 - Math.round(d * 2) }}>
            <PlayerAvatar name={pl.name} color={colorOf(pl.id)} size={u(6.5)} />
            <div className="truncate font-black" style={{ fontSize: u(1.6), maxWidth: '90%' }}>{pl.name}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- 📱 Κινητό (10.5.2) ----------
// Δόνηση μία φορά ανά γεγονός (κλειδί = «at» της κατάστασης), μόνο αν το γεγονός είναι φρέσκο.
// Δεν δονεί σε STOP, ούτε όταν το κινητό ανοίγει πολύ αργότερα από το γεγονός.
export const vibrate = (pattern) => { try { navigator.vibrate?.(pattern); } catch { /* δεν υποστηρίζεται */ } };
export function useBuzz(at, pattern, { fresh = 8000, off = false, delay = 0 } = {}) {
  useEffect(() => {
    if (!at || off || Date.now() - at > fresh) return undefined;
    const wait = Math.max(0, at + delay - Date.now());
    const t = setTimeout(() => vibrate(pattern), wait);
    return () => clearTimeout(t);
  }, [at]);
}

// Το ζάρι κυλά στο κινητό, μετά εμφανίζεται το τετράγωνο. Ίδια διάρκεια με την TV (2,4″).
export function MobileDice({ roll, ms = 2400, children, off = false }) {
  const p = useProgress(roll.at, ms);
  useBuzz(roll.at, [18, 40, 18, 40, 18], { off, fresh: 4000 });
  useBuzz(roll.at, [70], { off, fresh: 4000, delay: ms });
  return (
    <div className="mt-3 flex items-center gap-4 rounded-2xl bg-black/40 p-3">
      <div className="flex shrink-0 items-center justify-center" style={{ width: 84, height: 84, perspective: 500 }}><RollingDie value={roll.value} at={roll.at} ms={ms} size="52px" /></div>
      <div className="min-w-0 flex-1">
        {p < 1 ? <div className="text-lg font-black text-[#F7E3A8]">Το ζάρι κυλάει…</div> : children}
      </div>
    </div>
  );
}
