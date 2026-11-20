import React, { useState } from 'react';
import { reloadToLatest, useUpdateAvailable } from '@/lib/appVersion';

export default function UpdateBanner() {
  const update = useUpdateAvailable();
  const [hidden, setHidden] = useState('');
  if (!update || hidden === update.build) return null;
  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-[200] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#E8C26B]/40 bg-[#1C1C1E] px-4 py-3 text-sm text-white" role="status">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">Νέα έκδοση {update.version}</div>
        <div className="text-xs text-white/60">Ανανέωσε για να πάρεις τις τελευταίες αλλαγές.</div>
      </div>
      <button type="button" onClick={() => setHidden(update.build)} className="rounded-full px-3 py-2 text-xs text-white/70">Αργότερα</button>
      <button type="button" onClick={reloadToLatest} className="rounded-full bg-[#E8C26B] px-4 py-2 text-xs font-bold text-black">Ανανέωση</button>
    </div>
  );
}
