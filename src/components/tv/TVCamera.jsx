import React, { useEffect, useRef, useState } from 'react';
import { watchCamera } from '@/lib/liveCamera';

// TV: δείχνει τη ζωντανή κάμερα του Tablet (γωνία ή πλήρης οθόνη). Κρύβεται αμέσως σε ΣΤΟΠ.
export default function TVCamera({ sessionCode, camera, hidden }) {
  const video = useRef(null);
  const [status, setStatus] = useState('connecting');
  const active = !!(camera?.live && camera.camId && sessionCode && !hidden);

  useEffect(() => {
    if (!active) return undefined;
    return watchCamera({
      sessionCode,
      camId: camera.camId,
      onStatus: setStatus,
      onStream: (stream) => {
        if (!video.current) return;
        video.current.srcObject = stream;
        video.current.play().catch(() => {});
      },
    });
  }, [active, sessionCode, camera?.camId]);

  if (!active) return null;
  const full = camera.layout === 'full';
  return (
    <div
      className={full ? 'fixed inset-0 z-[70] bg-black' : 'fixed bottom-16 right-6 z-[70] overflow-hidden rounded-2xl border-2 bg-black'}
      style={full ? undefined : { width: '30vw', aspectRatio: '16 / 9', borderColor: 'var(--ui-red, #FF453A)' }}
    >
      <video ref={video} muted playsInline autoPlay className="h-full w-full object-cover" />
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className="ui-tv-live">● ΚΑΜΕΡΑ LIVE</span>
      </div>
      {status !== 'live' && (
        <div className="absolute inset-0 flex items-center justify-center ui-tv-muted">
          {status === 'retry' ? 'Επανασύνδεση με την κάμερα…' : 'Σύνδεση με την κάμερα…'}
        </div>
      )}
    </div>
  );
}
