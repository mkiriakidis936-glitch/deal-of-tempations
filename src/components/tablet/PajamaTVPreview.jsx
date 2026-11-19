import React, { useEffect, useRef, useState } from 'react';
import PajamaTV from '@/components/tv/PajamaTV';

export default function PajamaTVPreview({ players, pj }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(0.5);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const fit = () => setScale((boxRef.current?.clientWidth || 640) / 1280);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-40 px-3 py-2 rounded-xl font-heading text-sm bg-slate-900/90 border border-pink-400/60 text-pink-100"
      >
        👁 TV PREVIEW
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-black/85 p-4 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-heading text-lg text-pink-100">ΟΘΟΝΗ TV</div>
              <button onClick={() => setOpen(false)} className="px-3 py-1 rounded-lg bg-rose-900 text-rose-100 text-sm font-bold">
                ✕ ΚΛΕΙΣΙΜΟ
              </button>
            </div>
            <div ref={boxRef} className="relative w-full aspect-video overflow-hidden rounded-xl border border-pink-500/40 bg-background">
              <div
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1280, height: 720 }}
                className="p-4"
              >
                <PajamaTV players={players} pj={pj} />
              </div>
            </div>
            <div className="text-center text-[11px] text-pink-300/70 mt-2">
              Ό,τι βλέπει η τηλεόραση αυτή τη στιγμή.
            </div>
          </div>
        </div>
      )}
    </>
  );
}