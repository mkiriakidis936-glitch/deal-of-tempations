import React, { useEffect, useState } from 'react';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import { getRemaining, formatClock } from '@/lib/syncTimer';

const PRESETS = [30, 60, 90, 120, 180, 300];

const EXPIRE_OPTIONS = [
  { id: 'none', label: 'ΤΙΠΟΤΑ' },
  { id: 'penalty_all', label: '⚠️ +1 ΠΟΙΝΗ ΣΕ ΟΛΕΣ' },
  { id: 'bomb', label: '💣 BOMB EVENT' },
  { id: 'flashbang', label: '⚡ FLASHBANG' },
];

export default function SyncTimerControl({ state, updateState, onClose }) {
  const timer = state.syncTimer;
  const [duration, setDuration] = useState(timer?.duration || 60);
  const [label, setLabel] = useState(timer?.label || '');
  const [onExpire, setOnExpire] = useState(timer?.onExpire || 'none');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const remaining = getRemaining(timer, now);

  function start() {
    updateState({ syncTimer: { duration, endsAt: Date.now() + duration * 1000, running: true, remaining: duration, label, onExpire } });
  }
  function chooseExpire(id) {
    setOnExpire(id);
    if (timer) updateState({ syncTimer: { ...timer, onExpire: id } });
  }
  function pause() {
    updateState({ syncTimer: { ...timer, running: false, remaining } });
  }
  function resume() {
    updateState({ syncTimer: { ...timer, running: true, endsAt: Date.now() + remaining * 1000 } });
  }
  function reset() {
    updateState({ syncTimer: null });
  }

  return (
    <div className="fixed inset-0 z-[70] bg-background/70 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-w-md w-full max-h-[85vh] overflow-y-auto space-y-3">
        <div className="comic-panel ds-sheen px-5 py-4">
          <div className="ds-eyebrow text-primary/80">Χρονόμετρο</div>
          <div className="ds-title mt-1 text-2xl text-foreground">Συγχρονισμένο</div>
          <div className="ds-label mt-2">Τρέχει ταυτόχρονα σε Tablet, TV και κινητά</div>
        </div>

        <ComicPanel className={`text-center py-4 ${timer?.running ? 'bg-tarot-crimson' : 'bg-card'}`}>
          <div className="font-heading text-xs tracking-widest text-tarot-gold">
            {!timer ? 'ΑΝΕΝΕΡΓΟ' : timer.running ? 'ΤΡΕΧΕΙ' : 'ΠΑΥΣΗ'}
          </div>
          <div className="ds-value text-6xl leading-none text-primary">{formatClock(remaining)}</div>
          {timer?.label && <div className="ds-label mt-2">{timer.label}</div>}
        </ComicPanel>

        <ComicPanel>
          <div className="ds-label mb-2">Διάρκεια</div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setDuration(p)}
                className={`comic-panel-sm p-2 text-center ds-value text-lg ${duration === p ? 'border-primary/45 bg-primary/12 text-primary' : ''}`}
              >
                {formatClock(p)}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ετικέτα (π.χ. ΑΝΑΚΡΙΣΗ)"
            className="mt-2 w-full rounded-md border border-primary/20 bg-input px-3 py-1.5 font-ui text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
          />
        </ComicPanel>

        <ComicPanel>
          <div className="ds-label mb-2">Όταν λήξει → αυτόματα</div>
          <div className="grid grid-cols-2 gap-1.5">
            {EXPIRE_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => chooseExpire(o.id)}
                className={`comic-panel-sm p-2 text-[11px] font-bold ${onExpire === o.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </ComicPanel>

        <div className="grid grid-cols-2 gap-2">
          {!timer?.running && remaining > 0 && timer ? (
            <ComicButton variant="green" size="lg" onClick={resume}>▶ ΣΥΝΕΧΕΙΑ</ComicButton>
          ) : (
            <ComicButton variant="green" size="lg" onClick={start} disabled={!duration}>▶ ΕΝΑΡΞΗ</ComicButton>
          )}
          <ComicButton variant="yellow" size="lg" onClick={pause} disabled={!timer?.running}>⏸ ΠΑΥΣΗ</ComicButton>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ComicButton variant="dark" size="sm" onClick={reset} disabled={!timer}>↺ ΜΗΔΕΝΙΣΜΟΣ</ComicButton>
          <ComicButton variant="red" size="sm" onClick={onClose}>✕ ΚΛΕΙΣΙΜΟ</ComicButton>
        </div>
      </div>
    </div>
  );
}