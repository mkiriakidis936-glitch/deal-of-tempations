import React, { useEffect, useState } from 'react';
import { MODE_THEMES, modeMeta, ACT_META } from '@/data/modes/modeRegistry';
import { fmt, timerLeft, useTick, setGameStopActive } from '@/lib/modeKit';
import GameDurationClock from '@/components/shared/GameDurationClock';

// Κοινό περίβλημα όλων των νέων modes: τίτλος, χρονόμετρο, ΣΤΟΠ για όλες, ημερολόγιο γεγονότων.
export default function ModeShell({ modeId, ctx, state, act, children, onQR, onEnd, showTimer = true }) {
  const theme = MODE_THEMES[modeId] || MODE_THEMES.lockdown;
  const meta = modeMeta(modeId);
  const actTitle = modeId === 'marathon_4h' && act === 'board' ? 'Act 1 · Pajama Pedi-Glam' : modeId === 'marathon_4h' && act === 'lockdown' ? 'Act 3 · Pajama Lockdown (18+)' : (ACT_META[act]?.title || act);
  const [showLog, setShowLog] = useState(false);
  const { mg, stopped, toggleStop, centralStopped } = ctx;
  useEffect(() => { setGameStopActive(stopped); }, [stopped]);
  useTick(!!mg.timer && showTimer);
  const left = timerLeft(mg.timer);
  const danger = mg.timer && left <= 60;

  return (
    <div className="mode-shell min-h-screen p-3 pb-28 text-foreground" style={{ background: theme.bg }}>
      <GameDurationClock state={state} />
      <div className="max-w-5xl mx-auto space-y-3">
        <header className="flex items-center justify-between gap-3 pr-28">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-2xl sm:text-4xl min-w-0">
              {meta?.icon && <span className="shrink-0">{meta.icon}</span>}
              <span className="mode-large-title truncate">{meta?.name}</span>
            </div>
            {act && <div className="text-xs sm:text-sm opacity-70 font-body">{actTitle}</div>}
          </div>
          {showTimer && mg.timer && (
            <div
              className={`mode-timer text-3xl sm:text-5xl ${danger ? 'is-danger comic-pulse' : ''}`}
            >
              {fmt(left)}
            </div>
          )}
        </header>

        {children}
      </div>

      <button
        onClick={toggleStop}
        disabled={centralStopped}
        className="fixed top-3 right-3 z-50 comic-boom font-ui text-xs px-5 py-2.5 bg-destructive text-destructive-foreground disabled:opacity-80"
        aria-label="Στοπ"
      >
        {centralStopped ? '⏸ ΠΑΥΣΗ DIRECTOR' : stopped ? '▶ ΣΥΝΕΧΕΙΑ' : '⏹ ΣΤΟΠ'}
      </button>

      <div className="fixed bottom-3 left-3 right-3 z-40 flex justify-center gap-2">
        {onQR && <button onClick={onQR} className="comic-boom font-ui text-xs px-4 py-2 bg-secondary">📱 QR</button>}
        <button onClick={() => setShowLog(true)} className="comic-boom font-ui text-xs px-4 py-2 bg-secondary">📜 Ιστορικό</button>
        {onEnd && (
          <button
            onClick={() => { if (window.confirm('Να κλείσει το παιχνίδι και να αρχειοθετηθεί η συνεδρία;')) onEnd(); }}
            className="comic-boom font-ui text-xs px-4 py-2 bg-secondary"
          >
            🏁 Τέλος
          </button>
        )}
      </div>

      {stopped && (
        <div className="mode-stop-overlay fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="font-display text-5xl sm:text-7xl text-white comic-pulse">⏸ ΣΤΟΠ</div>
          <p className="text-lg sm:text-2xl font-body text-white max-w-xl">
            Όλα σταματούν αμέσως. Όλες επιβεβαιώνουν ότι είναι καλά και συνεχίζετε μόνο όταν όλες συμφωνούν.
          </p>
          {centralStopped
            ? <div className="rounded-lg bg-black/40 px-5 py-3 text-sm text-white">Η παύση ελέγχεται αποκλειστικά από τον Director.</div>
            : <button onClick={toggleStop} className="comic-boom font-heading text-xl px-8 py-4 bg-white text-black">▶ ΣΥΝΕΧΕΙΑ ΟΛΕΣ ΟΚ</button>}
        </div>
      )}

      {showLog && (
        <div className="fixed inset-0 z-[70] bg-black/80 p-4 overflow-y-auto" onClick={() => setShowLog(false)}>
          <div className="max-w-md mx-auto comic-panel bg-card p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="font-heading text-xl mb-2">📜 Ιστορικό</div>
            {(mg.log || []).length === 0 && <div className="text-sm opacity-60">Δεν έχει γίνει κάτι ακόμα.</div>}
            {(mg.log || []).map((l, i) => (
              <div key={i} className="text-sm border-b border-border/40 py-1">
                <span className="opacity-50 text-xs mr-2">{new Date(l.t).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                {l.text}
              </div>
            ))}
            <button onClick={() => setShowLog(false)} className="w-full mt-3 py-2 comic-boom bg-secondary font-heading">Κλείσιμο</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Κοινή υπενθύμιση ασφάλειας για κάθε ψηφιακή πρόκληση.
export function RestraintNote() {
  return (
    <div className="rounded-md border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-xs sm:text-sm text-amber-100 font-body">
      Οι προκλήσεις είναι προαιρετικές, χωρίς σωματική επαφή ή περιορισμό κίνησης. PASS και STOP είναι πάντα διαθέσιμα.
    </div>
  );
}

export function Panel({ title, children, className = '', accent }) {
  return (
    <section className={`comic-panel bg-card/90 p-3 sm:p-4 space-y-2 ${className}`} style={accent ? { borderColor: accent } : undefined}>
      {title && <h3 className="font-heading text-lg sm:text-xl">{title}</h3>}
      {children}
    </section>
  );
}

export function Btn({ children, color = 'bg-secondary', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`comic-boom font-heading text-sm px-4 py-2.5 select-none disabled:opacity-40 disabled:pointer-events-none ${color} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
