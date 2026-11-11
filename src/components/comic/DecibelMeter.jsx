import { useState, useEffect, useRef, useCallback } from 'react';

export default function DecibelMeter({ onThreshold, threshold = 0.6, label = 'DECIBEL METER', size = 'md' }) {
  const [active, setActive] = useState(false);
  const [level, setLevel] = useState(0);
  const [exceeded, setExceeded] = useState(false);
  const [denied, setDenied] = useState(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const exceededRef = useRef(false);
  const onThresholdRef = useRef(onThreshold);

  useEffect(() => { onThresholdRef.current = onThreshold; }, [onThreshold]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setActive(false);
    setLevel(0);
    setExceeded(false);
    exceededRef.current = false;
  }, []);

  const start = useCallback(async () => {
    setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setActive(true);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
        setLevel(avg);
        if (avg > threshold && !exceededRef.current) {
          exceededRef.current = true;
          setExceeded(true);
          onThresholdRef.current?.(avg);
        } else if (avg < threshold * 0.4) {
          exceededRef.current = false;
          setExceeded(false);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.error('Mic access denied', e);
      setDenied(true);
    }
  }, [threshold]);

  useEffect(() => () => stop(), [stop]);

  const pct = Math.min(100, level * 200);
  const sizeClass = size === 'lg' ? 'h-8' : 'h-4';

  return (
    <div className="comic-panel-sm p-3 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-heading text-sm text-primary">🎤 {label}</div>
        <button
          onClick={active ? stop : start}
          className={`comic-boom font-heading px-2 py-1 text-xs ${active ? 'bg-destructive text-foreground' : 'bg-tarot-forest text-foreground'}`}
        >
          {active ? '⏹ STOP' : '▶ START'}
        </button>
      </div>
      {denied && <div className="text-xs text-destructive font-bold mb-1 font-body">❌ Άρνηση πρόσβασης στο μικρόφωνο.</div>}
      {active && (
        <>
          <div className={`w-full ${sizeClass} bg-foreground/10 rounded-full overflow-hidden border-2 border-border`}>
            <div
              className={`h-full transition-all ${exceeded ? 'bg-destructive comic-pulse' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {exceeded && <div className="text-xs font-bold text-destructive mt-1 comic-pulse font-body">⚠️ ΠΑΡΑΠΑΝΩ ΑΠΟ ΚΑΤΩΦΛΙ — +ΠΟΙΝΗ!</div>}
        </>
      )}
    </div>
  );
}