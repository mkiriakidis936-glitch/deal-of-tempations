import React, { useEffect, useRef, useState } from 'react';

export default function PajamaTimer({ seconds, autoStart = false, onTick, onComplete }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const firedRef = useRef(false);

  useEffect(() => {
    setLeft(seconds);
    setRunning(autoStart);
    firedRef.current = false;
  }, [seconds, autoStart]);

  useEffect(() => {
    if (!running || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [running, left]);

  useEffect(() => {
    if (onTick) onTick(left);
  }, [left]);

  useEffect(() => {
    if (left === 0 && !firedRef.current) {
      firedRef.current = true;
      if (onComplete) onComplete();
    }
  }, [left]);

  const pct = seconds ? (left / seconds) * 100 : 0;
  const done = left <= 0;

  return (
    <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3">
      <div className="flex items-center justify-between">
        <span className={`font-heading text-3xl ${done ? 'text-pink-300 animate-pulse' : 'text-pink-100'}`}>
          {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
        </span>
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={done}
          className="px-4 py-2 rounded-lg font-heading text-sm bg-pink-600 text-white disabled:opacity-40"
        >
          {running ? '⏸ ΠΑΥΣΗ' : '▶ ΕΝΑΡΞΗ'}
        </button>
      </div>
      <div className="h-2 mt-2 rounded bg-pink-900 overflow-hidden">
        <div className="h-full bg-pink-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}