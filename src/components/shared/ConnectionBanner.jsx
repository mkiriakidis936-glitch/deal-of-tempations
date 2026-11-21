import React, { useEffect, useRef, useState } from 'react';
import { realtimeHealth } from '@/api/base44Client';
import { getPendingWrites, subscribePendingWrites } from '@/lib/connectionStatus';

// Μικρή ειδοποίηση σύνδεσης: εμφανίζεται ΜΟΝΟ όταν κάτι δεν πάει καλά (χωρίς δίκτυο, αλλαγές σε αναμονή, επανασύνδεση).
export function useConnectionStatus() {
  const [pending, setPending] = useState(getPendingWrites());
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  const [live, setLive] = useState(true);
  const downSince = useRef(null);

  useEffect(() => subscribePendingWrites(setPending), []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const timer = setInterval(() => {
      const health = realtimeHealth();
      const ok = !health.subscriptions || (health.state === 'open' && Date.now() - (health.lastSeen || 0) < 45000);
      if (ok) { downSince.current = null; setLive(true); return; }
      downSince.current = downSince.current || Date.now();
      setLive(Date.now() - downSince.current < 6000); // σύντομες αναλαμπές δεν εμφανίζονται
    }, 3000);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      clearInterval(timer);
    };
  }, []);

  return { pending, online, live, ok: online && live && !pending };
}

export default function ConnectionBanner({ className = '' }) {
  const { pending, online, live, ok } = useConnectionStatus();
  if (ok) return null;
  const text = !online
    ? `Χωρίς σύνδεση${pending ? ` · ${pending} ${pending === 1 ? 'κίνηση' : 'κινήσεις'} σε αναμονή` : ''} — θα σταλούν μόλις επανέλθει`
    : pending
      ? `Αποστολή ${pending} ${pending === 1 ? 'κίνησης' : 'κινήσεων'} σε αναμονή…`
      : !live ? 'Επανασύνδεση…' : '';
  return (
    <div
      role="status"
      className={`fixed left-1/2 z-[200] -translate-x-1/2 rounded-full px-4 py-2 text-[14px] font-semibold ${className}`}
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)', background: '#2C1A00', color: '#FFD60A', border: '1px solid rgba(255,214,10,.5)' }}
    >
      ⚠️ {text}
    </div>
  );
}
