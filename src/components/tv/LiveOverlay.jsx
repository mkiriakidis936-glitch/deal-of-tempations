import { useState, useEffect } from 'react';

export default function LiveOverlay({ viewers = 1337 }) {
  const [time, setTime] = useState(new Date());
  const [viewerCount, setViewerCount] = useState(viewers);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const viewerTimer = setInterval(() => {
      setViewerCount(v => Math.max(100, v + Math.floor(Math.random() * 7) - 3));
    }, 4000);
    return () => { clearInterval(timer); clearInterval(viewerTimer); };
  }, []);

  const timeStr = time.toLocaleTimeString('el-GR');

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-primary/15 bg-surface-1/85 px-4 py-1.5 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 rounded-sm border border-destructive/40 px-2 py-0.5 ds-label text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive comic-pulse" />
          Live
        </div>
        <div className="ds-value font-mono text-[11px] text-foreground/60">{timeStr}</div>
      </div>
      <div className="flex items-center gap-2.5 ds-label text-foreground/50">
        <span>👁 {viewerCount.toLocaleString()}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">Deal TV</span>
      </div>
    </div>
  );
}