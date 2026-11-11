import React, { useEffect, useRef, useState } from 'react';

// Δείχνει περιεχόμενο σχεδιασμένο για 1280x720 μέσα σε μικρότερο κουτί (preview οθόνης TV).
export default function ScaledFrame({ children, className = '' }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => setScale(el.clientWidth / 1280);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative w-full aspect-video overflow-hidden rounded-lg border-2 border-border bg-background ${className}`}>
      <div
        className="absolute top-0 left-0"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1280, height: 720 }}
      >
        {children}
      </div>
    </div>
  );
}