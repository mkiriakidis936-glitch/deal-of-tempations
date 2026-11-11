mport React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const SHOW_MS = 5000;

export default function PajamaRevealOverlay() {
  const [data, setData] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const { items } = await base44.entities.AppSetting.filter({ key: 'pajama_reveal' }, { limit: 1 });
        if (!alive) return;
        const raw = items?.[0]?.value;
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.id) setData(parsed);
      } catch (e) {
        /* silent */
      }
    }
    load();
    const loader = setInterval(load, 2500);
    const clock = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { alive = false; clearInterval(loader); clearInterval(clock); };
  }, []);

  const visible = data?.startedAt && Date.now() - data.startedAt < SHOW_MS;
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-background/95 flex flex-col items-center justify-center p-8 text-center comic-slide-in">
      <div className="relative z-10 max-w-4xl w-full space-y-6">
        <div className="text-6xl">🩴</div>
        <div className="font-display text-4xl md:text-6xl text-tarot-gold tracking-[0.18em]">
          PAJAMA PEDI-GLAM
        </div>
        <div className="font-heading text-lg md:text-2xl text-foreground/70 tracking-[0.3em] uppercase">
          Οι εκλεκτές της βραδιάς
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-2">
          {(data.names || []).map((n, i) => (
            <span
              key={`${n}-${i}`}
              className="font-heading text-3xl md:text-5xl text-tarot-gold comic-pop"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              {n}
            </span>
          ))}
        </div>
        <div className="text-sm tracking-[0.4em] text-tarot-gold/60 pt-4">✦ ✦ ✦</div>
      </div>
    </div>
  );
}