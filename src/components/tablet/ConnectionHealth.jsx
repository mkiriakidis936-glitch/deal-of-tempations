import React, { useEffect, useState } from 'react';
import { request } from '@/api/apiClient';
import { DockItem, Card, Button, Badge } from '@/design/ui';
import { useConnectionStatus } from '@/components/shared/ConnectionBanner';

// Tablet: ποια κινητά είναι συνδεδεμένα τώρα και αν το ίδιο το Tablet είναι online.
export default function ConnectionHealth({ sessionCode, players = [] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState({});
  const [error, setError] = useState(false);
  const status = useConnectionStatus();

  useEffect(() => {
    if (!sessionCode) return undefined;
    let alive = true;
    const load = () => request('GET', `/api/entities/player-presence/${encodeURIComponent(sessionCode)}`)
      .then((data) => { if (!alive) return; setError(false); setSeen(Object.fromEntries((data.players || []).map((p) => [p.playerId, p.lastSeenAt]))); })
      .catch(() => { if (alive) setError(true); });
    load();
    const timer = setInterval(load, 10000);
    return () => { alive = false; clearInterval(timer); };
  }, [sessionCode]);

  const connected = players.filter((p) => seen[p.id]).length;
  const allGood = status.ok && !error && connected === players.length;
  const ago = (at) => { const s = Math.max(0, Math.round((Date.now() - at) / 1000)); return s < 5 ? 'μόλις τώρα' : `πριν ${s}″`; };

  return (
    <>
      <DockItem order={4} fallbackClassName="fixed bottom-60 left-3 z-[65]">
        <button type="button" className="ui-btn" onClick={() => setOpen(true)} aria-label="Κατάσταση συνδέσεων">
          {allGood ? '🟢' : '🟠'} Συνδέσεις {connected}/{players.length}
        </button>
      </DockItem>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="ui-title" style={{ fontSize: 22 }}>Συνδέσεις</div>
            <div className="ui-list">
              <div className="ui-row"><span className="ui-row__title">📟 Αυτό το Tablet</span>{status.ok ? <Badge tone="green">Online</Badge> : <Badge tone="red">{!status.online ? 'Χωρίς δίκτυο' : status.pending ? `${status.pending} σε αναμονή` : 'Επανασύνδεση'}</Badge>}</div>
              {players.map((p) => (
                <div key={p.id} className="ui-row">
                  <span className="ui-row__title">📱 {p.name}</span>
                  {seen[p.id] ? <Badge tone="green">{ago(seen[p.id])}</Badge> : <Badge tone="red">Δεν είναι συνδεδεμένη</Badge>}
                </div>
              ))}
            </div>
            <p className="ui-subtitle" style={{ fontSize: 13 }}>
              Κάθε κινητό στέλνει σήμα κάθε 15″. Αν μια παίκτρια φαίνεται εκτός, ας ανοίξει ξανά τη σελίδα του παιχνιδιού.
              Αν πέσει το WiFi, οι κινήσεις κρατιούνται και στέλνονται μόλις επανέλθει.
            </p>
            <Button variant="ghost" block onClick={() => setOpen(false)}>Κλείσιμο</Button>
          </Card>
        </div>
      )}
    </>
  );
}
